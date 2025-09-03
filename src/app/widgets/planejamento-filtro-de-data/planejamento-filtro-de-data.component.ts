import { Component, EventEmitter, Output } from '@angular/core';
import { FormDinamicoComponent } from "../form-dinamico/form-dinamico.component";
import { DynamicField } from '../form-dinamico/@core/DynamicField';
import { NgForm } from '@angular/forms';
import { isBefore, startOfDay } from 'date-fns';

@Component({
  selector: 'app-planejamento-filtro-de-data',
  imports: [FormDinamicoComponent],
  templateUrl: './planejamento-filtro-de-data.component.html',
  styleUrl: './planejamento-filtro-de-data.component.css'
})
export class PlanejamentoFiltroDeDataComponent {
  @Output() formSubmitted = new EventEmitter<any>();

  formsFields: DynamicField[] = [
    {
      label: 'data inicial',
      name: 'dia inicial',
      disable: false,
      type: 'date',
      defaultValue: startOfDay(new Date()),
      required: true,

    },
    {
      disable: false,
      label: 'data final',
      name: 'dia final',
      defaultValue: startOfDay(new Date()),
      type: 'date',
      simpleValidation: [
        (forms: NgForm) => {
          return !forms.controls['dia final'].value || !forms.controls['dia final'].value === !forms.controls['dia inicial'].value || isBefore(forms.controls['dia inicial'].value, forms.controls['dia final'].value)
        }
      ]
    }
  ]

  log(ev: any): void {
    this.formSubmitted.emit(ev);
  }

}
