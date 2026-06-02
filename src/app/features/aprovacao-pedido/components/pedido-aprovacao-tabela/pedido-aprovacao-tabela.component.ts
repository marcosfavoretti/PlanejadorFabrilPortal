import { Component, EventEmitter, Output, computed, inject, input, signal } from '@angular/core';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import {
  PedidoAprovacaoRow,
  PedidoAprovacaoStoreService,
} from '@/app/features/aprovacao-pedido/services/pedido-aprovacao.store.service';
import { LogixAceiteCompraApiService } from '@/app/features/aprovacao-pedido/services/logix-aceite-compra-api.service';
import { PedidoAceiteCompraDetalheDto } from '@/api/logix-plugin';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pedido-aprovacao-tabela',
  standalone: true,
  imports: [TableDynamicComponent, CommonModule],
  templateUrl: './pedido-aprovacao-tabela.component.html',
  styleUrl: './pedido-aprovacao-tabela.component.css',
})
export class PedidoAprovacaoTabelaComponent {
  private readonly approvalStore = inject(PedidoAprovacaoStoreService);
  private readonly logixApi = inject(LogixAceiteCompraApiService);

  rowsOverride = input<PedidoAprovacaoRow[] | null>(null);
  scrollHeight = input<string>('flex');

  @Output() approveOne = new EventEmitter<string>();

  protected readonly rows = computed(() => this.rowsOverride() ?? this.approvalStore.rows());

  protected readonly rowDetailsMap = signal<Record<string, PedidoAceiteCompraDetalheDto[]>>({});
  protected readonly rowLoadingMap = signal<Record<string, boolean>>({});

  protected rowDetails(id: string): PedidoAceiteCompraDetalheDto[] | undefined {
    return this.rowDetailsMap()[id];
  }

  protected rowDetailsLoading(id: string): boolean {
    return !!this.rowLoadingMap()[id];
  }

  protected readonly schema = computed<TableModel>(() => ({
    title: '',
    paginator: false,
    totalize: false,
    expandable: true,
    dataKey: 'id',
    sortField: 'dataEmissao',
    sortOrder: 1,
    columns: [
      { alias: 'empresa', field: 'codEmpresa' },
      { alias: 'pedido', field: 'numeroPedido' },
      { alias: 'emissão', field: 'dataEmissao', isDate: true },
      { alias: 'comprador', field: 'comprador' },
      { alias: 'fornecedor', field: 'fornecedor' },
      { alias: 'valor', field: 'valorTotal', isCurrency: true },
      {
        alias: 'aprovar',
        field: 'approve',
        isButton: true,
        button: {
          label: '',
          icon: 'pi pi-check-circle',
          command: (row) => this.handleApprove(row),
        },
      },
    ],
  }));

  private handleApprove(row: PedidoAprovacaoRow): void {
    this.approveOne.emit(row.id);
  }

  protected handleRowExpand(row: PedidoAprovacaoRow): void {
    if (this.rowDetailsMap()[row.id] !== undefined || this.rowLoadingMap()[row.id]) {
      return;
    }

    this.rowLoadingMap.update(m => ({ ...m, [row.id]: true }));
    this.logixApi.consultarDetalhesPedido(row.numeroPedido, row.codEmpresa).subscribe({
      next: (payload: any) => {
        let safeDetalhes: PedidoAceiteCompraDetalheDto[] = [];
        if (Array.isArray(payload)) {
          safeDetalhes = payload;
        } else if (payload && typeof payload === 'object') {
          if (Array.isArray(payload.data)) safeDetalhes = payload.data;
          else if (Array.isArray(payload.content)) safeDetalhes = payload.content;
          else if (Array.isArray(payload.items)) safeDetalhes = payload.items;
          else if (Array.isArray(payload.Response)) safeDetalhes = payload.Response;
          else if (Array.isArray(payload.detalhes)) safeDetalhes = payload.detalhes;
        }
        this.rowDetailsMap.update(m => ({ ...m, [row.id]: safeDetalhes }));
        this.rowLoadingMap.update(m => ({ ...m, [row.id]: false }));
      },
      error: () => {
        this.rowLoadingMap.update(m => ({ ...m, [row.id]: false }));
      }
    });
  }
}
