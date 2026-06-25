import { PedidoAceiteCompraResumoDto } from '@/api/logix-plugin';
import { computed, Injectable, signal } from '@angular/core';

export interface PedidoAprovacaoRow {
  id: string;
  codEmpresa: string;
  numeroPedido: string;
  numeroVersao: string;
  dataEmissao: Date | null;
  comprador: string;
  fornecedor: string;
  valorTotal: number | null;
}

@Injectable({ providedIn: 'root' })
export class PedidoAprovacaoStoreService {
  private readonly pedidos = signal<PedidoAceiteCompraResumoDto[]>([]);
  private readonly processingIds = signal<Set<string>>(new Set<string>());
  private readonly total = signal(0);
  private readonly page = signal(0);
  private readonly limit = signal(10);
  private readonly totalPages = signal(0);

  readonly rows = computed<PedidoAprovacaoRow[]>(() => {
    const pedidos = this.pedidos();

    return pedidos.map((pedido) => ({
      id: this.createId(pedido),
      codEmpresa: pedido.codEmpresa,
      numeroPedido: pedido.numeroPedido,
      numeroVersao: pedido.numeroVersao,
      dataEmissao: this.normalizeDate(pedido.dataEmissao),
      comprador: this.normalizeText(pedido.comprador),
      fornecedor: this.normalizeText(pedido.fornecedor),
      valorTotal: this.normalizePedidoTotal(pedido),
    }));
  });

  readonly pendingRows = computed(() => this.rows());

  readonly totalCount = computed(() => this.total());
  readonly pendingCount = computed(() => this.pendingRows().length);
  readonly companyCount = computed(() => new Set(this.rows().map((row) => row.codEmpresa)).size);
  readonly totalValue = computed(() => this.rows().reduce((total, row) => total + (row.valorTotal ?? 0), 0));
  readonly currentPage = computed(() => this.page());
  readonly pageSize = computed(() => this.limit());
  readonly pageCount = computed(() => this.totalPages());

  setPedidos(payload: any): void {
    let safePedidos: PedidoAceiteCompraResumoDto[] = [];
    let safeTotal = 0;
    let safePage = 0;
    let safeLimit = 10;
    let safeTotalPages = 0;

    if (Array.isArray(payload)) {
      safePedidos = payload;
      safeTotal = payload.length;
    } else if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.data)) safePedidos = payload.data;
      else if (Array.isArray(payload.content)) safePedidos = payload.content;
      else if (Array.isArray(payload.items)) safePedidos = payload.items;
      else if (Array.isArray(payload.Response)) safePedidos = payload.Response;
      else if (Array.isArray(payload.pedidos)) safePedidos = payload.pedidos;

      safeTotal = this.normalizePaginationNumber(payload.total) ?? safePedidos.length;
      safePage = this.normalizePaginationNumber(payload.page) ?? 0;
      safeLimit = (this.normalizePaginationNumber(payload.limit) ?? safePedidos.length) || 10;
      safeTotalPages = this.normalizePaginationNumber(payload.totalPages)
        ?? (safeLimit > 0 ? Math.ceil(safeTotal / safeLimit) : 0);
    } else {
      safeTotal = safePedidos.length;
    }

    this.pedidos.set(safePedidos);
    this.total.set(safeTotal);
    this.page.set(safePage);
    this.limit.set(safeLimit);
    this.totalPages.set(safeTotalPages);
  }

  removePedidos(ids: string[]): void {
    const idSet = new Set(ids);
    this.pedidos.update((pedidos) => pedidos.filter((pedido) => !idSet.has(this.createId(pedido))));
    this.processingIds.update((processing) => new Set(Array.from(processing).filter((id) => !idSet.has(id))));
  }

  markProcessing(ids: string[]): void {
    const nextIds = new Set(this.processingIds());
    ids.forEach((id) => nextIds.add(id));
    this.processingIds.set(nextIds);
  }

  unmarkProcessing(ids: string[]): void {
    const nextIds = new Set(this.processingIds());
    ids.forEach((id) => nextIds.delete(id));
    this.processingIds.set(nextIds);
  }

  reset(): void {
    this.pedidos.set([]);
    this.processingIds.set(new Set<string>());
    this.total.set(0);
    this.page.set(0);
    this.limit.set(10);
    this.totalPages.set(0);
  }

  private createId(pedido: PedidoAceiteCompraResumoDto): string {
    return `${pedido.codEmpresa}:${pedido.numeroPedido}:${pedido.numeroVersao}`;
  }

  private normalizeDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private normalizeText(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return String(value);
  }

  private normalizePedidoTotal(pedido: PedidoAceiteCompraResumoDto): number | null {
    const record = pedido as unknown as Record<string, unknown>;
    const candidateKeys = [
      'valorTotal',
      'valor_total',
      'total',
      'precoTotal',
      'preco_total',
      'valorPedido',
      'valor_pedido',
      'valorOc',
      'valor_oc',
    ];

    for (const key of candidateKeys) {
      if (key in record) {
        const normalized = this.normalizeNumber(record[key]);

        if (normalized !== null) {
          return normalized;
        }
      }
    }

    return null;
  }

  private normalizeNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      return this.parseNumericString(value);
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

      const primitiveEntry = Object.values(objectValue).find((entry) =>
        typeof entry === 'number' || typeof entry === 'string' || (entry && typeof entry === 'object'),
      );

      if (primitiveEntry !== undefined) {
        return this.normalizeNumber(primitiveEntry);
      }
    }

    return null;
  }

  private parseNumericString(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const sanitized = trimmed.replace(/[^\d,.-]/g, '');
    const hasComma = sanitized.includes(',');
    const hasDot = sanitized.includes('.');

    let normalized = sanitized;

    if (hasComma && hasDot) {
      normalized = sanitized.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
      normalized = sanitized.replace(',', '.');
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizePaginationNumber(value: unknown): number | null {
    const normalized = this.normalizeNumber(value);
    if (normalized === null) {
      return null;
    }

    return Math.max(0, Math.trunc(normalized));
  }
}
