import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserResponseDTO } from '@/api/auth';
import { ResCentroDeCustoDTO } from '@/api/relogio';
import { UserService } from '@/app/core/auth/services/user.service';
import { FolhaHoraExtraAPIService, LiderCentroCustoVinculo, mapFolhaHoraExtraError } from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import { FuncionariosAPIService } from '@/app/features/ponto/services/FuncionariosAPI.service';
import { ButtonModule } from 'primeng/button';
import { MessagesModule } from 'primeng/messages';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastMessageOptions } from 'primeng/api';
import { finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'app-folha-he-lider-centro-custo-widget',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    MessagesModule,
    MultiSelectModule,
    SelectModule,
    TableModule,
  ],
  templateUrl: './folha-he-lider-centro-custo-widget.component.html',
  styleUrl: './folha-he-lider-centro-custo-widget.component.css',
})
export class FolhaHeLiderCentroCustoWidgetComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly funcionariosService = inject(FuncionariosAPIService);
  private readonly folhaHoraExtraService = inject(FolhaHoraExtraAPIService);

  protected readonly users = signal<UserResponseDTO[]>([]);
  protected readonly centrosCusto = signal<ResCentroDeCustoDTO[]>([]);
  protected readonly vinculos = signal<LiderCentroCustoVinculo[]>([]);
  protected readonly usersLoading = signal(false);
  protected readonly centrosLoading = signal(false);
  protected readonly vinculosLoading = signal(false);
  protected readonly saving = signal(false);
  protected messages: ToastMessageOptions[] = [];

  protected readonly userOptions = computed(() =>
    [...this.users()]
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .map(user => ({
        label: `${user.name} (${user.email})`,
        value: user.id,
        user,
      }))
  );

  protected readonly centrosCustoDisponiveis = computed(() =>
    [...this.centrosCusto()]
      .sort((a, b) => a.setor.localeCompare(b.setor, 'pt-BR'))
  );

  protected readonly vinculoForm = this.fb.nonNullable.group({
    usuarioId: this.fb.nonNullable.control('', Validators.required),
    centrosCustoCodigos: this.fb.nonNullable.control<number[]>([], Validators.required),
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadCentrosCusto();
  }

  protected onUserChange(usuarioId: string): void {
    this.vinculoForm.patchValue({
      usuarioId,
      centrosCustoCodigos: [],
    });
    this.loadVinculos();
  }

  protected loadVinculos(): void {
    const usuarioId = this.vinculoForm.controls.usuarioId.value;
    if (!usuarioId) {
      this.vinculos.set([]);
      return;
    }

    this.vinculosLoading.set(true);
    this.folhaHoraExtraService.getLiderCentroCusto(usuarioId).subscribe({
      next: vinculos => {
        this.vinculos.set(vinculos);
        this.vinculoForm.controls.centrosCustoCodigos.setValue(
          vinculos
            .filter(vinculo => vinculo.ativo !== false)
            .map(vinculo => vinculo.centroCustoCodigo),
        );
        this.vinculosLoading.set(false);
      },
      error: err => {
        this.vinculos.set([]);
        this.vinculoForm.controls.centrosCustoCodigos.setValue([]);
        this.vinculosLoading.set(false);
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
      },
    });
  }

  protected vincularCentroCusto(): void {
    if (this.vinculoForm.invalid) {
      this.vinculoForm.markAllAsTouched();
      this.messages = [{ severity: 'warn', summary: 'Atenção', detail: 'Selecione um usuário e pelo menos um centro de custo.' }];
      return;
    }

    const { usuarioId, centrosCustoCodigos } = this.vinculoForm.getRawValue();
    const usuario = this.users().find(item => item.id === usuarioId);
    if (!usuario) {
      this.messages = [{ severity: 'warn', summary: 'Atenção', detail: 'O usuário selecionado não foi encontrado.' }];
      return;
    }

    const codigosVinculados = new Set(
      this.vinculos()
        .filter(item => item.ativo !== false)
        .map(item => item.centroCustoCodigo),
    );
    const novosCodigos = centrosCustoCodigos.filter(codigo => !codigosVinculados.has(codigo));
    if (!novosCodigos.length) {
      this.messages = [{ severity: 'info', summary: 'Sem alterações', detail: 'Os centros selecionados já estão vinculados a este usuário.' }];
      return;
    }

    this.saving.set(true);
    forkJoin(
      novosCodigos.map(centroCustoCodigo =>
        this.folhaHoraExtraService.createLiderCentroCusto({
          usuarioId,
          usuarioNome: usuario.name,
          centroCustoCodigo,
        })
      )
    ).pipe(
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: () => {
        this.vinculoForm.controls.centrosCustoCodigos.setValue([]);
        this.messages = [{
          severity: 'success',
          summary: 'Sucesso',
          detail: `${novosCodigos.length} centro(s) de custo vinculado(s) ao usuário.`,
        }];
        this.loadVinculos();
      },
      error: err => {
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
      },
    });
  }

  protected desativarVinculo(vinculo: LiderCentroCustoVinculo): void {
    this.folhaHoraExtraService.deleteLiderCentroCusto(vinculo.usuarioId, vinculo.centroCustoCodigo).subscribe({
      next: () => {
        this.messages = [{ severity: 'success', summary: 'Sucesso', detail: 'Vinculo desativado.' }];
        this.loadVinculos();
      },
      error: err => this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }],
    });
  }

  private loadUsers(): void {
    this.usersLoading.set(true);
    this.userService.listUsers().subscribe({
      next: users => {
        this.users.set(Array.isArray(users) ? users : []);
        this.usersLoading.set(false);
      },
      error: err => {
        this.users.set([]);
        this.usersLoading.set(false);
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
      },
    });
  }

  private loadCentrosCusto(): void {
    this.centrosLoading.set(true);
    this.funcionariosService.getCentroDeCusto().subscribe({
      next: centros => {
        this.centrosCusto.set(centros);
        this.centrosLoading.set(false);
      },
      error: err => {
        this.centrosCusto.set([]);
        this.centrosLoading.set(false);
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
      },
    });
  }
}
