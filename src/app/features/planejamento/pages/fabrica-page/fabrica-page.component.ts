import { Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { tap } from 'rxjs';
import { TabelaPlanejamentoComponent } from '@/app/features/planejamento/widgets/tabela-planejamento/tabela-planejamento.component';
import { PedidosPlanejadosTabelaComponent } from "@/app/features/planejamento/widgets/pedidos-planejados-tabela/pedidos-planejados-tabela.component";
import { FabricaPageStartUpService } from '@/app/features/planejamento/services/FabricaPageStartup.service';
import { ContadorDividaComponent } from "@/app/features/planejamento/widgets/contador-divida/contador-divida.component";
import { ContadorAtrasoComponent } from "@/app/features/planejamento/widgets/contador-atraso/contador-atraso.component";
import { FormsModule } from '@angular/forms';
import { FabricaMudancaStore } from '@/app/features/planejamento/services/FabricaMudancaStore.service';
import { FabricaApresentacaoComponent } from '@/app/features/planejamento/widgets/fabrica-apresentacao/fabrica-apresentacao.component';
import { GanttChartComponent } from '@/app/features/planejamento/widgets/gantt-chart/gantt-chart.component';
import { VisualizadorMudancasComponent } from '@/app/features/planejamento/widgets/visualizador-mudancas/visualizador-mudancas.component';

@Component({
  selector: 'app-fabrica-page',
  standalone: true,
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
    private startup: FabricaPageStartUpService,
  ) { }

  _readonly = input<boolean>(false);
  checked = signal<boolean>(false);
  loadFinish = false;
  mudancaStore = inject(FabricaMudancaStore);

  ngOnInit(): void {
    const currentParameter = this.activatedRoute.snapshot.params;
    this.startup.startUp(currentParameter['fabricaId']);
    this.activatedRoute.params
      .pipe(
        tap(param => {
          this.startup.shutDown();
          if ('fabricaId' in param) {
            this.startup.startUp(param['fabricaId']);
          }
        })
      )
      .subscribe();
    this.loadFinish = true;
  }

  ngOnDestroy(): void {
    this.startup.shutDown();
  }
}
