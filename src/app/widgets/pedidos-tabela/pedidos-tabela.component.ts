import { TableModel } from '@/app/table-dynamic/@core/table.model';
import { Component, effect, inject, input, OnInit } from '@angular/core';
import { TableDynamicComponent } from "../../table-dynamic/table-dynamic.component";
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { switchMap, tap } from 'rxjs';
import { PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum } from '@/api';
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

  pedidoStore = inject(PedidoStoreService);
  planejavel = input<boolean>(false);

  // Armazena a definição base da tabela, sem a coluna de ação.
  private baseSchema: TableModel = {
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
      { alias: 'id', field: 'id' },
      { alias: 'codigo', field: 'codigo' },
      { alias: 'dataEntrega', isDate: true, field: 'dataEntrega' },
      { alias: 'item', field: 'item.Item' },
      { alias: 'apelido', field: 'item.tipo_item' },
      { alias: 'lote', field: 'lote' },
      { alias: 'processado', field: 'processado' },
    ]
  };

  // O schema que será renderizado. Ele será recriado toda vez que 'planejavel' mudar.
  public schema: TableModel = { ...this.baseSchema };

  constructor(
    private contextoFabricaService: ContextoFabricaService,
    private fabricaService: FabricaService,
    private syncService: FabricaMudancaSyncService,
    private popup: LoadingPopupService
  ) {
    // Cria um 'effect' que reage a mudanças no input 'planejavel'.
    effect(() => {
      // Cria uma cópia limpa do schema base.
      const newSchema = JSON.parse(JSON.stringify(this.baseSchema));

      // Se for planejável, adiciona a coluna de botão.
      if (this.planejavel()) {
        newSchema.columns.push({
          isButton: true,
          alias: 'planejar',
          field: 'planejar',
          button: {
            command: () => console.log('feito'),
            icon: 'pi pi-plus-circle',
            label: ''
          }
        });
        newSchema.columns.push({
          isButton: true,
          alias: 'remover',
          field: 'remover',
          button: {
            command: () => console.log('feito'),
            icon: '',
            label: 'desplanejar'
          }
        });
      }
      // Atualiza o schema do componente, fazendo com que a tabela seja renderizada novamente.
      this.schema = newSchema;
    });
  }

  ngOnInit(): void {
    this.pedidoStore
      .initialize(
        PedidoControllerConsultaPedidoMethodQueryParamsTipoConsultaEnum.todos
      )
      .subscribe();
    // A chamada para generateTable() foi removida daqui, pois o 'effect' já cuida disso.
  }

  onPedidoEscolhido($event: any): void {
    const column = $event.column;
    const pedidoId = $event.row.id;
    console.log(column, pedidoId, $event)
    if (!this.planejavel()) return;
    if (!Boolean($event.row.processado) || column === 'remover') {//se o pedido ainda nao foi processado ele planeja o pedido
      if (column === 'planejar') {
        const plan$ = this.fabricaService
          .planejamentos({ pedidoIds: [pedidoId] })
          .pipe(
            tap(
              () => {
                this.syncService.sync(this.contextoFabricaService.item()?.fabricaId!);
              })
          );
        this.popup.showWhile(plan$);
      }
      else if (column === 'remover') {
        const remover$ = this.fabricaService
          .desplanejamentoPedido({ pedidoIds: [pedidoId], fabricaId: this.contextoFabricaService.item()?.fabricaId! })
          .pipe(
            tap(
              () => {
                this.syncService.sync(this.contextoFabricaService.item()?.fabricaId!);
              })
          );
        this.popup.showWhile(remover$);
      }
    }
    else {//se o pedido ja foi planejado ele bate no endpoint de replanejamento
      alert('pedido ja planejados');
      // const plan$ = this.fabricaService
      //   .replanejamentoPedido({ pedidoId: pedidoId, fabricaId: this.contextoFabricaService.item()?.fabricaId! }).pipe(
      //     tap(() => console.log('[Planejamentos] Carregados para pedido:', pedidoId)),
      //     switchMap(() =>
      //       this.contextoFabricaService.refresh()
      //     ),
      //     tap(
      //       fabrica => {
      //         console.log('[Fábrica atualizada]:', fabrica.fabricaId);
      //         this.syncService.sync(fabrica.fabricaId);
      //       })
      //   );
      // this.popup.showWhile(plan$);
    }
  }
}
