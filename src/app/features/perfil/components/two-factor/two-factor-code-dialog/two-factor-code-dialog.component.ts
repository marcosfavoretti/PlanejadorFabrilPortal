import { Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

/** Pede um código TOTP (ou de recuperação) antes de uma ação sensível. */
@Component({
  selector: 'app-two-factor-code-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, InputTextModule],
  templateUrl: './two-factor-code-dialog.component.html',
  styleUrl: './two-factor-code-dialog.component.css',
})
export class TwoFactorCodeDialogComponent {
  readonly visible = input(false);
  readonly header = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirmar');
  readonly confirmSeverity = input<'primary' | 'danger'>('primary');
  readonly allowRecoveryCode = input(false);
  readonly busy = input(false);

  readonly submitCode = output<string>();
  readonly cancel = output<void>();

  protected readonly code = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.code.reset('');
      }
    });
  }

  protected submit(): void {
    const code = this.code.value.trim();
    if (!code) {
      this.code.markAsTouched();
      return;
    }

    this.submitCode.emit(code);
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.cancel.emit();
    }
  }
}
