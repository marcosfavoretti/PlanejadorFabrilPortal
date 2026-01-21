import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';

// PrimeNG Imports
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext'; // Adicione para ficar bonito
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

// RxJS
import { catchError, debounceTime, distinctUntilChanged, of, Subject, takeUntil, tap } from 'rxjs';

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
    PageLayoutComponent
],
  templateUrl: './certificado-caterpillar-page.component.html',
  styleUrl: './certificado-caterpillar-page.component.css'
})
export class CertificadoCaterpillarPageComponent implements OnInit, OnDestroy {

  private readonly certificadoAPI = inject(CertificadosAPIService);
  private readonly popup = inject(LoadingPopupService);

  // Subject para controlar o delay da digitação
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  sidebarVisible: boolean = false;

  queryParams: CertificadosCatControllerConsultarCertificadosQueryParams = {
    limit: 5,
    page: 0,
  };

  totalRecords: number = 0;
  certificados = signal<any[]>([]);

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
    this.setupSearchListener();
    this.consultarCertificados();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configura o ouvinte de busca com Debounce
   * Isso evita que a API seja chamada a cada letra digitada
   */
  private setupSearchListener() {
    this.searchSubject.pipe(
      debounceTime(600), // Espera 600ms após o usuário parar de digitar
      distinctUntilChanged(), // Só busca se o valor for diferente do anterior
      takeUntil(this.destroy$) // Evita memory leak
    ).subscribe((value) => {
      this.executeSearch(value);
    });
  }

  /**
   * Método chamado pelo HTML a cada tecla (apenas repassa para o Subject)
   */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  /**
   * Lógica real de filtro
   */
  private executeSearch(value: string) {
    // 1. Limpa filtros anteriores para evitar conflito
    this.queryParams.produto = undefined;
    this.queryParams.seriaNumber = undefined; // Corrigi o typo 'seriaNumber' aqui, verifique sua interface

    // 2. Lógica de decisão (Número = Produto, Texto = Serial)
    const cleanValue = value.trim();

    if (cleanValue) {
      const isNumeric = /^[0-9]+$/.test(cleanValue);
      if (isNumeric) {
        this.queryParams.produto = cleanValue;
      } else {
        this.queryParams.seriaNumber = cleanValue;
      }
    }

    // 3. OBRIGATÓRIO: Voltar para a primeira página ao filtrar
    this.queryParams.page = 0;

    // 4. Consulta
    this.consultarCertificados();
  }

  consultarCertificados() {
    const consulta$ = this.certificadoAPI.consultarCertificados(this.queryParams)
      .pipe(
        tap(data => {
          this.certificados.set(data.data);
          this.totalRecords = (data as any).total ?? (data.totalPages * (this.queryParams.limit || 10));
        }),
        catchError(
          (err) => {
            const message = (err.response?.data?.message) || 'Erro ao buscar arquivo';
            this.popup.showErrorMessage(message);
            return of();
          }
        )
      )
      .subscribe()
  }

  onPageChange(event: PaginatorState) {
    this.queryParams.page = event.page;
    this.queryParams.limit = event.rows;
    this.consultarCertificados();
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