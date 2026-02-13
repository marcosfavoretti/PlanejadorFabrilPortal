import { PedidoService } from '@/app/services/Pedido.service';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { PedidosTabelaComponent } from "../pedidos-tabela/pedidos-tabela.component";
import { PedidosCargaChartComponent } from "../pedidos-carga-chart/pedidos-carga-chart.component";
import { PedidoStartUp } from '@/app/services/PedidoStartup.service';
import { PedidosCargaLoteChartComponent } from "../pedidos-carga-lote-chart/pedidos-carga-lote-chart.component";

@Component({
  selector: 'app-pedidos-fabrica-view',
  imports: [PedidosTabelaComponent, PedidosCargaChartComponent, PedidosCargaLoteChartComponent],
  templateUrl: './pedidos-fabrica-view.component.html',
  styleUrl: './pedidos-fabrica-view.component.css'
})
export class PedidosFabricaViewComponent
implements OnInit, OnDestroy {
  pedidoService = inject(PedidoService);
  pedidoStartUp = inject(PedidoStartUp);
  ngOnInit(): void {
      this.pedidoStartUp.startUp();
  }
  ngOnDestroy(): void {
      this.pedidoStartUp.shutDown();
  }
}
