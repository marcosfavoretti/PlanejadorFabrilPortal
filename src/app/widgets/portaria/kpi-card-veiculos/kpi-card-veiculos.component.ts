import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleCardComponent } from '../../simple-card/simple-card.component';

@Component({
  selector: 'app-kpi-card-veiculos',
  standalone: true,
  imports: [CommonModule, SimpleCardComponent],
  template: `
    <app-simple-card [title]="title()" [text]="value()"></app-simple-card>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class KpiCardVeiculosComponent {
  title = input.required<string>();
  value = input<string | undefined>();
}
