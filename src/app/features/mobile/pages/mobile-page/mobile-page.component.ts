import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { PdiOrderOpeningRes } from '@/api/mobile';
import { catchError, debounceTime, distinctUntilChanged, of, startWith, tap } from 'rxjs';
import { PageLayoutComponent } from '@/app/shared/layouts/page-layout/page-layout.component';
import { MobileStickerApiService } from '@/app/features/mobile/services/mobile-sticker-api.service';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';

type StickerStatusFilter = 'na' | 'used' | 'unused';
const EMPTY_STICKERS_PAGE = { data: [], total: 0, page: 0, limit: 20, totalPages: 0 };

@Component({ selector: 'app-mobile-page', standalone: true, imports: [CommonModule, ReactiveFormsModule, PaginatorModule, SkeletonModule, DialogModule, TableDynamicComponent, PageLayoutComponent], templateUrl: './mobile-page.component.html', styleUrl: './mobile-page.component.css' })
export class MobilePageComponent {
  private static readonly SEARCH_DEBOUNCE_MS = 400;
  private readonly formBuilder = inject(FormBuilder);
  private readonly stickerApi = inject(MobileStickerApiService);
  protected readonly currentPage = signal(0);
  protected readonly rows = signal(20);
  protected readonly status = signal<StickerStatusFilter>('na');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly orderOpeningVisible = signal(false);
  protected readonly orderOpeningLoading = signal(false);
  protected readonly orderOpeningError = signal<string | null>(null);
  protected readonly orderOpening = signal<PdiOrderOpeningRes | null>(null);
  protected readonly searchForm = this.formBuilder.nonNullable.group({ search: '' });
  protected readonly search = toSignal(this.searchForm.controls.search.valueChanges.pipe(startWith(this.searchForm.controls.search.value), debounceTime(MobilePageComponent.SEARCH_DEBOUNCE_MS), distinctUntilChanged(), tap(() => this.currentPage.set(0))), { initialValue: this.searchForm.controls.search.value });
  protected readonly stickersResource = rxResource({ request: () => ({ page: this.currentPage(), limit: this.rows(), search: this.search().trim(), status: this.status() }), loader: ({ request }) => this.loadStickers(request).pipe(tap(() => this.errorMessage.set(null)), catchError((error) => { this.errorMessage.set(this.getErrorMessage(error)); return of({ ...EMPTY_STICKERS_PAGE, page: request.page, limit: request.limit }); })) });
  protected readonly stickers = computed(() => this.stickersResource.value()?.data ?? []);
  protected readonly tableStickers = computed(() => this.stickers().map(sticker => ({ ...sticker, partcode: this.getPartcode(sticker), used: this.getStickerUsage(sticker), status: this.getStickerStatus(sticker) })));
  protected readonly totalRecords = computed(() => this.stickersResource.value()?.total ?? 0);
  protected readonly paginatorFirst = computed(() => this.currentPage() * this.rows());
  protected readonly statusLabel = computed(() => this.status() === 'used' ? 'Utilizadas' : this.status() === 'unused' ? 'Não utilizadas' : 'Todas');
  protected readonly tableSchema: TableModel = { title: '', paginator: false, totalize: false, dataKey: 'id', columns: [{ field: 'orderNum', alias: 'OP' }, { field: 'partcode', alias: 'Partcode' }, { field: 'serialNumber', alias: 'Número de série' }, { field: 'data', alias: 'DataMatrix', isCodeBlock: true }, { field: 'serverTime', alias: 'Gerada em', isDate: true }, { field: 'status', alias: 'Status', isButton: true, button: { label: (row) => row.status, icon: 'pi pi-info-circle', command: (row) => this.showOrderOpening(row), disabled: (row) => !row.used } }], ghostControll: [{ field: 'used', desc: 'Utilizada', ifValueEqual: true, color: '#dcfce7' }, { field: 'used', desc: 'Não utilizada', ifValueEqual: false, color: '#fef3c7' }] };
  protected setStatus(status: StickerStatusFilter): void { if (this.status() !== status) { this.status.set(status); this.currentPage.set(0); } }
  protected refresh(): void { this.stickersResource.reload(); }
  protected clearSearch(): void { this.searchForm.reset({ search: '' }); }
  protected onPageChange(event: PaginatorState): void { const rows = event.rows ?? this.rows(); this.rows.set(rows); this.currentPage.set(Math.floor((event.first ?? 0) / rows)); }
  protected formatDetailValue(value: unknown): string { if (value === null || value === undefined || value === '') return '---'; if (typeof value === 'object') return JSON.stringify(value); return String(value); }
  private showOrderOpening(sticker: { id?: unknown; used?: unknown }): void {
    if (!sticker.used || typeof sticker.id !== 'number') return;
    this.orderOpeningVisible.set(true);
    this.orderOpeningLoading.set(true);
    this.orderOpeningError.set(null);
    this.orderOpening.set(null);
    this.stickerApi.buscarAberturaEtiquetaPdi(sticker.id).subscribe({
      next: (orderOpening) => this.orderOpening.set(orderOpening),
      error: (error) => { this.orderOpeningError.set(this.getOrderOpeningErrorMessage(error)); this.orderOpeningLoading.set(false); },
      complete: () => this.orderOpeningLoading.set(false),
    });
  }
  private loadStickers(request: { page: number; limit: number; search: string; status: StickerStatusFilter }) { return this.stickerApi.listarEtiquetasPdi({ page: request.page, limit: request.limit, search: request.search || undefined, used: request.status === 'na' ? undefined : request.status === 'used' }); }
  private getStickerUsage(sticker: unknown): boolean | null { if (this.status() === 'used') return true; if (this.status() === 'unused') return false; const value = this.getUsedValue(sticker); return value === true || value === 1 || value === '1' ? true : value === false || value === 0 || value === '0' ? false : null; }
  private getStickerStatus(sticker: unknown): string { const used = this.getStickerUsage(sticker); return used === true ? 'Utilizada' : used === false ? 'Não utilizada' : 'N/A'; }
  private getUsedValue(sticker: unknown): unknown { return sticker && typeof sticker === 'object' ? (sticker as { used?: unknown; usedToOpenOrder?: unknown }).used ?? (sticker as { usedToOpenOrder?: unknown }).usedToOpenOrder : undefined; }
  private getPartcode(sticker: unknown): string { const partcode = sticker && typeof sticker === 'object' ? (sticker as { partcode?: unknown; partCode?: unknown }).partcode ?? (sticker as { partCode?: unknown }).partCode : undefined; return typeof partcode === 'string' && partcode.trim() ? partcode : '---'; }
  private getErrorMessage(error: unknown): string { const value = error as { response?: { data?: { message?: string | string[] } }; message?: string }; const message = value.response?.data?.message ?? value.message; return Array.isArray(message) ? message[0] : message || 'Não foi possível carregar as etiquetas PDI.'; }
  private getOrderOpeningErrorMessage(error: unknown): string { const message = this.getErrorMessage(error); return message === 'Não foi possível carregar as etiquetas PDI.' ? 'Não foi possível carregar os detalhes de uso da etiqueta.' : message; }
}
