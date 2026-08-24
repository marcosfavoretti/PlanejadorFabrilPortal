import { Injectable, signal } from '@angular/core';
import {
  getAlbumHistory,
  getInspectionFailures,
  getMediaUrl,
  getPackDetailUrl,
  getProductAlbums,
  resolveProductLabel,
} from '@/api/production-history';
import type {
  InspectionFailureResponse,
  MediaAssetResponse,
  PaginatedReportsResponse,
  PhotoAlbumResponse,
  ProductContextResponse,
  ProductionHistoryRecordResponse,
} from '@/api/production-history';
import { from, map, Observable } from 'rxjs';
import {
  InspectionFailure,
  MediaAsset,
  PaginatedReports,
  PhotoAlbum,
  ProductContext,
  ProductionHistoryRecord,
} from '@/app/features/mobile/models/production-history.models';

@Injectable({ providedIn: 'root' })
export class ProductionHistoryApiService {
  private readonly mediaUrlVersion = signal(0);
  private readonly mediaUrls = new Map<string, string>();
  private readonly mediaRequests = new Set<string>();

  resolveLabel(label: string): Observable<ProductContext> {
    return from(resolveProductLabel(label)).pipe(
      map((response) => this.toProductContext(response)),
    );
  }

  loadAlbums(
    product: Pick<ProductContext, 'partCode' | 'serialNumber'>,
  ): Observable<PhotoAlbum[]> {
    return from(
      getProductAlbums({
        pn: product.partCode,
        serialNumber: product.serialNumber,
      }),
    ).pipe(
      map((response) =>
        response
          .map((album) => this.toAlbum(album))
          .sort((a, b) => a.nome.localeCompare(b.nome)),
      ),
    );
  }

  loadAlbumHistory(request: {
    product: Pick<ProductContext, 'partCode' | 'serialNumber'>;
    album: string;
    page: number;
    limit: number;
    codItem?: string;
    gate?: string;
  }): Observable<PaginatedReports> {
    return from(
      getAlbumHistory({
        page: request.page,
        limit: request.limit,
        pn: request.product.partCode,
        serialNumber: request.product.serialNumber,
        appName: request.album,
        'properties.codItem': request.codItem || undefined,
        'properties.gate': request.gate || undefined,
      }),
    ).pipe(
      map((response) =>
        this.toPaginatedReports(response, request.page, request.limit),
      ),
    );
  }

  loadInspectionFailures(
    product: Pick<ProductContext, 'partCode' | 'serialNumber'>,
  ): Observable<InspectionFailure[]> {
    const currentYear = new Date().getFullYear();
    return from(
      getInspectionFailures({
        startDate: `01/01/${currentYear - 1} 00:00:00`,
        endDate: `31/12/${currentYear} 23:59:59`,
        nSerie: product.serialNumber,
        partCode: product.partCode,
      }),
    ).pipe(map((response) => this.toInspectionFailures(response)));
  }

  mediaUrl(media: Pick<MediaAsset, 'path' | 'physicalName'>): string {
    this.mediaUrlVersion();
    const key = `${media.path}\u0000${media.physicalName}`;
    const cachedUrl = this.mediaUrls.get(key);
    if (cachedUrl) return cachedUrl;

    if (!this.mediaRequests.has(key)) {
      this.mediaRequests.add(key);
      void getMediaUrl({ path: media.path, name: media.physicalName })
        .then((blob) => {
          this.mediaUrls.set(key, URL.createObjectURL(blob));
          this.mediaUrlVersion.update((version) => version + 1);
        })
        .catch(() => undefined)
        .finally(() => this.mediaRequests.delete(key));
    }

    return '';
  }

  loadPackHtml(code: string): Observable<string> {
    return from(getPackDetailUrl(code));
  }

  private toProductContext(value: ProductContextResponse): ProductContext {
    return { partCode: value.partCode, serialNumber: value.serialNumber };
  }

  private toAlbum(value: PhotoAlbumResponse): PhotoAlbum {
    return { nome: value.nome, quantidadeFotos: value.quantidadeFotos };
  }

  /**
   * The gallery API returns the current payload as `{ data, totalPages }`, while
   * the initial OpenAPI contract used `{ items, pages }`. Normalize both forms
   * here so selecting an album always produces rows for its media assets.
   */
  private toPaginatedReports(
    value: PaginatedReportsResponse,
    page: number,
    limit: number,
  ): PaginatedReports {
    const response = value as PaginatedReportsResponse & {
      data?: ProductionHistoryRecordResponse[];
      totalPages?: number;
    };
    const items = response.items ?? response.data ?? [];

    return {
      items: items.map((item) => this.toHistoryRecord(item)),
      total: response.total ?? items.length,
      page: response.page ?? page,
      limit: response.limit ?? limit,
      pages:
        response.pages ??
        response.totalPages ??
        Math.ceil((response.total ?? items.length) / limit),
    };
  }

  private toHistoryRecord(
    value: ProductionHistoryRecordResponse,
  ): ProductionHistoryRecord {
    const response = value as ProductionHistoryRecordResponse & {
      properties?: {
        codItem?: string;
        gate?: string;
        productionId?: string;
        serialNumber?: string;
      };
    };

    return {
      _id: response._id,
      code: response.code,
      appName: response.appName,
      pn: response.pn,
      serialNumber: response.serialNumber ?? response.properties?.serialNumber,
      productionId: response.productionId ?? response.properties?.productionId,
      codItem: response.codItem ?? response.properties?.codItem,
      gate: response.gate ?? response.properties?.gate,
      featureColumn: response.featureColumn ?? 'QUALIDADE',
      status: response.status,
      attempts: response.attempts,
      media: (response.media ?? []).map((entry) => this.toMedia(entry)),
    };
  }

  private toMedia(value: MediaAssetResponse): MediaAsset {
    return {
      path: value.path,
      physicalName: value.physicalName,
      originalName: value.originalName,
      type: value.type,
      mimeType: value.mimeType,
    };
  }

  private toInspectionFailures(value: unknown): InspectionFailure[] {
    const response =
      value && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : {};
    const entries = Array.isArray(value)
      ? value
      : (['data', 'items', 'results', 'records', 'response', 'content']
          .map((key) => response[key])
          .find(Array.isArray) ?? []);

    return entries
      .filter(
        (item): item is InspectionFailureResponse =>
          !!item && typeof item === 'object',
      )
      .map((item) => this.toInspectionFailure(item));
  }

  private toInspectionFailure(
    value: InspectionFailureResponse,
  ): InspectionFailure {
    return value;
  }
}
