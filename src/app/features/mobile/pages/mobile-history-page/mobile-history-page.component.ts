import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { catchError, of, tap } from 'rxjs';
import { PageLayoutComponent } from '@/app/shared/layouts/page-layout/page-layout.component';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';
import { ProductionHistoryApiService } from '@/app/features/mobile/services/production-history-api.service';
import {
  HistoryRow,
  InspectionFailure,
  ProductContext,
} from '@/app/features/mobile/models/production-history.models';

@Component({
  selector: 'app-mobile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginatorModule,
    PageLayoutComponent,
    TableDynamicComponent,
  ],
  templateUrl: './mobile-history-page.component.html',
  styleUrl: './mobile-history-page.component.css',
})
export class MobileHistoryPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly historyApi = inject(ProductionHistoryApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly product = signal<ProductContext | null>(null);
  protected readonly selectedAlbum = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly limit = signal(10);
  protected readonly lookupLoading = signal(false);
  protected readonly lookupError = signal<string | null>(null);
  protected readonly inspectionError = signal<string | null>(null);
  protected readonly selectedMedia = signal<HistoryRow | null>(null);
  protected readonly mediaZoom = signal(1);
  protected readonly mediaRotation = signal(0);
  protected readonly mediaPosition = signal({ x: 0, y: 0 });
  private mediaDragStart: {
    x: number;
    y: number;
    originX: number;
    originY: number;
  } | null = null;

  protected readonly lookupForm = this.formBuilder.nonNullable.group({
    label: '',
    partCode: '',
    serialNumber: '',
  });
  constructor() {
    this.lookupForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateLookupMode());

    this.restoreLookupFromUrl();
  }

  protected readonly albumsResource = rxResource({
    request: () => this.product(),
    loader: ({ request }) =>
      request ? this.historyApi.loadAlbums(request) : of([]),
  });
  protected readonly inspectionsResource = rxResource({
    request: () => this.product(),
    loader: ({ request }) =>
      request
        ? this.historyApi.loadInspectionFailures(request).pipe(
            tap(() => this.inspectionError.set(null)),
            catchError((error) => {
              this.inspectionError.set(
                this.errorMessage(
                  error,
                  'Não foi possível carregar as reprovas.',
                ),
              );
              return of([]);
            }),
          )
        : of([]),
  });
  protected readonly historyResource = rxResource({
    request: () => ({
      product: this.product(),
      album: this.selectedAlbum(),
      page: this.page(),
      limit: this.limit(),
    }),
    loader: ({ request }) =>
      request.product && request.album
        ? this.historyApi.loadAlbumHistory({
            product: request.product,
            album: request.album,
            page: request.page,
            limit: request.limit,
          })
        : of({ items: [], total: 0, page: 0, limit: request.limit, pages: 0 }),
  });

  protected readonly historyRows = computed<HistoryRow[]>(
    () =>
      this.historyResource.value()?.items.flatMap((record) =>
        record.media.length
          ? record.media.map((media, index) => ({
              id: `${record._id}-${index}`,
              record,
              media,
            }))
          : record.status === 'FAILED'
            ? [{ id: record._id, record }]
            : [],
      ) ?? [],
  );
  protected readonly inspections = computed(
    () => this.inspectionsResource.value() ?? [],
  );
  protected readonly totalRecords = computed(
    () => this.historyResource.value()?.total ?? 0,
  );
  protected readonly inspectionTableSchema: TableModel = {
    title: '',
    paginator: true,
    totalize: false,
    dataKey: 'Book',
    columns: [
      { field: 'ResourceName', alias: 'Recurso' },
      { field: 'PartCode', alias: 'Part number' },
      { field: 'NSerie', alias: 'Nº de série' },
      { field: 'Operation', alias: 'Operação' },
      { field: 'ServerTimestamp', alias: 'Data/hora', isDate: true },
      {
        field: 'openDetails',
        alias: 'Ficha',
        isButton: true,
        button: {
          label: 'Abrir ficha',
          icon: 'pi pi-external-link',
          command: (failure: InspectionFailure) => this.openInspection(failure),
        },
      },
    ],
  };

  protected submitLookup(): void {
    const {
      label,
      partCode: rawPartCode,
      serialNumber: rawSerialNumber,
    } = this.lookupForm.getRawValue();
    const pdiLabel = label.trim();
    const partCode = rawPartCode.trim().toUpperCase();
    const serialNumber = rawSerialNumber.trim();

    if (!pdiLabel && (!partCode || !serialNumber)) {
      this.lookupError.set(
        'Informe a etiqueta PDI ou o part code e o número de série.',
      );
      return;
    }

    this.updateLookupUrl({
      label: pdiLabel || null,
      partCode: pdiLabel ? null : partCode,
      serialNumber: pdiLabel ? null : serialNumber,
    });

    this.resetProductState();
    this.lookupLoading.set(true);

    if (pdiLabel) {
      this.lookupForm.controls.label.setValue(pdiLabel, { emitEvent: false });
      this.historyApi
        .resolveLabel(pdiLabel)
        .pipe(
          tap((product) => {
            this.product.set(product);
            this.lookupError.set(null);
          }),
          catchError((error) => {
            this.product.set(null);
            this.lookupError.set(
              this.errorMessage(
                error,
                'Etiqueta não encontrada. Tente novamente.',
              ),
            );
            return of(null);
          }),
        )
        .subscribe(() => this.lookupLoading.set(false));
      return;
    }

    this.lookupForm.controls.partCode.setValue(partCode, { emitEvent: false });
    this.lookupForm.controls.serialNumber.setValue(serialNumber, {
      emitEvent: false,
    });
    this.product.set({
      partCode,
      serialNumber,
    });
    this.lookupError.set(null);
    this.lookupLoading.set(false);
  }

  protected selectAlbum(name: string): void {
    this.selectedAlbum.set(name);
    this.page.set(0);
  }
  protected closeAlbum(): void {
    this.selectedAlbum.set(null);
    this.page.set(0);
    this.closeMedia();
  }
  protected onPageChange(event: PaginatorState): void {
    const limit = event.rows ?? this.limit();
    this.limit.set(limit);
    this.page.set(Math.floor((event.first ?? 0) / limit));
  }
  protected openRecordDetail(code: string): void {
    void this.router.navigate(['ficha', code], { relativeTo: this.route });
  }
  protected openMedia(row: HistoryRow): void {
    if (!row.media) return;
    this.selectedMedia.set(row);
    this.resetMediaView();
  }
  protected closeMedia(): void {
    this.selectedMedia.set(null);
    this.mediaDragStart = null;
  }
  protected zoomMedia(delta: number): void {
    this.mediaZoom.update((zoom) =>
      Math.min(4, Math.max(0.5, Number((zoom + delta).toFixed(2)))),
    );
  }
  protected rotateMedia(): void {
    this.mediaRotation.update((rotation) => (rotation + 90) % 360);
  }
  protected resetMediaView(): void {
    this.mediaZoom.set(1);
    this.mediaRotation.set(0);
    this.mediaPosition.set({ x: 0, y: 0 });
  }
  protected startMediaDrag(event: PointerEvent): void {
    const media = this.selectedMedia()?.media;
    if (media?.type === 'VIDEO' || media?.mimeType?.startsWith('video/'))
      return;
    const position = this.mediaPosition();
    this.mediaDragStart = {
      x: event.clientX,
      y: event.clientY,
      originX: position.x,
      originY: position.y,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  protected dragMedia(event: PointerEvent): void {
    if (!this.mediaDragStart) return;
    this.mediaPosition.set({
      x: this.mediaDragStart.originX + event.clientX - this.mediaDragStart.x,
      y: this.mediaDragStart.originY + event.clientY - this.mediaDragStart.y,
    });
  }
  protected stopMediaDrag(): void {
    this.mediaDragStart = null;
  }
  protected mediaTransform(): string {
    const position = this.mediaPosition();
    return `translate(${position.x}px, ${position.y}px) scale(${this.mediaZoom()}) rotate(${this.mediaRotation()}deg)`;
  }
  protected openInspection(failure: InspectionFailure): void {
    const bookCode = String(failure['Book'] ?? '').trim();
    const eventId = String(failure['EventID'] ?? '').trim();
    const inspectionId = bookCode || eventId || 'sem-book';

    void this.router.navigate(['ficha', inspectionId], {
      relativeTo: this.route,
      queryParams: {
        partCode: String(failure['PartCode'] ?? '').trim() || null,
        serialNumber: String(failure['NSerie'] ?? '').trim() || null,
      },
      state: { failure },
    });
  }
  protected mediaUrl(row: HistoryRow): string {
    return row.media ? this.historyApi.mediaUrl(row.media) : '';
  }
  protected isVideo(row: HistoryRow): boolean {
    return (
      row.media?.type === 'VIDEO' || !!row.media?.mimeType?.startsWith('video/')
    );
  }
  protected onMediaError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.style.display = 'none';
    (image.nextElementSibling as HTMLElement | null)?.style.setProperty(
      'display',
      'grid',
    );
  }

  private resetProductState(): void {
    this.product.set(null);
    this.selectedAlbum.set(null);
    this.page.set(0);
    this.closeMedia();
  }

  private restoreLookupFromUrl(): void {
    const label = this.route.snapshot.queryParamMap.get('label') ?? '';
    const partCode = this.route.snapshot.queryParamMap.get('partCode') ?? '';
    const serialNumber =
      this.route.snapshot.queryParamMap.get('serialNumber') ?? '';

    if (!label && !partCode && !serialNumber) return;

    this.lookupForm.patchValue(
      { label, partCode, serialNumber },
      { emitEvent: false },
    );
    this.updateLookupMode();
    this.submitLookup();
  }

  private updateLookupUrl(filters: {
    label: string | null;
    partCode: string | null;
    serialNumber: string | null;
  }): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: filters,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private updateLookupMode(): void {
    const { label, partCode, serialNumber } = this.lookupForm.getRawValue();
    const hasPdiLabel = Boolean(label.trim());
    const hasProductIdentifiers = Boolean(
      partCode.trim() || serialNumber.trim(),
    );

    if (hasPdiLabel) {
      this.lookupForm.controls.partCode.disable({ emitEvent: false });
      this.lookupForm.controls.serialNumber.disable({ emitEvent: false });
      return;
    }

    if (hasProductIdentifiers) {
      this.lookupForm.controls.label.disable({ emitEvent: false });
      return;
    }

    this.lookupForm.controls.label.enable({ emitEvent: false });
    this.lookupForm.controls.partCode.enable({ emitEvent: false });
    this.lookupForm.controls.serialNumber.enable({ emitEvent: false });
  }
  private errorMessage(error: unknown, fallback: string): string {
    const value = error as {
      response?: { data?: { message?: string | string[] } };
      message?: string;
    };
    const message = value.response?.data?.message ?? value.message;
    return Array.isArray(message) ? message[0] : message || fallback;
  }
}
