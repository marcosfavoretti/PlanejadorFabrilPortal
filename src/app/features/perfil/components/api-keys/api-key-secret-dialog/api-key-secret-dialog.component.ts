import { Component, effect, input, output, signal } from '@angular/core';
import { CreatedApiKeyDto } from '@/api/auth';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

/**
 * Exibe o segredo de uma API key recém-criada ou rotacionada.
 * O valor só existe enquanto `apiKey` estiver preenchido; o pai deve
 * descartá-lo ao receber `closed`.
 */
@Component({
  selector: 'app-api-key-secret-dialog',
  standalone: true,
  imports: [ButtonModule, DialogModule, InputTextModule],
  templateUrl: './api-key-secret-dialog.component.html',
  styleUrl: './api-key-secret-dialog.component.css',
})
export class ApiKeySecretDialogComponent {
  readonly apiKey = input<CreatedApiKeyDto | null>(null);
  readonly closed = output<void>();
  readonly copyFailed = output<void>();

  protected readonly copied = signal(false);

  constructor() {
    effect(() => {
      this.apiKey();
      this.copied.set(false);
    });
  }

  protected copy(): void {
    const secret = this.apiKey()?.apiKey;
    if (!secret) {
      return;
    }

    navigator.clipboard.writeText(secret)
      .then(() => this.copied.set(true))
      .catch(() => this.copyFailed.emit());
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.closed.emit();
    }
  }
}
