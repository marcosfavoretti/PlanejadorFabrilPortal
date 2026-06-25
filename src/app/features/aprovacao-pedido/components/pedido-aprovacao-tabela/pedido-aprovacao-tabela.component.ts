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

  public normalizeText(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '---';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('pt-BR');
    }

    if (typeof value === 'object') {
      const objectValue = value as Record<string, unknown>;
      const candidateKeys = ['value', 'Value', 'text', 'Text', 'label', 'Label'];

      for (const key of candidateKeys) {
        if (key in objectValue) {
          return this.normalizeText(objectValue[key]);
        }
      }

      const primitiveEntry = Object.values(objectValue).find((entry) =>
        typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean',
      );

      if (primitiveEntry !== undefined) {
        return this.normalizeText(primitiveEntry);
      }
    }

    return '---';
  }

  public normalizeDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const textValue = this.normalizeText(value);

    if (textValue === '---') {
      return null;
    }

    const parsed = new Date(textValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  public normalizeNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (!trimmed) {
        return null;
      }

      const sanitized = trimmed.replace(/[^\d,.-]/g, '');
      const hasComma = sanitized.includes(',');
      const hasDot = sanitized.includes('.');
      const normalized = hasComma && hasDot
        ? sanitized.replace(/\./g, '').replace(',', '.')
        : hasComma
          ? sanitized.replace(',', '.')
          : sanitized;
      const parsed = Number(normalized);

      return Number.isFinite(parsed) ? parsed : null;
    }

    if (value && typeof value === 'object') {
      const objectValue = value as Record<string, unknown>;
      const candidateKeys = [
        '$numberDecimal',
        '$numberDouble',
        '$numberInt',
        '$numberLong',
        'value',
        'Value',
        'amount',
        'Amount',
      ];

      for (const key of candidateKeys) {
        if (key in objectValue) {
          return this.normalizeNumber(objectValue[key]);
        }
      }
    }

    return null;
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
