import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/**
 * Barra de filtros compacta. Projete blocos `<div class="filtro"><label>…</label><campo/></div>`;
 * o botão "Aplicar" emite `(aplicar)` (também no Enter dos campos de texto).
 */
@Component({
  selector: 'app-barra-filtros',
  standalone: true,
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="$event.preventDefault(); aplicar.emit()">
      <ng-content></ng-content>
      <p-button type="submit" label="Aplicar" icon="pi pi-search" severity="success" [loading]="loading()"></p-button>
    </form>
  `,
  styles: [`
    :host { display: block; }
    form {
      align-items: flex-end;
      background: #eef2f6;
      border: 1px solid #d5dee8;
      border-radius: .9rem;
      display: flex;
      flex-wrap: wrap;
      gap: .75rem 1rem;
      padding: .75rem;
    }
    :host ::ng-deep .filtro { display: flex; flex: 1 1 13rem; flex-direction: column; gap: .3rem; min-width: 0; }
    :host ::ng-deep .filtro label { color: #475569; font-size: .75rem; font-weight: 700; }
    :host ::ng-deep .filtro label i { margin-right: .4rem; }
    :host ::ng-deep .filtro .p-select, :host ::ng-deep .filtro .p-datepicker { width: 100%; }
  `],
})
export class BarraFiltrosComponent {
  readonly loading = input(false);
  readonly aplicar = output<void>();
}
