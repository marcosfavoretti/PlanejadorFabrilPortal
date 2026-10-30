import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface KpiSecaoNav {
  /** Id do elemento da seção a rolar até. */
  id: string;
  titulo: string;
  descricao: string;
  /** Classe do ícone PrimeIcons, ex.: `pi-wallet`. */
  icone: string;
  tom: 'authorized' | 'operations' | 'audit';
}

/** Menu horizontal "Explorar indicadores" da aba KPI. */
@Component({
  selector: 'app-kpi-section-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Navegação dos indicadores">
      <span class="titulo">Explorar indicadores</span>
      @for (item of secoes(); track item.id) {
        <button type="button" class="item" [class]="'item item--' + item.tom" (click)="secao.emit(item.id)">
          <i class="pi" [class]="item.icone"></i>
          <span><strong>{{ item.titulo }}</strong><small>{{ item.descricao }}</small></span>
          <i class="pi pi-arrow-down-right"></i>
        </button>
      }
    </nav>
  `,
  styles: [`
    /* O host é filho direto da grade de KPIs: ocupa a linha inteira e fica fixo no topo. */
    :host { display: block; grid-column: 1 / -1; min-width: 0; order: -2; position: sticky; top: .5rem; z-index: 2; }
    nav {
      align-items: center;
      background: #eef2f6;
      border: 1px solid #d5dee8;
      border-radius: .9rem;
      display: flex;
      flex-wrap: nowrap;
      gap: .65rem;
      overflow-x: auto;
      padding: .65rem;
      scrollbar-width: thin;
    }
    .titulo {
      color: #64748b;
      flex: 0 0 auto;
      font-size: .72rem;
      font-weight: 800;
      letter-spacing: .05em;
      padding: 0 .5rem;
      text-transform: uppercase;
    }
    .item {
      align-items: center;
      background: #fff;
      border: 1px solid #dbe5ee;
      border-radius: .7rem;
      color: #334155;
      cursor: pointer;
      display: grid;
      flex: 1 0 auto;
      gap: .65rem;
      grid-template-columns: auto 1fr auto;
      min-width: 14rem;
      padding: .65rem .8rem;
      text-align: left;
      transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
    }
    .item > i:first-child { font-size: 1.05rem; }
    .item > i:last-child { color: #94a3b8; font-size: .8rem; }
    .item span { display: flex; flex-direction: column; min-width: 0; }
    .item strong { font-size: .8rem; }
    .item small { color: #64748b; font-size: .68rem; margin-top: .15rem; }
    .item:hover { box-shadow: 0 4px 12px rgba(15, 23, 42, .08); transform: translateY(-1px); }
    .item:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
    .item--authorized > i:first-child { color: #15803d; }
    .item--operations > i:first-child { color: #2563eb; }
    .item--audit > i:first-child { color: #dc2626; }
    @media (max-width: 980px) { .item { flex: 0 0 auto; } }
  `],
})
export class KpiSectionNavComponent {
  readonly secoes = input.required<readonly KpiSecaoNav[]>();
  readonly secao = output<string>();
}
