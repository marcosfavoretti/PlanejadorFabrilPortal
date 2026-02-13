import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { isSameDay } from 'date-fns';

// PrimeNG & Layout
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect'; // Added MultiSelectModule
import { TableDynamicComponent } from "@/app/table-dynamic/table-dynamic.component";
import { PageLayoutComponent } from "@/app/layouts/page-layout/page-layout.component";
import { HorasIrregularesParetoChartComponent } from "@/app/widgets/horas-irregulares-pareto-chart/horas-irregulares-pareto-chart.component";

// Services & Models
import { RelogioPontoAPIService } from '@/app/services/RelogioPontoAPI.service';
import { FuncionariosAPIService } from '@/app/services/FuncionariosAPI.service';
import { TableModel, tableColumns } from '@/app/table-dynamic/@core/table.model';
import {
  ResCentroDeCustoDTO,
  ResHorasIrregularesDTO,
  ResRegistroPontoTurnoPontoDTO
} from '@/api/relogio';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-relogio-pont-page',
  standalone: true,
  imports: [
    TableDynamicComponent, SkeletonModule, ReactiveFormsModule,
    CommonModule, FormsModule, PageLayoutComponent,
    PaginatorModule, HorasIrregularesParetoChartComponent, DropdownModule, MultiSelectModule // Added MultiSelectModule
  ],
  templateUrl: './relogio-pont-page.component.html',
  styleUrl: './relogio-pont-page.component.css'
})
export class RelogioPontPageComponent implements OnInit {
  private api = inject(RelogioPontoAPIService);
  private fb = inject(FormBuilder);
  private funcionariosAPIService = inject(FuncionariosAPIService);
  private routerAcive = inject(ActivatedRoute);

  // --- States (Signals) ---

  preFilterSetor = signal<string[] | undefined>(undefined);
  tableData = signal<any[]>([]);
  chartHorasIrregulares = signal<ResHorasIrregularesDTO[]>([]);
  totalItems = signal(0);
  currentPage = signal(0);
  itemsPerPage = 10;
  fetching = { table: false, pareto: false };
  centroDeCusto: ResCentroDeCustoDTO[] = [];
  totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage));

  // --- Form & Search Gatilho ---
  filterForm = this.fb.group({
    indetificador: [''],
    dataInicio: [''],
    dataFim: [''],
    ccid: [[] as ResCentroDeCustoDTO[]]
  });

  private getFilterParams() {
    const filter = { ...this.filterForm.value } as any;
    let ccidsToUse: string[] | undefined;

    if (this.preFilterSetor() && this.preFilterSetor()!.length > 0) {
      ccidsToUse = this.preFilterSetor()!;
    } else if (filter.ccid && filter.ccid.length > 0) {
      ccidsToUse = filter.ccid.map((cc: ResCentroDeCustoDTO) => cc.ccid);
    }
    return {
      ...filter,
      ccid: (ccidsToUse ?? []).length > 0 ? ccidsToUse : undefined,
      dataInicio: filter.dataInicio || undefined,
      dataFim: filter.dataFim || undefined,
    };
  }


  private searchSubject = new Subject<void>();
  private routeParams = this.routerAcive.snapshot.params;

  // --- Configuração da Tabela ---
  tableModel: TableModel = {
    paginator: false,
    title: '',
    columns: [],
    ghostControll: [
      {
        color: '#eb5c5c95', desc: 'marcações ímpares', field: 'status', ifValueEqual: "INCOMPLETO"
      },
      {
        color: '#f2d38895',
        desc: 'excedido limite de 09 horas',
        field: 'status',
        ifRowFunction: (row: any) => row.horasIrregular > 0
      }
    ],
    totalize: false
  };

  ngOnInit(): void {
    const ccsParam = this.routeParams['ccs'];

    // 1. Iniciamos carregando os Centros de Custo
    this.laodCentroDeCusto().subscribe({
      next: (res) => {
        // 2. Configuramos os filtros iniciais baseados nos Centros de Custo carregados
        if (ccsParam) {
          const lista = ccsParam.split(',');
          this.preFilterSetor.set(lista);
          const targets = this.centroDeCusto.filter(cc => lista.includes(cc.ccid.toString()));
          this.filterForm.patchValue({ ccid: targets });
        } else {
          this.preFilterSetor.set([]);
        }

        // 3. Agora que os dados base existem, ativamos os "Ouvintes" (Streams)
        this.setupDataStreams();

        // 4. Disparamos a busca inicial
        this.search();
      },
      error: (err) => console.error("Erro ao carregar centros de custo", err)
    });
  }

  /**
   * Encapsula a lógica de escuta do searchSubject.
   * Separar isso evita que os subscribers sejam criados múltiplas vezes.
   */
  private setupDataStreams(): void {
    // Fluxo da TABELA
    this.searchSubject.pipe(
      tap(() => this.fetching.table = true),
      switchMap(() => this.loadData(this.currentPage()).pipe(
        catchError(() => of(null))
      ))
    ).subscribe(res => {
      if (res) {
        const data = res.data || [];
        const total = res.total || 0;
        this.processData(data);
        this.totalItems.set(total);
      }
      this.fetching.table = false;
    });

    // Fluxo do GRÁFICO
    this.searchSubject.pipe(
      tap(() => this.fetching.pareto = true),
      switchMap(() => this.loadHorasIrregulares().pipe(
        catchError(() => of([]))
      ))
    ).subscribe(kpiRes => {
      this.chartHorasIrregulares.set(kpiRes || []);
      this.fetching.pareto = false;
    });
  }

  search() {
    this.currentPage.set(0);
    this.searchSubject.next();
  }

  onPageChange(event: PaginatorState) {
    if (event.page !== undefined) {
      this.currentPage.set(event.page);
      this.itemsPerPage = event.rows || 10;
      this.searchSubject.next();
    }
  }

  // --- Métodos de API ---

  private loadData(page: number) {
    const params = this.getFilterParams();
    return this.api.consultarPonto({
      ...params,
      page: page + 1,
      limit: this.itemsPerPage
    });
  }

  private loadHorasIrregulares() {
    const params = this.getFilterParams();
    return this.api.consultarPontosIrregularesKPI({
      ...params,
      page: 1,
      limit: 9999
    });
  }

  private laodCentroDeCusto() {
    return this.funcionariosAPIService.getCentroDeCusto()
      .pipe(
        tap(res => this.centroDeCusto = res)
      );
  }

  // --- Processamento de Dados da Tabela ---
  private processData(data: ResRegistroPontoTurnoPontoDTO[]) {
    if (!data.length) {
      this.tableData.set([]);
      return;
    }

    const maxRegistros = Math.max(...data.map(item => item.registros?.length || 0));

    const newColumns: tableColumns[] = [
      { alias: 'Matrícula', field: 'matricula' },
      { alias: 'Setor', field: 'setor' },
      { alias: 'Nome', field: 'nome' },
      { alias: 'Data', field: 'turnoDia', isDate: true },
      { alias: 'Horas Trab.', field: "horasTrabalhadas" }
    ];

    for (let i = 1; i <= maxRegistros; i++) {
      newColumns.push({ alias: `M${i}`, field: `marcacao_${i}` });
      newColumns.push({ alias: `Hora ${i}`, field: `hora_${i}` });
    }
    newColumns.push({ alias: `Status`, field: `status` });
    this.tableModel.columns = newColumns;

    const mappedData = data.map(item => {
      const newItem: any = {
        matricula: item.matricula,
        nome: item.nome,
        horasIrregular: item.horasIrregulares,
        setor: item.setor,
        horasTrabalhadas: item.qtdHoras,
        turnoDia: item.turnoDia,
        // Status lógico: OK se par ou se for hoje (ainda em aberto)
        status: (item.registros.length % 2 === 0) || isSameDay(new Date(item.turnoDia), new Date()) ? 'OK' : 'INCOMPLETO'
      };

      if (item.registros) {
        [...item.registros]
          .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
          .forEach((reg, idx) => {
            newItem[`marcacao_${idx + 1}`] = reg.marcacao;
            newItem[`hora_${idx + 1}`] = reg.dataStr;
          });
      }

      return newItem;
    });

    this.tableData.set(mappedData);
  }
}