import { Component, ElementRef, input, viewChild, effect, afterRender, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-fluxo-heatmap-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-100 d-flex flex-column">
      <div class="chart-container flex-grow-1" style="position: relative; height: 100%; min-height: 250px; width: 100%;">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class FluxoHeatmapChartComponent implements OnDestroy {
  chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  data = input.required<{ time: string; entries: number; exits: number }[]>();
  private chart?: Chart;

  constructor() {
    effect(() => {
      const dataValue = this.data();
      if (dataValue && this.chartCanvas()) {
        this.renderChart(dataValue);
      }
    });
  }

  private renderChart(data: { time: string; entries: number; exits: number }[]) {
    const ctx = this.chartCanvas()?.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line', 
      data: {
        labels: data.map(d => d.time),
        datasets: [
          {
            label: 'Entradas',
            data: data.map(d => d.entries),
            backgroundColor: 'rgba(21, 128, 61, 0.2)',
            borderColor: '#15803d',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4
          },
          {
            label: 'Saídas',
            data: data.map(d => d.exits),
            backgroundColor: 'rgba(158, 42, 43, 0.1)',
            borderColor: '#9e2a2b',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#1e293b',
            bodyColor: '#1e293b',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y + ' veículos';
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { 
              display: true,
              drawOnChartArea: true,
              color: 'rgba(0, 0, 0, 0.03)'
            },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
              font: { size: 10 }
            }
          },
          y: {
            display: true,
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: { size: 10 },
              color: '#94a3b8'
            },
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)',
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
