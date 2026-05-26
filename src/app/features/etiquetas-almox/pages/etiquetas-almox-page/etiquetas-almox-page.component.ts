import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, startWith, tap, catchError, of, finalize } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { PageLayoutComponent } from '@/app/shared/layouts/page-layout/page-layout.component';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import {
  EtiquetaAlmoxItem,
  EtiquetasAlmoxApiService,
} from '@/app/features/etiquetas-almox/services/EtiquetasAlmoxApi.service';
import {
  EtiquetaAlmoxSelectedItem,
  EtiquetasAlmoxSelectedListComponent,
} from '@/app/features/etiquetas-almox/components/etiquetas-almox-selected-list/etiquetas-almox-selected-list.component';

@Component({
  selector: 'app-etiquetas-almox-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PaginatorModule,
    SkeletonModule,
    ButtonModule,
    PageLayoutComponent,
    TableDynamicComponent,
    EtiquetasAlmoxSelectedListComponent,
  ],
  templateUrl: './etiquetas-almox-page.component.html',
  styleUrl: './etiquetas-almox-page.component.css'
})
export class EtiquetasAlmoxPageComponent {
  private static readonly ITEM_SEARCH_DEBOUNCE_MS = 700;

  private readonly fb = inject(FormBuilder);
  private readonly etiquetasApi = inject(EtiquetasAlmoxApiService);
  private readonly popup = inject(LoadingPopupService);

  protected readonly currentPage = signal(1);
  protected readonly rows = signal(10);
  protected readonly totalRecords = signal(0);
  protected readonly selectedItems = signal<EtiquetaAlmoxSelectedItem[]>([]);
  protected readonly pdfLoading = signal(false);

  protected readonly filterForm = this.fb.group({
    item: [''],
  });

  protected readonly filters = toSignal(
    this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value),
      debounceTime(EtiquetasAlmoxPageComponent.ITEM_SEARCH_DEBOUNCE_MS),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => this.currentPage.set(1))
    ),
    { initialValue: this.filterForm.value }
  );

  protected readonly itensResource = rxResource({
    request: () => ({
      item: this.filters().item?.trim() || '',
      page: this.currentPage(),
      limit: this.rows(),
    }),
    loader: ({ request }) => this.etiquetasApi.listarItens({
      page: request.page,
      limit: request.limit,
      item: request.item || undefined,
    }).pipe(
      tap(response => {
        this.totalRecords.set(response.total);
        this.rows.set(response.limit || 10);
      }),
      catchError((error) => {
        const backendMessage = error?.error?.message ?? error?.message ?? 'Erro ao carregar itens para etiquetas';
        this.popup.showErrorMessage(Array.isArray(backendMessage) ? backendMessage[0] : backendMessage);
        this.totalRecords.set(0);
        return of({
          data: [],
          total: 0,
          page: request.page,
          limit: 10,
          totalPages: 0,
        });
      })
    )
  });

  protected readonly itens = computed(() => this.itensResource.value()?.data ?? []);
  protected readonly selectedTotal = computed(() => this.selectedItems().reduce((total, item) => total + item.quantity, 0));
  protected readonly paginatorFirst = computed(() => (this.currentPage() - 1) * this.rows());

  protected readonly tableSchema: TableModel = {
    title: '',
    paginator: false,
    totalize: false,
    columns: [
      { field: 'item', alias: 'Item' },
      { field: 'den_item', alias: 'Descrição' },
      {
        field: 'addAction',
        alias: 'Ação',
        isButton: true,
        button: {
          label: 'Adicionar',
          icon: 'pi pi-plus',
          command: (row: EtiquetaAlmoxItem) => this.addItem(row),
        },
      },
    ],
  };

  protected onPageChange(event: PaginatorState): void {
    const nextRows = event.rows ?? this.rows();
    const nextPage = Math.floor((event.first ?? 0) / nextRows) + 1;

    this.rows.set(nextRows);
    this.currentPage.set(nextPage);
  }

  protected clearFilters(): void {
    this.currentPage.set(1);
    this.filterForm.reset({ item: '' });
  }

  protected addItem(item: EtiquetaAlmoxItem): void {
    this.selectedItems.update((current) => {
      const index = current.findIndex(selected => selected.item === item.item);

      if (index >= 0) {
        return current.map((selected, currentIndex) =>
          currentIndex === index
            ? { ...selected, quantity: selected.quantity + 1 }
            : selected
        );
      }

      return [
        ...current,
        {
          item: item.item,
          den_item: item.den_item,
          quantity: 1,
        },
      ];
    });
  }

  protected increaseQuantity(itemCode: string): void {
    this.selectedItems.update((current) => current.map(item =>
      item.item === itemCode
        ? { ...item, quantity: item.quantity + 1 }
        : item
    ));
  }

  protected decreaseQuantity(itemCode: string): void {
    this.selectedItems.update((current) => current.flatMap(item => {
      if (item.item !== itemCode) {
        return [item];
      }

      if (item.quantity <= 1) {
        return [];
      }

      return [{ ...item, quantity: item.quantity - 1 }];
    }));
  }

  protected removeItem(itemCode: string): void {
    this.selectedItems.update((current) => current.filter(item => item.item !== itemCode));
  }

  protected clearSelection(): void {
    this.selectedItems.set([]);
  }

  protected generatePdf(): void {
    if (this.pdfLoading()) {
      return;
    }

    const itens = this.buildPdfRequestItems();
    if (itens.length === 0) {
      this.popup.showErrorMessage('Selecione ao menos um item para gerar a etiqueta.');
      return;
    }

    this.pdfLoading.set(true);

    this.etiquetasApi.gerarPdf(itens).pipe(
      tap((blob) => {
        const fileUrl = URL.createObjectURL(blob);
        const openedWindow = window.open(fileUrl, '_blank', 'noopener,noreferrer');

        if (!openedWindow) {
          const anchor = document.createElement('a');
          anchor.href = fileUrl;
          anchor.download = 'etiquetas-almox.pdf';
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
        }

        window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
      }),
      catchError((error) => {
        const backendMessage = error?.error?.message ?? error?.message ?? 'Erro ao gerar PDF das etiquetas';
        this.popup.showErrorMessage(Array.isArray(backendMessage) ? backendMessage[0] : backendMessage);
        return of(null);
      }),
      finalize(() => this.pdfLoading.set(false))
    ).subscribe();
  }

  private buildPdfRequestItems(): string[] {
    const normalizedItems = new Map<string, number>();

    this.selectedItems().forEach((item) => {
      const itemCode = item.item.trim();
      const quantity = Math.max(1, Math.floor(item.quantity || 0));

      if (!itemCode) {
        return;
      }

      normalizedItems.set(itemCode, (normalizedItems.get(itemCode) ?? 0) + quantity);
    });

    return Array.from(normalizedItems.entries()).flatMap(([itemCode, quantity]) =>
      Array.from({ length: quantity }, () => itemCode)
    );
  }
}
