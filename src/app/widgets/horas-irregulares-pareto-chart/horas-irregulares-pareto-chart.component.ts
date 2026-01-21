import { Component, Input, OnChanges, SimpleChanges, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChartModule } from 'primeng/chart';

export interface IrregularHoursDTO {
  matricula: string;
  nome: string;
  setor: string;
  horasIrregulares: number;
}

@Component({
  selector: 'app-horas-irregulares-pareto-chart',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './horas-irregulares-pareto-chart.component.html',
  styleUrl: './horas-irregulares-pareto-chart.component.css'
})
export class HorasIrregularesParetoChartComponent implements OnChanges {
  @Input() rawData: IrregularHoursDTO[] = [];

  chartData: any;
  chartOptions: any;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cd: ChangeDetectorRef
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rawData'] && this.rawData) {
      this.updateChart();
    }
  }

  updateChart() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.rawData || this.rawData.length === 0) {
      this.chartData = null;
      return;
    }

    // 1. Sort by horasIrregulares descending
    const sortedData = [...this.rawData].sort((a, b) => b.horasIrregulares - a.horasIrregulares);

    // 2. Calculate Total
    const totalHours = sortedData.reduce((sum, item) => sum + item.horasIrregulares, 0);

    // 3. Prepare datasets
    const labels = sortedData.map(item => `${item.matricula} - ${item.nome} (${item.setor})`);
    const values = sortedData.map(item => item.horasIrregulares);

    // Calculate cumulative percentage
    let cumulativeSum = 0;
    const cumulativePercentages = sortedData.map(item => {
      cumulativeSum += item.horasIrregulares;
      return (cumulativeSum / totalHours) * 100;
    });

            // 4. Set Chart Data

            const documentStyle = getComputedStyle(document.documentElement);

            const textColor = documentStyle.getPropertyValue('--text-color');

            const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');

            const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

            const primaryColor = documentStyle.getPropertyValue('--primary-color') || '#0ea5e9';

            

            this.chartData = {

              labels: labels,

              datasets: [

                {

                  type: 'bar',

                  label: 'Horas Irregulares',

                  backgroundColor: primaryColor,

                  data: values,

                  borderColor: 'white',

                  borderWidth: 2,

                  yAxisID: 'y'

                },

                {

                  type: 'line',

                  label: 'Acumulado (%)',

                  borderColor: '#f59e0b',

                  borderWidth: 2,

                  fill: false,

                  tension: 0.4,

                  data: cumulativePercentages,

                  yAxisID: 'y1'

                }

              ]

            };

        

            // 5. Set Chart Options

            this.chartOptions = {

              maintainAspectRatio: false,

              aspectRatio: 0.6,

              plugins: {

                legend: {

                  labels: {

                    color: textColor

                  }

                },

                tooltip: {

                  mode: 'index',

                  intersect: false

                }

              },

        

    
      scales: {
        x: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          },
          title: {
            display: true,
            text: 'Horas'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          ticks: {
            color: textColorSecondary,
            callback: function (value: number) {
              return value + '%';
            }
          },
          grid: {
            drawOnChartArea: false
          },
          title: {
            display: true,
            text: 'Acumulado (%)'
          },
          min: 0,
          max: 100
        }
      }
    };

    this.cd.markForCheck();
  }
}
