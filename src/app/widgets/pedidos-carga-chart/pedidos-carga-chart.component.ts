import { PedidoStoreService } from '@/app/services/PedidoStore.service';
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, inject, PLATFORM_ID, Signal } from '@angular/core';
import { ChartModule } from 'primeng/chart'
@Component({
  selector: 'app-pedidos-carga-chart',
  imports: [ChartModule],
  templateUrl: './pedidos-carga-chart.component.html',
  styleUrl: './pedidos-carga-chart.component.css'
})
export class PedidosCargaChartComponent {
  data!: Signal<any>;

  options: any;

  platformId = inject(PLATFORM_ID);

  pedidoStore = inject(PedidoStoreService);

  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.initChart();
  }

  initChart() {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--p-text-color');
      const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
      const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

      this.data = this.pedidoStore.pedidoQuantidadeChart;

      this.options = {
        maintainAspectRatio: false,
        aspectRatio: 0.5,
        plugins: {
          legend: {
            labels: {
              color: textColor
            }
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
            ticks: {
              color: textColorSecondary
            },
            grid: {
              color: surfaceBorder,
              drawBorder: false
            }
          }
        }
      };
      this.cd.markForCheck()
    }
  }
}
