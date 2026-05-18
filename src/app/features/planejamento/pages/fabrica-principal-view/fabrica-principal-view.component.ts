import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { IShutDown } from '@/@core/abstract/IShutDown';
import { HomeStartupService } from '@/app/features/home/services/HomeStartup.service';
import { IStartup } from '@/@core/abstract/IStartup';
import { TabelaPlanejamentoComponent } from '@/app/features/planejamento/widgets/tabela-planejamento/tabela-planejamento.component';
import { ContadorAtrasoComponent } from '@/app/features/planejamento/widgets/contador-atraso/contador-atraso.component';
import { ContadorDividaComponent } from '@/app/features/planejamento/widgets/contador-divida/contador-divida.component';
import { FabricaApresentacaoComponent } from '@/app/features/planejamento/widgets/fabrica-apresentacao/fabrica-apresentacao.component';
import { GanttChartComponent } from '@/app/features/planejamento/widgets/gantt-chart/gantt-chart.component';
import { PedidosPlanejadosTabelaComponent } from '@/app/features/planejamento/widgets/pedidos-planejados-tabela/pedidos-planejados-tabela.component';
import { PedidosTabelaComponent } from '@/app/features/planejamento/widgets/pedidos-tabela/pedidos-tabela.component';
import { VisualizadorMudancasComponent } from '@/app/features/planejamento/widgets/visualizador-mudancas/visualizador-mudancas.component';

@Component({
  selector: 'app-fabrica-principal-view',
  imports: [
    FormsModule,
    GanttChartComponent,
    ToggleSwitchModule,
    FabricaApresentacaoComponent,
    TabelaPlanejamentoComponent,
    PedidosPlanejadosTabelaComponent,
    ContadorAtrasoComponent,
    ContadorDividaComponent,
    PedidosTabelaComponent,
    VisualizadorMudancasComponent
],
  templateUrl: './fabrica-principal-view.component.html',
  styleUrl: './fabrica-principal-view.component.css'
})
export class FabricaPrincipalViewComponent implements
  OnInit, OnDestroy {
  checked = signal<boolean>(false);
  homeStartupService: IShutDown & IStartup = inject(HomeStartupService);

  ngOnInit(): void {
    this.homeStartupService.startup();
  }
  ngOnDestroy(): void {
    this.homeStartupService.shutDown();
  }
}
