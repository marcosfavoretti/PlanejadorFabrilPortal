import { Component, OnInit } from '@angular/core';
import { TabelaPlanejamentoComponent } from "../../widgets/tabela-planejamento/tabela-planejamento.component";
import { FabricaApresentacaoComponent } from "../../widgets/fabrica-apresentacao/fabrica-apresentacao.component";
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { FabricaService } from '@/app/services/Fabrica.service';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { GanttChartComponent } from "../../widgets/gantt-chart/gantt-chart.component";
import { GlobalHeaderComponent } from "@/app/widgets/global-header/global-header.component";
import { PedidosPlanejadosTabelaComponent } from "@/app/widgets/pedidos-planejados-tabela/pedidos-planejados-tabela.component";
import { HomeStartUpService } from '@/app/services/HomeStartup.service';

@Component({
  selector: 'app-fabrica-page',
  imports: [TabelaPlanejamentoComponent, FabricaApresentacaoComponent, GanttChartComponent, GlobalHeaderComponent, PedidosPlanejadosTabelaComponent],
  templateUrl: './fabrica-page.component.html',
  styleUrl: './fabrica-page.component.css'
})
export class FabricaPageComponent implements OnInit {

  constructor(
    private fabricaService: FabricaService,
    private contextFabrica: ContextoFabricaService,
    private activatedRoute: ActivatedRoute,
    private popup: LoadingPopupService,
    private startUp: HomeStartUpService,
    private router: Router
  ) { }

  loadFinish: boolean = false

  loadFabrica(fabricaId: string): void {
    const fabrica$ = this.fabricaService.consultaFabrica({
      fabricaId: fabricaId
    })
      .pipe(
        tap(
          fab => {
            this.contextFabrica.setFabrica(fab);
            this.loadFinish = true;
          }
        ),
        catchError(
          err => {
            this.router.navigate(['/', 'app']);
            console.log(err)
            if(err.status = 403){
              alert('não é possível ainda visualizar uma area de trabalho de terceiros')
            }
            return of();
          }
        )
      )

    this.popup.showWhile(fabrica$);
  }

  ngOnInit(): void {
    this.startUp.startUp();
    const currentParameter = this.activatedRoute.snapshot.params
    this.activatedRoute.params
      .pipe(
        tap(param => {
          if ('fabricaId' in param) {
            this.loadFabrica(param['fabricaId']);
          }
        })
      )
    this.loadFabrica(currentParameter['fabricaId']);
  }
}
