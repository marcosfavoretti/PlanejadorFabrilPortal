import { DatePipe } from '@angular/common';
import { Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TotpEnrollment } from '../../../models/two-factor-settings.model';

@Component({
  selector: 'app-totp-enrollment-panel',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './totp-enrollment-panel.component.html',
  styleUrl: './totp-enrollment-panel.component.css',
})
export class TotpEnrollmentPanelComponent {
  readonly enrollment = input.required<TotpEnrollment>();
  readonly busy = input(false);
  readonly confirm = output<string>();
  readonly cancel = output<void>();

  protected readonly code = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
  });

  constructor() {
    // Uma nova inscrição invalida o código digitado para a anterior.
    effect(() => {
      this.enrollment();
      this.code.reset('');
    });
  }

  protected submit(): void {
    if (this.code.invalid) {
      this.code.markAsTouched();
      return;
    }

    this.confirm.emit(this.code.value);
  }
}
