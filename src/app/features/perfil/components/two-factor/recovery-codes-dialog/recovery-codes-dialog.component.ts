import { Component, effect, input, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

/**
 * Exibe os códigos de recuperação recém-gerados. Assim como o segredo
 * das API keys, eles só existem enquanto `codes` estiver preenchido.
 */
@Component({
  selector: 'app-recovery-codes-dialog',
  standalone: true,
  imports: [ButtonModule, DialogModule],
  templateUrl: './recovery-codes-dialog.component.html',
  styleUrl: './recovery-codes-dialog.component.css',
})
export class RecoveryCodesDialogComponent {
  readonly codes = input<string[] | null>(null);
  readonly closed = output<void>();
  readonly copyFailed = output<void>();

  protected readonly copied = signal(false);

  constructor() {
    effect(() => {
      this.codes();
      this.copied.set(false);
    });
  }

  protected copy(): void {
    const codes = this.codes();
    if (!codes?.length) {
      return;
    }

    navigator.clipboard.writeText(codes.join('\n'))
      .then(() => this.copied.set(true))
      .catch(() => this.copyFailed.emit());
  }

  protected download(): void {
    const codes = this.codes();
    if (!codes?.length) {
      return;
    }

    const blob = new Blob([`${codes.join('\n')}\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'codigos-recuperacao-2fa.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.closed.emit();
    }
  }
}
