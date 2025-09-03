import { Component, OnInit } from '@angular/core';
import { GanttChartComponent } from "../../widgets/gantt-chart/gantt-chart.component";
import { GlobalHeaderComponent } from "../../widgets/global-header/global-header.component";
import { HomeStartUpService } from '../../services/HomeStartup.service';
import { FabricaApresentacaoComponent } from "../../widgets/fabrica-apresentacao/fabrica-apresentacao.component";
import { TabelaPlanejamentoComponent } from "../../widgets/tabela-planejamento/tabela-planejamento.component";
import { HomePageNavigatorComponent } from "../../widgets/home-page-navigator/home-page-navigator.component";
import { PedidosTabelaComponent } from "../../widgets/pedidos-tabela/pedidos-tabela.component";
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { FabricaService } from '@/app/services/Fabrica.service';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { tap } from 'rxjs';
import { PedidosPlanejadosTabelaComponent } from '@/app/widgets/pedidos-planejados-tabela/pedidos-planejados-tabela.component';

@Component({
  selector: 'app-home-page',
  imports: [
    GanttChartComponent,
    GlobalHeaderComponent,
    FabricaApresentacaoComponent,
    TabelaPlanejamentoComponent,
    HomePageNavigatorComponent,
    PedidosTabelaComponent,
    PedidosPlanejadosTabelaComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent implements OnInit {
  constructor(
    private popUpService: LoadingPopupService,
    private fabricaService: FabricaService,
    private homeStartUpService: HomeStartUpService,
    private contextoFabrica: ContextoFabricaService
  ) { }
  loadFinish: boolean = false;
  ngOnInit(): void {
    this.homeStartUpService.startUp();
    const contextoFabrica$ = this.fabricaService.getFabricaPrincipal()
      .pipe(
        tap(
          (fabrica) => { this.contextoFabrica.setFabrica(fabrica); this.loadFinish = true }
        )
      )
    this.popUpService.showWhile(contextoFabrica$);
  }
}
