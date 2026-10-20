import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateApiKeyDto, CreateApiKeyDtoCargosEnum } from '@/api/auth';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { API_KEY_NAME_MAX_LENGTH } from '../../../models/api-key.model';

@Component({
  selector: 'app-api-key-create-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './api-key-create-form.component.html',
  styleUrl: './api-key-create-form.component.css',
})
export class ApiKeyCreateFormComponent {
  private readonly fb = inject(FormBuilder);

  /** Cargos herdados do usuário logado; a chave é criada exatamente com eles. */
  readonly cargos = input.required<CreateApiKeyDtoCargosEnum[]>();
  readonly busy = input(false);
  readonly create = output<CreateApiKeyDto>();
  readonly invalidSubmit = output<string>();

  protected readonly nameMaxLength = API_KEY_NAME_MAX_LENGTH;
  // Formato aceito por <input type="datetime-local">: yyyy-MM-ddTHH:mm no horário local.
  protected readonly minExpiresAt = toDateTimeLocalValue(new Date());

  protected readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(API_KEY_NAME_MAX_LENGTH),
    ]),
    // String vazia = sem expiração.
    expiresAt: this.fb.nonNullable.control(''),
  });

  reset(): void {
    this.form.reset({ name: '', expiresAt: '' });
  }

  protected clearExpiresAt(): void {
    this.form.controls.expiresAt.setValue('');
  }

  protected submit(): void {
    if (!this.cargos().length) {
      this.invalidSubmit.emit('Seu usuário não tem cargos que possam ser atribuídos a uma API key.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.invalidSubmit.emit(`Informe o nome (até ${API_KEY_NAME_MAX_LENGTH} caracteres).`);
      return;
    }

    const { name, expiresAt: rawExpiresAt } = this.form.getRawValue();
    const expiresAt = rawExpiresAt ? new Date(rawExpiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      this.invalidSubmit.emit('Data de expiração inválida.');
      return;
    }

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      this.invalidSubmit.emit('A data de expiração precisa ser futura.');
      return;
    }

    this.create.emit({
      name: name.trim(),
      cargos: [...this.cargos()],
      ...(expiresAt ? { expiresAt } : {}),
    });
  }
}

function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
