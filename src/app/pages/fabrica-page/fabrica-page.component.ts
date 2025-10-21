import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { TabelaPlanejamentoComponent } from "../../widgets/tabela-planejamento/tabela-planejamento.component";
import { FabricaApresentacaoComponent } from "../../widgets/fabrica-apresentacao/fabrica-apresentacao.component";
import { ActivatedRoute, Router } from '@angular/router';
import { tap } from 'rxjs';
import { GanttChartComponent } from "../../widgets/gantt-chart/gantt-chart.component";
import { PedidosPlanejadosTabelaComponent } from "@/app/widgets/pedidos-planejados-tabela/pedidos-planejados-tabela.component";
import { FabricaPageStartUpService } from '@/app/services/FabricaPageStartup.service';
import { ContadorDividaComponent } from "@/app/widgets/contador-divida/contador-divida.component";
import { ContadorAtrasoComponent } from "@/app/widgets/contador-atraso/contador-atraso.component";
import { FormsModule } from '@angular/forms';
import { FabricaMudancaStore } from '@/app/services/FabricaMudancaStore.service';
import { VisualizadorMudancasComponent } from '@/app/widgets/visualizador-mudancas/visualizador-mudancas.component';

@Component({
  selector: 'app-fabrica-page',
  imports: [
    TabelaPlanejamentoComponent,
    FabricaApresentacaoComponent,
    GanttChartComponent,
    PedidosPlanejadosTabelaComponent,
    ContadorDividaComponent,
    ContadorAtrasoComponent,
    FormsModule,
    VisualizadorMudancasComponent
],
  templateUrl: './fabrica-page.component.html',
  styleUrl: './fabrica-page.component.css'
})
export class FabricaPageComponent implements OnInit, OnDestroy {

  constructor(
    private activatedRoute: ActivatedRoute,
    private startUp: FabricaPageStartUpService,
  ) { }

  checked = signal<boolean>(false);
  loadFinish: boolean = false
  mudancaStore = inject(FabricaMudancaStore);

  ngOnInit(): void {
    const currentParameter = this.activatedRoute.snapshot.params
    this.startUp.startUp(currentParameter['fabricaId']);
    this.activatedRoute.params
      .pipe(
        tap(param => {
          this.startUp.shutDown();
          if ('fabricaId' in param) {
            this.startUp.startUp(param['fabricaId']);
          }
        })
      )
      .subscribe();
    this.loadFinish = true;
  }

  ngOnDestroy(): void {
    this.startUp.shutDown();
  }
}
