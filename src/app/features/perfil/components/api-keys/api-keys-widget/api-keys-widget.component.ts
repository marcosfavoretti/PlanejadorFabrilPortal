import { Component, DestroyRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CreateApiKeyDto, CreateApiKeyDtoCargosEnum, CreatedApiKeyDto } from '@/api/auth';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { ConfirmationService, ToastMessageOptions } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessagesModule } from 'primeng/messages';
import { finalize } from 'rxjs';
import { ApiKeyRow, toApiKeyRows } from '../../../models/api-key.model';
import { ApiKeyApiService, mapApiKeyError } from '../../../services/api-key-api.service';
import { ApiKeyCreateFormComponent } from '../api-key-create-form/api-key-create-form.component';
import { ApiKeySecretDialogComponent } from '../api-key-secret-dialog/api-key-secret-dialog.component';
import { ApiKeyTableComponent } from '../api-key-table/api-key-table.component';

@Component({
  selector: 'app-api-keys-widget',
  standalone: true,
  imports: [
    ConfirmDialogModule,
    MessagesModule,
    ApiKeyCreateFormComponent,
    ApiKeySecretDialogComponent,
    ApiKeyTableComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './api-keys-widget.component.html',
  styleUrl: './api-keys-widget.component.css',
})
export class ApiKeysWidgetComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiKeyService = inject(ApiKeyApiService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly userStore = inject(UserstoreService);
  private readonly createForm = viewChild.required(ApiKeyCreateFormComponent);

  // A chave herda os cargos do usuário logado. ADMIN fica fora porque o
  // backend rejeita chaves com esse cargo (403).
  protected readonly inheritedCargos = computed(() => {
    const validCargos = new Set<string>(Object.values(CreateApiKeyDtoCargosEnum));
    const userCargos = this.userStore.item()?.cargosLista ?? [];
    return [...new Set(userCargos)].filter(
      (cargo): cargo is CreateApiKeyDtoCargosEnum =>
        validCargos.has(cargo) && cargo !== CreateApiKeyDtoCargosEnum.ADMIN,
    );
  });

  protected readonly apiKeys = signal<ApiKeyRow[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly busyId = signal<string | null>(null);
  // O segredo vive só neste signal enquanto o modal está aberto.
  protected readonly revealedKey = signal<CreatedApiKeyDto | null>(null);
  protected messages: ToastMessageOptions[] = [];

  ngOnInit(): void {
    this.loadApiKeys();
  }

  protected loadApiKeys(): void {
    this.loading.set(true);
    this.apiKeyService.list()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: response => {
          const rows = toApiKeyRows(Array.isArray(response?.apiKeys) ? response.apiKeys : []);
          this.apiKeys.set(rows);
          this.total.set(response?.total ?? rows.length);
        },
        error: err => {
          this.apiKeys.set([]);
          this.total.set(0);
          this.showError(mapApiKeyError(err, 'Não foi possível carregar as API keys.'));
        },
      });
  }

  protected createApiKey(dto: CreateApiKeyDto): void {
    this.saving.set(true);
    this.apiKeyService.create(dto)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: created => {
          this.createForm().reset();
          this.showSuccess(`API key "${created.name}" criada.`);
          this.revealedKey.set(created);
          this.loadApiKeys();
        },
        error: err => this.showError(mapApiKeyError(err, 'Não foi possível criar a API key.')),
      });
  }

  protected confirmRotate(apiKey: ApiKeyRow): void {
    if (apiKey.status === 'revogada') {
      return;
    }

    this.confirmationService.confirm({
      header: 'Rotacionar API key',
      message: `Rotacionar "${apiKey.name}"? A chave atual para de funcionar imediatamente e uma nova será gerada com os mesmos cargos e validade.`,
      icon: 'pi pi-sync',
      acceptLabel: 'Rotacionar',
      rejectLabel: 'Cancelar',
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.rotate(apiKey),
    });
  }

  protected confirmRevoke(apiKey: ApiKeyRow): void {
    if (apiKey.status === 'revogada') {
      return;
    }

    this.confirmationService.confirm({
      header: 'Revogar API key',
      message: `Revogar "${apiKey.name}"? As integrações que a usam deixam de funcionar.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Revogar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.revoke(apiKey),
    });
  }

  protected closeSecretDialog(): void {
    this.revealedKey.set(null);
  }

  protected showWarning(detail: string): void {
    this.messages = [{ severity: 'warn', summary: 'Atenção', detail }];
  }

  protected showError(detail: string): void {
    this.messages = [{ severity: 'error', summary: 'Erro', detail }];
  }

  private rotate(apiKey: ApiKeyRow): void {
    this.busyId.set(apiKey.id);
    this.apiKeyService.rotate(apiKey.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: rotated => {
          this.showSuccess(`API key "${rotated.name}" rotacionada.`);
          this.revealedKey.set(rotated);
          this.loadApiKeys();
        },
        error: err => {
          this.showError(mapApiKeyError(err, 'Não foi possível rotacionar a API key.'));
          // 409 indica que a lista local está desatualizada (chave já revogada).
          this.loadApiKeys();
        },
      });
  }

  private revoke(apiKey: ApiKeyRow): void {
    this.busyId.set(apiKey.id);
    this.apiKeyService.revoke(apiKey.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.showSuccess(`API key "${apiKey.name}" revogada.`);
          this.loadApiKeys();
        },
        error: err => this.showError(mapApiKeyError(err, 'Não foi possível revogar a API key.')),
      });
  }

  private showSuccess(detail: string): void {
    this.messages = [{ severity: 'success', summary: 'Sucesso', detail }];
  }
}
