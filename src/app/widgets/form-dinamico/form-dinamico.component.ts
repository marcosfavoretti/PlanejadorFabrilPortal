import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, Signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, NgForm, Validators } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker'
import { DynamicField } from './@core/DynamicField';
import { Dropdown, DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-form-dinamico',
  imports: [
    DatePicker,
    FormsModule,
    CommonModule,
    DropdownModule
  ],
  templateUrl: './form-dinamico.component.html',
  styleUrl: './form-dinamico.component.css'
})
export class FormDinamicoComponent {
  @Input() fields: DynamicField[] = [];
  @Input() inColumn: boolean = false;
  @Input() css?: string
  @Input() buttonIcon?: string = 'pi pi-send'
  @Output() formSubmitted = new EventEmitter<any>();
  @ViewChild('form') formRef!: NgForm;


  

  model: { [key: string]: any } = {};
  validationErrors: { [key: string]: boolean } = {};
  onFieldChange(field: DynamicField, value: any) {
    if (field.trigger) {
      // passa o valor do campo para a função configurada
      const result = field.trigger(value);

      if (result instanceof Promise) {
        result.catch(err => console.error(`Trigger error on ${field.name}:`, err));
      }
    }
  }
  ngOnInit(): void {
    this.fields.forEach(field => {
      if (field.type === 'date') {
        const value = field.defaultValue ?? '';
        if (typeof value === 'string') {
          // Se for string ISO
          const parts = value.split('T')[0].split('-');
          if (parts.length === 3) {
            const year = +parts[0];
            const month = +parts[1] - 1;
            const day = +parts[2];
            this.model[field.name] = new Date(year, month, day); // cria data local
          } else {
            this.model[field.name] = value;
          }
        } else {
          this.model[field.name] = value;
        }
      } else {
        this.model[field.name] = field.defaultValue ?? '';
      }
    });
  }

  validateField(field: DynamicField): void {
    if (!field.simpleValidation?.length) return;
    const isValid = field.simpleValidation.every(fn => fn(this.formRef));
    this.validationErrors[field.name] = !isValid;
  }

  onSubmit(form: NgForm): void {
    this.fields.forEach(field => this.validateField(field));
    if (form.valid) {
      this.formSubmitted.emit(this.model);
    }
  }
}
