import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CategoriaTotalAgregado, montarDadosGraficoCategorias } from '../../utils/categoria-he';

interface LinhaBarra {
  chave: string;
  label: string;
  quantidade: number;
  percentual: string;
  largura: number;
  cor: string;
}

/** Lista compacta de barras (rótulo completo, barra proporcional, contagem e percentual) por categoria. */
@Component({
  selector: 'app-categoria-barras',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (linhas().length) {
      <ul class="barras" role="list" [attr.aria-label]="ariaLabel()">
        @for (linha of linhas(); track linha.chave) {
          <li>
            <span class="rotulo">{{ linha.label }}</span>
            <span class="trilho" aria-hidden="true">
              <span class="barra" [style.width.%]="linha.largura" [style.background]="linha.cor"></span>
            </span>
            <span class="valor">{{ linha.quantidade }} <small>({{ linha.percentual }}%)</small></span>
          </li>
        }
      </ul>
    } @else {
      <p class="vazio">Sem dados de categoria.</p>
    }
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .barras { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .6rem; }
    li { display: grid; grid-template-columns: minmax(7rem, 1.2fr) minmax(4rem, 2fr) minmax(5.5rem, max-content); gap: .75rem; align-items: center; }
    .rotulo { color: #334155; font-size: .82rem; font-weight: 600; overflow-wrap: anywhere; }
    .trilho { background: #e8eef4; border-radius: 999px; height: .6rem; overflow: hidden; }
    .barra { border-radius: 999px; display: block; height: 100%; min-width: 2px; }
    .valor { color: #334155; font-size: .82rem; font-weight: 700; text-align: right; white-space: nowrap; }
    .valor small { color: #64748b; font-weight: 500; }
    .vazio { color: var(--text-color-secondary, #64748b); font-size: .85rem; margin: 0; }
    @media (max-width: 520px) {
      li { grid-template-columns: minmax(0, 1fr) max-content; }
      .trilho { grid-column: 1 / -1; grid-row: 2; }
    }
  `],
})
export class CategoriaBarrasComponent {
  readonly totais = input.required<ReadonlyArray<CategoriaTotalAgregado>>();

  protected readonly linhas = computed<LinhaBarra[]>(() => {
    const lista = this.totais();
    const dados = montarDadosGraficoCategorias(lista);
    const soma = dados.data.reduce((acc, valor) => acc + valor, 0);
    const maximo = Math.max(...dados.data, 1);
    return lista.map((total, indice) => ({
      chave: total.codigo ?? 'sem-categoria',
      label: dados.labels[indice],
      quantidade: total.quantidadeFuncionarios,
      // O texto mostra a participação no total; a barra é proporcional ao maior valor.
      percentual: this.formatarPercentual(total.quantidadeFuncionarios, soma),
      largura: (total.quantidadeFuncionarios / maximo) * 100,
      cor: dados.colors[indice],
    }));
  });

  /** Participação arredondada; valores positivos abaixo de 0,5% aparecem como "<1" em vez de 0. */
  private formatarPercentual(quantidade: number, soma: number): string {
    if (!soma || quantidade <= 0) {
      return '0';
    }
    const valor = Math.round((quantidade / soma) * 100);
    return valor === 0 ? '<1' : String(valor);
  }

  protected readonly ariaLabel = computed(() =>
    'Funcionários por categoria: ' + this.linhas().map(l => `${l.label} ${l.quantidade}`).join(', '));
}
