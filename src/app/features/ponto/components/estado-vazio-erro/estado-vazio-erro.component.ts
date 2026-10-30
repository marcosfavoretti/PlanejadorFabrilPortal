import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/** Estado vazio ou de erro (com "Tentar novamente") das seções. */
@Component({
  selector: 'app-estado-vazio-erro',
  standalone: true,
  imports: [ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.erro]': "tipo() === 'erro'", '[attr.role]': "tipo() === 'erro' ? 'alert' : null" },
  template: `
    <i class="pi" [class.pi-exclamation-triangle]="tipo() === 'erro'" [class.pi-inbox]="tipo() === 'vazio'"></i>
    <div>
      <strong>{{ titulo() }}</strong>
      @if (detalhe()) {
        <span>{{ detalhe() }}</span>
      }
    </div>
    @if (tipo() === 'erro') {
      <p-button type="button" label="Tentar novamente" icon="pi pi-refresh" severity="secondary" [outlined]="true"
        (click)="retry.emit()"></p-button>
    }
  `,
  styles: [`
    :host {
      align-items: center;
      background: var(--surface-card, #fff);
      border: 1px dashed #cbd5e1;
      border-radius: .9rem;
      color: #475569;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1.25rem;
    }
    i { color: #94a3b8; font-size: 1.5rem; }
    div { display: flex; flex: 1; flex-direction: column; gap: .15rem; min-width: 12rem; }
    span { color: #64748b; font-size: .85rem; }
    :host(.erro) { background: #fef2f2; border-color: #fecaca; border-style: solid; }
    :host(.erro) i { color: #dc2626; }
  `],
})
export class EstadoVazioErroComponent {
  readonly tipo = input<'vazio' | 'erro'>('vazio');
  readonly titulo = input.required<string>();
  readonly detalhe = input<string | null>(null);
  readonly retry = output<void>();
}
