import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastMessageOptions } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessagesModule } from 'primeng/messages';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { TotpEnrollment, TwoFactorUserStatus } from '../../../models/two-factor-settings.model';
import { TwoFactorSettingsApiService, mapTwoFactorError } from '../../../services/two-factor-settings-api.service';
import { RecoveryCodesDialogComponent } from '../recovery-codes-dialog/recovery-codes-dialog.component';
import { TotpEnrollmentPanelComponent } from '../totp-enrollment-panel/totp-enrollment-panel.component';
import { TwoFactorCodeDialogComponent } from '../two-factor-code-dialog/two-factor-code-dialog.component';

type CodeAction = 'rotate' | 'disable';

@Component({
  selector: 'app-two-factor-settings',
  standalone: true,
  imports: [
    DatePipe,
    ButtonModule,
    MessagesModule,
    TagModule,
    RecoveryCodesDialogComponent,
    TotpEnrollmentPanelComponent,
    TwoFactorCodeDialogComponent,
  ],
  templateUrl: './two-factor-settings.component.html',
  styleUrl: './two-factor-settings.component.css',
})
export class TwoFactorSettingsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly twoFactorService = inject(TwoFactorSettingsApiService);

  protected readonly status = signal<TwoFactorUserStatus | null>(null);
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly enrollment = signal<TotpEnrollment | null>(null);
  protected readonly pendingAction = signal<CodeAction | null>(null);
  // Códigos em claro: só vivem enquanto o modal está aberto.
  protected readonly recoveryCodes = signal<string[] | null>(null);
  protected messages: ToastMessageOptions[] = [];

  ngOnInit(): void {
    this.loadStatus();
  }

  protected startEnrollment(): void {
    this.busy.set(true);
    this.twoFactorService.startEnrollment()
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: enrollment => this.enrollment.set(enrollment),
        error: err => this.showError(mapTwoFactorError(err, 'Não foi possível iniciar a configuração do 2FA.')),
      });
  }

  protected completeEnrollment(code: string): void {
    const enrollment = this.enrollment();
    if (!enrollment) {
      return;
    }

    this.busy.set(true);
    this.twoFactorService.completeEnrollment(enrollment.enrollmentId, code)
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: result => {
          this.enrollment.set(null);
          this.recoveryCodes.set(result.recoveryCodes);
          this.showSuccess('Autenticação em dois fatores ativada.');
          this.loadStatus();
        },
        error: err => this.showError(mapTwoFactorError(err, 'Código inválido ou configuração expirada. Tente novamente.')),
      });
  }

  protected cancelEnrollment(): void {
    this.enrollment.set(null);
  }

  protected openCodeDialog(action: CodeAction): void {
    this.pendingAction.set(action);
  }

  protected closeCodeDialog(): void {
    if (!this.busy()) {
      this.pendingAction.set(null);
    }
  }

  protected submitCode(code: string): void {
    const action = this.pendingAction();
    if (action === 'rotate') {
      this.rotateRecoveryCodes(code);
    } else if (action === 'disable') {
      this.disable(code);
    }
  }

  protected closeRecoveryCodes(): void {
    this.recoveryCodes.set(null);
  }

  protected showError(detail: string): void {
    this.messages = [{ severity: 'error', summary: 'Erro', detail }];
  }

  private rotateRecoveryCodes(code: string): void {
    this.busy.set(true);
    this.twoFactorService.rotateRecoveryCodes(code)
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: result => {
          this.pendingAction.set(null);
          this.recoveryCodes.set(result.recoveryCodes);
          this.showSuccess('Novos códigos de recuperação gerados. Os anteriores deixaram de valer.');
          this.loadStatus();
        },
        error: err => this.showError(mapTwoFactorError(err, 'Não foi possível gerar novos códigos.')),
      });
  }

  private disable(code: string): void {
    this.busy.set(true);
    this.twoFactorService.disable(code)
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.pendingAction.set(null);
          this.showSuccess('Autenticação em dois fatores desativada.');
          this.loadStatus();
        },
        error: err => this.showError(mapTwoFactorError(err, 'Não foi possível desativar o 2FA.')),
      });
  }

  private loadStatus(): void {
    this.loading.set(true);
    this.twoFactorService.getStatus()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: status => this.status.set(status),
        error: err => {
          this.status.set(null);
          this.showError(mapTwoFactorError(err, 'Não foi possível carregar o status do 2FA.'));
        },
      });
  }

  private showSuccess(detail: string): void {
    this.messages = [{ severity: 'success', summary: 'Sucesso', detail }];
  }
}
