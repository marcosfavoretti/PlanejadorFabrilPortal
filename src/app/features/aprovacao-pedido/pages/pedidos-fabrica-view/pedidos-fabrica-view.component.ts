import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Toast } from 'primeng/toast';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext';
import { PedidoAprovacaoTabelaComponent } from '@/app/features/aprovacao-pedido/components/pedido-aprovacao-tabela/pedido-aprovacao-tabela.component';
import { PedidoAprovacaoToolbarComponent } from '@/app/features/aprovacao-pedido/components/pedido-aprovacao-toolbar/pedido-aprovacao-toolbar.component';
import { PedidoAprovacaoFlowService } from '@/app/features/aprovacao-pedido/services/pedido-aprovacao-flow.service';
import { LogixAceiteCompraApiService } from '@/app/features/aprovacao-pedido/services/logix-aceite-compra-api.service';
import { PedidoAprovacaoStoreService } from '@/app/features/aprovacao-pedido/services/pedido-aprovacao.store.service';
import { LoadingPopupService } from '@/app/shared/services/loading-popup.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, startWith, tap } from 'rxjs';

@Component({
  selector: 'app-pedidos-fabrica-view',
  standalone: true,
  imports: [
    Toast,
    PaginatorModule,
    InputTextModule,
    ReactiveFormsModule,
    PedidoAprovacaoTabelaComponent,
    PedidoAprovacaoToolbarComponent,
  ],
  templateUrl: './pedidos-fabrica-view.component.html',
  styleUrl: './pedidos-fabrica-view.component.css'
})
export class PedidosFabricaViewComponent
implements OnInit, OnDestroy {
  private readonly logixApi = inject(LogixAceiteCompraApiService);
  private readonly popup = inject(LoadingPopupService);
  private readonly fb = inject(FormBuilder);
  protected readonly approvalStore = inject(PedidoAprovacaoStoreService);
  protected readonly approvalFlow = inject(PedidoAprovacaoFlowService);
  protected readonly currentPage = signal(0);
  protected readonly rows = signal(10);
  protected readonly filterForm = this.fb.group({
    pedido: [''],
    fornecedor: [''],
    emissao: [''],
    comprador: [''],
  });
  protected readonly filters = toSignal(
    this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.getRawValue()),
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => this.currentPage.set(0)),
    ),
    { initialValue: this.filterForm.getRawValue() },
  );
  protected readonly hasActiveFilters = computed(() => {
    const filters = this.filters();

    return Object.values(filters).some((value) => !!String(value ?? '').trim());
  });
  protected readonly filteredRows = computed(() => {
    const rows = this.approvalStore.rows();
    const filters = this.filters();

    return rows.filter((row) =>
      this.matches(row.numeroPedido, filters.pedido) &&
      this.matches(row.fornecedor, filters.fornecedor) &&
      this.matchesDate(row.dataEmissao, filters.emissao) &&
      this.matches(row.comprador, filters.comprador),
    );
  });
  protected readonly totalRecords = computed(() =>
    this.hasActiveFilters() ? this.filteredRows().length : this.approvalStore.totalCount(),
  );
  protected readonly paginatorFirst = computed(() =>
    this.hasActiveFilters() ? 0 : this.currentPage() * this.rows(),
  );

  constructor() {
    effect(() => {
      this.rows.set(this.approvalStore.pageSize());
      this.currentPage.set(this.approvalStore.currentPage());
    });
  }

  ngOnInit(): void {
    this.loadPedidos(0, this.rows());
  }
  ngOnDestroy(): void {
      this.approvalStore.reset();
  }

  protected onPageChange(event: PaginatorState): void {
    const nextRows = event.rows ?? this.rows();
    const nextPage = Math.floor((event.first ?? 0) / nextRows);

    this.rows.set(nextRows);
    this.currentPage.set(nextPage);
    this.loadPedidos(nextPage, nextRows);
  }

  protected approveOne(rowId: string): void {
    this.approvalFlow.approveOne(rowId);
  }

  private loadPedidos(page: number, limit: number): void {
    this.popup.showWhile(
      this.logixApi.listarPedidos(page, limit).pipe(
        tap((pedidos) => this.approvalStore.setPedidos(pedidos)),
      ),
    );
  }

  private matches(value: string | null | undefined, term: string | null | undefined): boolean {
    if (!term?.trim()) {
      return true;
    }

    return (value ?? '').toLowerCase().includes(term.trim().toLowerCase());
  }

  private matchesDate(value: Date | null, term: string | null | undefined): boolean {
    if (!term?.trim()) {
      return true;
    }

    if (!value) {
      return false;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}` === term;
  }
}
