import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AxiosError } from 'axios';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TwoFactorStepUpService } from '../services/two-factor-step-up.service';
import { TwoFactorFlowOutcome, TwoFactorMethod, TwoFactorRequiredPayload } from './two-factor.types';

type TwoFactorErrorPayload = {
  code?: string;
  message?: string;
  error?: string;
  remainingAttempts?: number;
  statusCode?: number;
};

@Component({
  selector: 'app-two-factor-step-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './two-factor-step-up.component.html',
  styleUrl: './two-factor-step-up.component.css',
})
export class TwoFactorStepUpComponent implements OnInit, OnDestroy {
  @Input({ required: true }) challenge!: TwoFactorRequiredPayload;

  private readonly activeModal = inject(NgbActiveModal);
  private readonly fb = inject(FormBuilder);
  private readonly twoFactorService = inject(TwoFactorStepUpService);
  private cooldownTimer: number | null = null;

  protected readonly codeForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(4)]],
  });

  protected readonly defaultMethod: TwoFactorMethod = 'email';
  protected method: TwoFactorMethod = 'email';
  protected sendPending = false;
  protected verifyPending = false;
  protected sendError = '';
  protected verifyError = '';
  protected maskedEmail = '';
  protected emailSent = false;
  protected cooldownSeconds = 0;

  ngOnInit(): void {
    if (!this.canUseEmail && this.canUseRecoveryCode) {
      this.method = 'recovery_code';
    }
  }

  ngOnDestroy(): void {
    this.clearCooldownTimer();
  }

  protected get expiresAtLabel(): string {
    return new Date(this.challenge.expiresAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected get canUseEmail(): boolean {
    return this.challenge.allowedMethods.includes('email');
  }

  protected get canUseRecoveryCode(): boolean {
    return this.challenge.allowedMethods.includes('recovery_code');
  }

  protected get methodLabel(): string {
    return this.method === 'recovery_code' ? 'recovery code' : 'código por e-mail';
  }

  protected async sendEmail(): Promise<void> {
    if (!this.canUseEmail || this.sendPending || this.cooldownSeconds > 0) {
      return;
    }

    this.sendPending = true;
    this.sendError = '';

    try {
      const response = await this.twoFactorService.sendEmailCode(
        this.challenge.challengeId,
        `step-up for ${this.challenge.action}`,
      );

      this.maskedEmail = response.maskedEmail;
      this.emailSent = true;
      this.method = 'email';
      this.verifyError = '';
      this.startCooldown(30);
    } catch (error) {
      this.sendError = this.getBackendMessage(error, 'Não foi possível enviar o código por e-mail.');
    } finally {
      this.sendPending = false;
    }
  }

  protected useRecoveryCode(): void {
    if (!this.canUseRecoveryCode) {
      return;
    }

    this.method = 'recovery_code';
    this.verifyError = '';
    this.codeForm.controls.code.setValue('');
    this.codeForm.controls.code.markAsPristine();
    this.codeForm.controls.code.markAsUntouched();
  }

  protected async verify(): Promise<void> {
    if (this.verifyPending) {
      return;
    }

    this.codeForm.markAllAsTouched();
    if (this.codeForm.invalid) {
      return;
    }

    this.verifyPending = true;
    this.verifyError = '';

    try {
      const response = await this.twoFactorService.verifyChallenge(this.challenge.challengeId, {
        code: this.codeForm.controls.code.getRawValue().trim(),
        method: this.method,
      });

      if (response.verified) {
        this.closeWithResult({ status: 'verified' });
        return;
      }
    } catch (error) {
      const backendCode = this.getBackendCode(error);

      if (backendCode === 'TWO_FACTOR_INVALID_CODE') {
        const remainingAttempts = this.getRemainingAttempts(error);
        this.verifyError = remainingAttempts === null
          ? `O ${this.methodLabel} informado é inválido.`
          : `O ${this.methodLabel} informado é inválido. Restam ${remainingAttempts} tentativas.`;
        return;
      }

      if (backendCode === 'TWO_FACTOR_EXPIRED') {
        this.closeWithResult({ status: 'expired' });
        return;
      }

      if (backendCode === 'TWO_FACTOR_FORBIDDEN_CONTEXT') {
        this.verifyError = 'Este desafio não é mais válido para esta ação. Tente novamente.';
        return;
      }

      this.verifyError = this.getBackendMessage(error, 'Não foi possível validar o código informado.');
    } finally {
      this.verifyPending = false;
    }
  }

  protected closeWithResult(result: TwoFactorFlowOutcome): void {
    this.activeModal.close(result);
  }

  protected cancel(): void {
    this.closeWithResult({ status: 'cancelled' });
  }

  private startCooldown(seconds: number): void {
    this.clearCooldownTimer();
    this.cooldownSeconds = seconds;

    this.cooldownTimer = window.setInterval(() => {
      this.cooldownSeconds = Math.max(0, this.cooldownSeconds - 1);
      if (this.cooldownSeconds === 0) {
        this.clearCooldownTimer();
      }
    }, 1000);
  }

  private clearCooldownTimer(): void {
    if (this.cooldownTimer !== null) {
      window.clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  private getBackendCode(error: unknown): string | undefined {
    return this.getErrorPayload(error)?.code;
  }

  private getRemainingAttempts(error: unknown): number | null {
    const remainingAttempts = this.getErrorPayload(error)?.remainingAttempts;
    return typeof remainingAttempts === 'number' ? remainingAttempts : null;
  }

  private getBackendMessage(error: unknown, fallback: string): string {
    const payload = this.getErrorPayload(error);
    return payload?.message || payload?.error || fallback;
  }

  private getErrorPayload(error: unknown): TwoFactorErrorPayload | undefined {
    return (error as AxiosError<TwoFactorErrorPayload>)?.response?.data;
  }
}
