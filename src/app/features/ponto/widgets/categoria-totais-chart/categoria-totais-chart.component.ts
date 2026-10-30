import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { CategoriaTotalAgregado, montarDadosGraficoCategorias } from '../../utils/categoria-he';

/** Plugin simples: escreve o valor ao final de cada barra horizontal. */
const valoresNasBarras = {
  id: 'valoresNasBarras',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.font = '600 12px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.textBaseline = 'middle';
    meta.data.forEach((barra: any, indice: number) => {
      ctx.fillText(String(chart.data.datasets[0].data[indice]), barra.x + 6, barra.y);
    });
    ctx.restore();
  },
};

/** Barras horizontais com o total de funcionários por categoria de hora extra. */
@Component({
  selector: 'app-categoria-totais-chart',
  standalone: true,
  imports: [ChartModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totais().length) {
      <div class="grafico" role="img" [attr.aria-label]="descricao()">
        <p-chart type="bar" [data]="chartData()" [options]="chartOptions" [plugins]="plugins"
          [height]="altura() + 'px'"></p-chart>
      </div>
    } @else {
      <p class="sem-dados">Sem dados de categoria no período.</p>
    }
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .grafico { min-width: 0; width: 100%; }
    .sem-dados { color: var(--text-color-secondary, #64748b); margin: 0; }
  `],
})
export class CategoriaTotaisChartComponent {
  readonly totais = input.required<ReadonlyArray<CategoriaTotalAgregado>>();

  protected readonly plugins = [valoresNasBarras];
  protected readonly altura = computed(() => Math.max(140, this.totais().length * 38 + 50));

  protected readonly descricao = computed(() => {
    const dados = montarDadosGraficoCategorias(this.totais());
    return 'Funcionários por categoria: ' + dados.labels.map((label, i) => `${label} ${dados.data[i]}`).join(', ');
  });

  protected readonly chartData = computed(() => {
    const dados = montarDadosGraficoCategorias(this.totais());
    return {
      labels: dados.labels,
      datasets: [{
        label: 'Funcionários',
        data: dados.data,
        backgroundColor: dados.colors,
        borderRadius: 4,
        barThickness: 22,
      }],
    };
  });

  protected readonly chartOptions = {
    indexAxis: 'y' as const,
    maintainAspectRatio: false,
    layout: { padding: { right: 32 } },
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#eef2f6' } },
      y: { ticks: { autoSkip: false, color: '#334155' }, grid: { display: false } },
    },
  };
}
