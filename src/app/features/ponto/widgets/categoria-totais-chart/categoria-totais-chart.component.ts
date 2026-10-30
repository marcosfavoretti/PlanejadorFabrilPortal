import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { CategoriaTotalAgregado, montarDadosGraficoCategorias } from '../../utils/categoria-he';

/** Barras horizontais com o total de funcionários por categoria de hora extra. */
@Component({
  selector: 'app-categoria-totais-chart',
  standalone: true,
  imports: [ChartModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totais().length) {
      <p-chart type="bar" [data]="chartData()" [options]="chartOptions" [height]="altura() + 'px'"></p-chart>
    } @else {
      <p class="sem-dados">Sem dados de categoria no período.</p>
    }
  `,
  styles: [`.sem-dados { color: var(--text-color-secondary, #64748b); margin: 0; }`],
})
export class CategoriaTotaisChartComponent {
  readonly totais = input.required<ReadonlyArray<CategoriaTotalAgregado>>();

  protected readonly altura = computed(() => Math.max(140, this.totais().length * 38 + 60));

  protected readonly chartData = computed(() => {
    const dados = montarDadosGraficoCategorias(this.totais());
    return {
      labels: dados.labels,
      datasets: [{ label: 'Funcionários', data: dados.data, backgroundColor: dados.colors }],
    };
  });

  protected readonly chartOptions = {
    indexAxis: 'y' as const,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
  };
}
