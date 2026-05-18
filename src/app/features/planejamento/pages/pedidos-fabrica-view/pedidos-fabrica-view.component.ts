import { PedidoService } from '@/app/features/planejamento/services/Pedido.service';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { PedidoStartUp } from '@/app/features/planejamento/services/PedidoStartup.service';
import { PedidosCargaChartComponent } from '@/app/features/planejamento/widgets/pedidos-carga-chart/pedidos-carga-chart.component';
import { PedidosCargaLoteChartComponent } from '@/app/features/planejamento/widgets/pedidos-carga-lote-chart/pedidos-carga-lote-chart.component';
import { PedidosTabelaComponent } from '@/app/features/planejamento/widgets/pedidos-tabela/pedidos-tabela.component';

@Component({
  selector: 'app-pedidos-fabrica-view',
  standalone: true,
  imports: [PedidosTabelaComponent, PedidosCargaChartComponent, PedidosCargaLoteChartComponent],
  templateUrl: './pedidos-fabrica-view.component.html',
  styleUrl: './pedidos-fabrica-view.component.css'
})
export class PedidosFabricaViewComponent
implements OnInit, OnDestroy {
  pedidoService = inject(PedidoService);
  pedidoStartup = inject(PedidoStartUp);
  ngOnInit(): void {
      this.pedidoStartup.startUp();
  }
  ngOnDestroy(): void {
      this.pedidoStartup.shutDown();
  }
}
