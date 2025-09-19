import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { TabelaPlanejamentoComponent } from "../../widgets/tabela-planejamento/tabela-planejamento.component";
import { FabricaApresentacaoComponent } from "../../widgets/fabrica-apresentacao/fabrica-apresentacao.component";
import { ActivatedRoute, Router } from '@angular/router';
import { tap } from 'rxjs';
import { GanttChartComponent } from "../../widgets/gantt-chart/gantt-chart.component";
import { GlobalHeaderComponent } from "@/app/widgets/global-header/global-header.component";
import { PedidosPlanejadosTabelaComponent } from "@/app/widgets/pedidos-planejados-tabela/pedidos-planejados-tabela.component";
import { FabricaPageStartUpService } from '@/app/services/FabricaPageStartup.service';
import { ContadorDividaComponent } from "@/app/widgets/contador-divida/contador-divida.component";
import { ContadorAtrasoComponent } from "@/app/widgets/contador-atraso/contador-atraso.component";
import { ToggleSwitch } from "primeng/toggleswitch";
import { PedidosTabelaComponent } from "@/app/widgets/pedidos-tabela/pedidos-tabela.component";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fabrica-page',
  imports: [
    TabelaPlanejamentoComponent,
    FabricaApresentacaoComponent,
    GanttChartComponent,
    GlobalHeaderComponent,
    PedidosPlanejadosTabelaComponent,
    ContadorDividaComponent,
    ContadorAtrasoComponent,
    ToggleSwitch,
    PedidosTabelaComponent,
    FormsModule
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

  // loadFabrica(fabricaId: string): void {
  //   console.log("LOAD DA FABRICA NOVO")
  //   const fabrica$ = this.fabricaService.consultaFabrica({
  //     fabricaId: fabricaId
  //   })
  //     .pipe(
  //       tap(
  //         fab => {
  //           this.contextFabrica.setFabrica(fab);
  //         }
  //       ),
  //       catchError(
  //         err => {
  //           this.router.navigate(['/', 'app']);
  //           console.log(err)
  //           if (err.status === 403) {
  //             alert('não é possível ainda visualizar uma area de trabalho de terceiros')
  //           }
  //           return of();
  //         }
  //       )
  //     ).subscribe()
  // }

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
