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
  private readonly responseCache = new Map<
    string,
    { expiresAt: number; promise: Promise<unknown> }
  >();
  private readonly cacheDurationMs = 5 * 60 * 1000;
  private readonly maxCachedResponses = 50;
  private readonly mediaUrls = signal(new Map<string, string>());
  private readonly mediaRequests = new Set<string>();
  private readonly mediaQueue: MediaAsset[] = [];
  private activeMediaRequests = 0;
  private readonly maxConcurrentMediaRequests = 4;
  private readonly unavailableMedia = new Set<string>();

  clearResponseCache(): void {
    this.responseCache.clear();
  }

  resolveLabel(label: string): Observable<ProductContext> {
    return this.cachedResponse(
      `label:${label.trim()}`,
      () => resolveProductLabel(label),
    ).pipe(
      map((response) => this.toProductContext(response)),
    );
  }

  loadAlbums(
    product: Pick<ProductContext, 'partCode' | 'serialNumber'>,
  ): Observable<PhotoAlbum[]> {
    return this.cachedResponse(
      `albums:${this.productKey(product)}`,
      () =>
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
    return this.cachedResponse(
      `history:${JSON.stringify([
        this.productKey(request.product),
        request.album,
        request.page,
        request.limit,
        request.codItem ?? '',
        request.gate ?? '',
      ])}`,
      () =>
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
    return this.cachedResponse(
      `inspections:${this.productKey(product)}:${currentYear}`,
      () =>
        getInspectionFailures({
          startDate: `01/01/${currentYear - 1} 00:00:00`,
          endDate: `31/12/${currentYear} 23:59:59`,
          nSerie: product.serialNumber,
          partCode: product.partCode,
        }),
    ).pipe(map((response) => this.toInspectionFailures(response)));
  }

  mediaUrl(media: Pick<MediaAsset, 'path' | 'physicalName'>): string {
    return this.mediaUrls().get(this.mediaKey(media)) ?? '';
  }

  requestMedia(media: MediaAsset): void {
    const key = this.mediaKey(media);
    if (
      !media.path ||
      !media.physicalName ||
      this.mediaUrls().has(key) ||
      this.mediaRequests.has(key) ||
      this.unavailableMedia.has(key)
    ) return;

    this.mediaRequests.add(key);
    this.mediaQueue.push(media);
    this.loadQueuedMedia();
  }

  private loadQueuedMedia(): void {
    while (
      this.activeMediaRequests < this.maxConcurrentMediaRequests &&
      this.mediaQueue.length
    ) {
      const media = this.mediaQueue.shift()!;
      const key = this.mediaKey(media);
      this.activeMediaRequests++;
      void getMediaUrl(
        { path: media.path, name: media.physicalName },
        { responseType: 'blob' },
      )
        .then((blob) => {
          if (!(blob instanceof Blob) || !blob.size) {
            throw new Error('Resposta de mídia inválida');
          }
          const nextUrls = new Map(this.mediaUrls());
          nextUrls.set(key, URL.createObjectURL(blob));
          this.mediaUrls.set(nextUrls);
        })
        .catch(() => this.unavailableMedia.add(key))
        .finally(() => {
          this.activeMediaRequests--;
          this.mediaRequests.delete(key);
          this.loadQueuedMedia();
        });
    }
  }

  private mediaKey(media: Pick<MediaAsset, 'path' | 'physicalName'>): string {
    return `${media.path}\u0000${media.physicalName}`;
  }

  loadPackHtml(code: string): Observable<string> {
    return this.cachedResponse(`pack:${code}`, () => getPackDetailUrl(code));
  }

  private productKey(
    product: Pick<ProductContext, 'partCode' | 'serialNumber'>,
  ): string {
    return JSON.stringify([product.partCode.trim(), product.serialNumber.trim()]);
  }

  private cachedResponse<T>(
    key: string,
    loader: () => Promise<T>,
  ): Observable<T> {
    const now = Date.now();
    const cached = this.responseCache.get(key);
    if (cached && cached.expiresAt > now) {
      return from(cached.promise as Promise<T>);
    }
    if (cached) this.responseCache.delete(key);

    const promise = Promise.resolve()
      .then(loader)
      .catch((error) => {
        if (this.responseCache.get(key)?.promise === promise) {
          this.responseCache.delete(key);
        }
        throw error;
      });
    this.responseCache.set(key, {
      expiresAt: now + this.cacheDurationMs,
      promise,
    });
    if (this.responseCache.size > this.maxCachedResponses) {
      this.responseCache.delete(this.responseCache.keys().next().value!);
    }
    return from(promise);
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
