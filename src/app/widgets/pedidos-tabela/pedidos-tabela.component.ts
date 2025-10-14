import { TableModel } from '@/app/table-dynamic/@core/table.model';
import { Component, inject, input, OnInit } from '@angular/core';
import { TableDynamicComponent } from "../../table-dynamic/table-dynamic.component";
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { switchMap, tap } from 'rxjs';
import { PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum, PedidoResponseDTO } from '@/api';
import { FabricaService } from '@/app/services/Fabrica.service';
import { ContextoFabricaService } from '@/app/services/ContextoFabrica.service';
import { FabricaMudancaSyncService } from '@/app/services/FabricaMudancaSync.service';
import { PedidoStoreService } from '@/app/services/PedidoStore.service';

@Component({
  selector: 'app-pedidos-tabela',
  imports: [TableDynamicComponent],
  templateUrl: './pedidos-tabela.component.html',
  styleUrl: './pedidos-tabela.component.css'
})
export class PedidosTabelaComponent implements OnInit {
  constructor(
    private contextoFabricaService: ContextoFabricaService,
    private fabricaService: FabricaService,
    private syncService: FabricaMudancaSyncService,
    private popup: LoadingPopupService
  ) { }

  pedidoStore = inject(PedidoStoreService);
  planejavel = input<boolean>(false);

  ngOnInit(): void {
    this.pedidoStore
      .initialize(
        PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum.todos
      )
      .pipe(
        tap(() => this.generateTable())
      )
      .subscribe();
  }

  onPedidoEscolhido($event: any): void {
    const pedidoId = $event.row.id;
    if (!this.planejavel()) return;
    if (!Boolean($event.row.processado)) {//se o pedido ainda nao foi processado ele planeja o pedido
      const plan$ = this.fabricaService
        .planejamentos({ pedidoIds: [pedidoId] }).pipe(
          tap(() => console.log('[Planejamentos] Carregados para pedido:', pedidoId)),
          switchMap(() =>
            this.contextoFabricaService.refresh()
          ),
          tap(
            fabrica => {
              console.log('[Fábrica atualizada]:', fabrica.fabricaId);
              this.syncService.sync(fabrica.fabricaId);
            })
        );
      this.popup.showWhile(plan$);
    }
    else {//se o pedido ja foi planejado ele bate no endpoint de replanejamento
      const plan$ = this.fabricaService
        .replanejamentoPedido({ pedidoId: pedidoId, fabricaId: this.contextoFabricaService.item()?.fabricaId! }).pipe(
          tap(() => console.log('[Planejamentos] Carregados para pedido:', pedidoId)),
          switchMap(() =>
            this.contextoFabricaService.refresh()
          ),
          tap(
            fabrica => {
              console.log('[Fábrica atualizada]:', fabrica.fabricaId);
              this.syncService.sync(fabrica.fabricaId);
            })
        );
      this.popup.showWhile(plan$);
    }
  }

  generateTable() {
    if (this.planejavel()) this.schema.columns.push({
      isButton: true,
      alias: '',
      field: '',
      button: {
        command: () => console.log('feito'),
        icon: 'pi pi-plus-circle',
        label: ''
      }
    });
  }

  public schema: TableModel = {
    title: 'Todos os pedidos',
    totalize: false,
    paginator: true,
    ghostControll: [
      {
        color: '#93ffa3c9',
        desc: 'itens planejados',
        field: 'processado',
        ifValueEqual: true
      },
      {
        color: '#eb5c5c95',
        desc: 'itens não planejados',
        field: 'processado',
        ifValueEqual: false
      }
    ],
    columns: [
      {
        alias: 'id',
        field: 'id'
      },
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
    ]
  }
}
