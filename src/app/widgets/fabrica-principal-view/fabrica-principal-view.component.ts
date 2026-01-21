import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { GanttChartComponent } from '../gantt-chart/gantt-chart.component';
import { FabricaApresentacaoComponent } from '../fabrica-apresentacao/fabrica-apresentacao.component';
import { TabelaPlanejamentoComponent } from '../tabela-planejamento/tabela-planejamento.component';
import { PedidosPlanejadosTabelaComponent } from '../pedidos-planejados-tabela/pedidos-planejados-tabela.component';
import { ContadorAtrasoComponent } from '../contador-atraso/contador-atraso.component';
import { ContadorDividaComponent } from '../contador-divida/contador-divida.component';
import {  ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { IShutDown } from '@/@core/abstract/IShutDown';
import { HomeStartUpService } from '@/app/services/HomeStartup.service';
import { IStartUp } from '@/@core/abstract/IStartUp';
import { PedidosTabelaComponent } from "../pedidos-tabela/pedidos-tabela.component";
import { VisualizadorMudancasComponent } from "../visualizador-mudancas/visualizador-mudancas.component";

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
  homeStartUpService: IShutDown & IStartUp = inject(HomeStartUpService);

  ngOnInit(): void {
    this.homeStartUpService.startUp();
  }
  ngOnDestroy(): void {
    this.homeStartUpService.shutDown();
  }
}
