import { TableModel } from '@/app/table-dynamic/@core/table.model';
import { Component, OnInit } from '@angular/core';
import { TableDynamicComponent } from "../../table-dynamic/table-dynamic.component";
import { PedidoService } from '@/app/services/Pedido.service';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { Observable, switchMap, tap } from 'rxjs';
import { PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum, PedidoResponseDTO } from '@/api';
import { AsyncPipe } from '@angular/common';
import { FabricaService } from '@/app/services/Fabrica.service';
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { FabricaMudancaSyncService } from '@/app/services/FabricaMudancaSync.service';

@Component({
  selector: 'app-pedidos-tabela',
  imports: [TableDynamicComponent, AsyncPipe],
  templateUrl: './pedidos-tabela.component.html',
  styleUrl: './pedidos-tabela.component.css'
})
export class PedidosTabelaComponent implements OnInit {
  constructor(
    private pedidoService: PedidoService,
    private contextoFabricaService: ContextoFabricaService,
    private fabricaService: FabricaService,
    private syncService: FabricaMudancaSyncService,
    private popup: LoadingPopupService
  ) { }

  public pedido$!: Observable<PedidoResponseDTO[]>;

  ngOnInit(): void {
    this.pedido$ = this.pedidoService.getFabricaPrincipal({
      tipoConsulta: PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum.planejados
    });
    this.popup.showWhile(this.pedido$);
  }

  onPedidoEscolhido($event: any): void {
    const pedidoId = $event.row.id;

    const plan$ = this.fabricaService.planejamentos({ pedidoIds: [pedidoId] }).pipe(
      tap(() => console.log('[Planejamentos] Carregados para pedido:', pedidoId)),
      switchMap(() =>
        this.contextoFabricaService.refreshFabricaPrincipal()
      ),
      tap(fabrica => {
        console.log('[Fábrica atualizada]:', fabrica.fabricaId);
        this.syncService.sync(fabrica.fabricaId);
      })
    );

    this.popup.showWhile(plan$);
  }

  public schema: TableModel = {
    title: 'Todos os pedidos',
    totalize: false,
    paginator: true,
    columns: [
      {
        alias: 'codigo',
        field: 'codigo'
      },
      {
        alias: 'dataEntrega',
        isDate: true,
        field: 'dataEntrega'
      },
      {
        alias: 'item',
        field: 'item'
      },
      {
        alias: 'lote',
        field: 'lote'
      },
      {
        alias: 'processado',
        field: 'processado'
      },
      {
        isButton: true,
        alias: '',
        field: '',
        button: {
          command: () => console.log('feito'),
          icon: 'pi pi-plus-circle',
          label: ''
        }
      }
    ]
  }
}
