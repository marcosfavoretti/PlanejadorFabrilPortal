import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { EstruturaApiService } from '@/app/features/estrutura/services/EstruturaApi.service';
import { BarcodeScannerInputComponent } from '@/app/shared/components/barcode-scanner-input/barcode-scanner-input.component';
import { PartcodeInputComponent } from '@/app/shared/components/partcode-input/partcode-input.component';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';

@Component({
  selector: 'app-check-list-history-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PaginatorModule,
    TableDynamicComponent,
    BarcodeScannerInputComponent,
    PartcodeInputComponent,
  ],
  templateUrl: './check-list-history-page.component.html',
  styleUrl: './check-list-history-page.component.css',
})
export class CheckListHistoryPageComponent implements OnInit {
  readonly pageSize = 10;
  checklists: any[] = [];
  total = 0;
  page = 0;
  rows = this.pageSize;
  loading = false;
  error = '';
  filters = { orderNum: '', codigoItem: '', tag: '' };
  readonly tableModel: TableModel = {
    title: '',
    paginator: false,
    totalize: false,
    dataKey: 'id',
    sortField: 'dataRealizacao',
    sortOrder: -1,
    columns: [
      { field: 'orderNum', alias: 'Ordem' },
      { field: 'codigoItem', alias: 'Partcode', isCodeBlock: true },
      { field: 'tag', alias: 'Tag', isTag: true },
      { field: 'separador', alias: 'Separador' },
      { field: 'dataRealizacao', alias: 'Realizado em', isDate: true },
    ],
  };

  constructor(
    private readonly apiService: EstruturaApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    this.filters = {
      orderNum: query.get('order') || '',
      codigoItem: query.get('partcode') || '',
      tag: query.get('tag') || '',
    };
    this.page = Math.max(0, Number(query.get('page')) || 0);
    this.rows = Math.max(1, Number(query.get('limit')) || this.pageSize);
    this.search(this.page);
  }

  search(page = 0): void {
    this.page = page;
    this.updateQueryParams();
    this.loading = true;
    this.error = '';
    this.apiService
      .listCompletedChecklists({ page, limit: this.rows, ...this.filters })
      .subscribe({
        next: (response) => {
          this.checklists = response.data;
          this.total = response.total;
          this.page = response.page;
          this.rows = response.limit || this.pageSize;
          this.loading = false;
        },
        error: () => {
          this.checklists = [];
          this.total = 0;
          this.loading = false;
          this.error =
            'Não foi possível consultar os checklists realizados. Tente novamente.';
        },
      });
  }

  clearFilters(): void {
    this.filters = { orderNum: '', codigoItem: '', tag: '' };
    this.search();
  }

  onOrderScanned(orderNum: string): void {
    const normalizedOrderNum = orderNum.trim();
    if (!normalizedOrderNum) return;

    this.filters.orderNum = normalizedOrderNum;
    this.filters.codigoItem = '';
    this.search(0);
  }

  onOrderValueChange(orderNum: string): void {
    this.filters.orderNum = orderNum;
    this.page = 0;
    this.updateQueryParams();
  }

  onPageChange(event: PaginatorState): void {
    const rows = event.rows || this.rows;
    this.rows = rows;
    this.search(Math.floor((event.first || 0) / rows));
  }

  get paginatorFirst(): number {
    return this.page * this.rows;
  }

  private updateQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        order: this.filters.orderNum.trim() || null,
        partcode: this.filters.codigoItem.trim().toUpperCase() || null,
        tag: this.filters.tag.trim().toLowerCase() || null,
        page: this.page > 0 ? this.page : null,
        limit: this.rows !== this.pageSize ? this.rows : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
