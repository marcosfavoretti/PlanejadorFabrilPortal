import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { toSignal, rxResource } from '@angular/core/rxjs-interop';

import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';

// PrimeNG Imports
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext'; // Adicione para ficar bonito
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';

// RxJS
import { catchError, debounceTime, distinctUntilChanged, of, Subject, takeUntil, tap, startWith, map } from 'rxjs';

// Seus Componentes/Serviços
import { GlobalHeaderComponent } from "@/app/widgets/global-header/global-header.component";
import { TableDynamicComponent } from "@/app/table-dynamic/table-dynamic.component";
import { SidebarItem } from '@/@core/type/SidebarItem';
import { TableModel } from '@/app/table-dynamic/@core/table.model';
import { CertificadosCatControllerConsultarCertificadosQueryParams } from '@/api/certificados';
import { LoadingPopupService } from '@/app/services/LoadingPopup.service';
import { CertificadosAPIService } from '@/app/services/CertificadosAPI.service';
import { PageLayoutComponent } from "@/app/layouts/page-layout/page-layout.component";

@Component({
  selector: 'app-certificado-caterpillar-page',
  standalone: true,
  imports: [
    CommonModule,
    TableDynamicComponent,
    PaginatorModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SidebarModule,
    ButtonModule,
    PageLayoutComponent,
    ReactiveFormsModule,
    SkeletonModule
],
  templateUrl: './certificado-caterpillar-page.component.html',
  styleUrl: './certificado-caterpillar-page.component.scss'
})
export class CertificadoCaterpillarPageComponent implements OnInit, OnDestroy {

  private readonly certificadoAPI = inject(CertificadosAPIService);
  private readonly popup = inject(LoadingPopupService);
  private readonly fb = inject(FormBuilder);

  private destroy$ = new Subject<void>();
  sidebarVisible: boolean = false;

  queryParams = signal<CertificadosCatControllerConsultarCertificadosQueryParams>({
    limit: 10,
    page: 0,
  });

  totalRecords: number = 0;

  // Form de Filtros
  filterForm = this.fb.group({
    produto: [''],
    seriaNumber: ['']
  });

  // Signal de filtros com debounce — ao mudar filtro reseta para page 0
  filters = toSignal(
    this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value),
      debounceTime(400),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => this.queryParams.update(p => ({ ...p, page: 0 })))
    ),
    { initialValue: this.filterForm.value }
  );

  // Resource para busca de dados — reage a qualquer mudança de filters, page ou limit
  certificadosResource = rxResource({
    request: () => ({
      filters: this.filters(),
      page: this.queryParams().page,
      limit: this.queryParams().limit
    }),
    loader: ({ request }) => this.certificadoAPI.consultarCertificados({
      produto: request.filters.produto || undefined,
      seriaNumber: request.filters.seriaNumber || undefined,
      page: request.page,
      limit: request.limit
    }).pipe(
      tap(data => {
        this.totalRecords = (data as any).total ?? (data.totalPages * (this.queryParams().limit || 10));
      }),
      catchError((err) => {
        const message = (err.response?.data?.message) || 'Erro ao buscar certificados';
        this.popup.showErrorMessage(message);
        return of({ data: [] });
      })
    )
  });

  // Signal computado para a tabela
  certificados = computed(() => this.certificadosResource.value()?.data || []);

  itens: SidebarItem[] = [
    {
      label: 'Certificado Caterpillar',
      icon: 'pi pi-file',
      route: '/certificados-cat'
    }
  ];

  tableShema: TableModel = {
    title: '',
    paginator: false,
    columns: [
      { field: '_id', alias: '_id' },
      { field: 'produto', alias: 'ROPS' },
      { field: 'serialNumber', alias: 'Serial Number' },
      { field: 'serverTime', alias: 'Data', isDate: true },
      {
        field: '', alias: 'Ações', button: {
          command: async (rowData: any) => this.downloadTxt(rowData),
          icon: 'pi pi-cloud-download',
          label: 'TXT'
        },
        isButton: true
      },
    ],
    totalize: false
  };

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageChange(event: PaginatorState) {
    this.queryParams.update(p => ({ ...p, page: event.page!, limit: event.rows! }));
  }

  /**
   * Lógica de download separada para limpeza do código
   */
  private downloadTxt(rowData: any) {
    this.certificadoAPI.dowloadTxtCertificado(rowData._id)
      .pipe(
        tap(dataStream => {
          const blob = new Blob([dataStream], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${rowData.serialNumber}.txt`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }),
        catchError(err => {
          const message = (err?.response?.message ?? err.response?.data?.message) || 'Erro ao baixar arquivo';
          this.popup.showErrorMessage(message);
          return of(null);
        })
      )
      .subscribe();
  }
}