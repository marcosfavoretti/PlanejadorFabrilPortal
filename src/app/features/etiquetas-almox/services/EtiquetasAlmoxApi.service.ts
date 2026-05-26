import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

const ETIQUETAS_ALMOX_API_BASE_URL = 'https://app.ethos.ind.br/api/almox-etiqueta';
const ETIQUETAS_ALMOX_PAGE_SIZE = 10;

export interface EtiquetaAlmoxItem {
  item: string;
  den_item: string;
  unid_med: string;
  local: string;
  raw: Record<string, unknown>;
}

export interface EtiquetaAlmoxPaginatedResponse {
  data: EtiquetaAlmoxItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class EtiquetasAlmoxApiService {
  private readonly http = inject(HttpClient);

  listarItens(params: { page: number; limit: number; item?: string }): Observable<EtiquetaAlmoxPaginatedResponse> {
    let httpParams = new HttpParams()
      .set('page', String(params.page))
      .set('limit', String(params.limit || ETIQUETAS_ALMOX_PAGE_SIZE));

    const normalizedSearch = params.item?.trim();
    if (normalizedSearch) {
      httpParams = httpParams.set('item', normalizedSearch);
    }

    return this.http.get<unknown>(`${ETIQUETAS_ALMOX_API_BASE_URL}/itens`, { params: httpParams }).pipe(
      map((response) => this.normalizePaginatedResponse(response, params.page))
    );
  }

  gerarPdf(itens: string[]): Observable<Blob> {
    const normalizedItems = itens
      .map(item => item.trim())
      .filter(Boolean);

    const params = new HttpParams().set('itens', normalizedItems.join(','));

    return this.http.get(`${ETIQUETAS_ALMOX_API_BASE_URL}/pdf`, {
      params,
      responseType: 'blob',
    });
  }

  private normalizePaginatedResponse(response: unknown, requestedPage: number): EtiquetaAlmoxPaginatedResponse {
    const data = this.extractItems(response);
    const responseRecord = this.asRecord(response);
    const page = this.readNumber(responseRecord, ['page', 'currentPage', 'pagina']) ?? requestedPage;
    const limit = this.readNumber(responseRecord, ['limit', 'pageSize', 'perPage']) ?? ETIQUETAS_ALMOX_PAGE_SIZE;
    const totalFromResponse = this.readNumber(responseRecord, ['total', 'count', 'totalItems', 'recordsTotal']);
    const totalPagesFromResponse = this.readNumber(responseRecord, ['totalPages', 'pages', 'lastPage']);

    const total = totalFromResponse
      ?? (totalPagesFromResponse ? totalPagesFromResponse * limit : this.estimateTotal(data.length, page, limit));

    return {
      data,
      total,
      page,
      limit,
      totalPages: totalPagesFromResponse ?? Math.max(1, Math.ceil(total / limit)),
    };
  }

  private extractItems(response: unknown): EtiquetaAlmoxItem[] {
    if (Array.isArray(response)) {
      return response.map(item => this.normalizeItem(item)).filter((item): item is EtiquetaAlmoxItem => !!item);
    }

    const record = this.asRecord(response);
    const candidateKeys = ['data', 'items', 'results', 'content', 'rows', 'list'];

    for (const key of candidateKeys) {
      const value = record?.[key];
      if (Array.isArray(value)) {
        return value.map(item => this.normalizeItem(item)).filter((item): item is EtiquetaAlmoxItem => !!item);
      }
    }

    return [];
  }

  private normalizeItem(item: unknown): EtiquetaAlmoxItem | null {
    const record = this.asRecord(item);
    if (!record) {
      return null;
    }

    const den_item = this.readString(record, ['den_item', 'descricao', 'description', 'nome', 'name', 'itemCliente']) ?? '';
    if (!den_item) {
      return null;
    }

    const itemCode = this.readString(record, ['item', 'partcode', 'codigo', 'code', 'sku'])
      ?? this.extractCodeFromDenItem(den_item)
      ?? den_item.trim();
    const unid_med = this.readString(record, ['unid_med', 'unidade', 'unit']) ?? '';
    const local = this.readString(record, ['local', 'location']) ?? '';

    return {
      item: itemCode,
      den_item,
      unid_med,
      local,
      raw: record,
    };
  }

  private extractCodeFromDenItem(denItem: string): string | null {
    const normalized = denItem.trim();
    if (!normalized) {
      return null;
    }

    const match = normalized.match(/^[^\s#]+/);
    return match?.[0]?.trim() || null;
  }

  private estimateTotal(currentPageSize: number, page: number, limit: number): number {
    if (currentPageSize >= limit) {
      return (page * limit) + 1;
    }

    return ((page - 1) * limit) + currentPageSize;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private readString(record: Record<string, unknown> | null, keys: string[]): string | null {
    if (!record) {
      return null;
    }

    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      if (typeof value === 'number') {
        return String(value);
      }
    }

    return null;
  }

  private readNumber(record: Record<string, unknown> | null, keys: string[]): number | null {
    if (!record) {
      return null;
    }

    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }
}
