import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { PedidoStartUp } from '@/app/features/planejamento/services/PedidoStartup.service';
import { PedidosCargaChartComponent } from '@/app/features/planejamento/widgets/pedidos-carga-chart/pedidos-carga-chart.component';
import { PedidosCargaLoteChartComponent } from '@/app/features/planejamento/widgets/pedidos-carga-lote-chart/pedidos-carga-lote-chart.component';
import { PedidosTabelaComponent } from '@/app/features/planejamento/widgets/pedidos-tabela/pedidos-tabela.component';

@Component({
  selector: 'app-pedidos-page',
  standalone: true,
  imports: [
    PedidosTabelaComponent,
    PedidosCargaChartComponent,
    PedidosCargaLoteChartComponent,
  ],
  templateUrl: './pedidos-page.component.html',
  styleUrl: './pedidos-page.component.css',
})
export class PedidosPageComponent implements OnInit, OnDestroy {
  private readonly pedidoStartUp = inject(PedidoStartUp);

  ngOnInit(): void {
    this.pedidoStartUp.startUp();
  }

  ngOnDestroy(): void {
    this.pedidoStartUp.shutDown();
  }
}
