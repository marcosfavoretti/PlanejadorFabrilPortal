import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { isSameDay } from 'date-fns';

// PrimeNG & Layout
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { TableDynamicComponent } from "@/app/table-dynamic/table-dynamic.component";
import { PageLayoutComponent } from "@/app/layouts/page-layout/page-layout.component";
import { HorasIrregularesParetoChartComponent } from "@/app/widgets/horas-irregulares-pareto-chart/horas-irregulares-pareto-chart.component";

// Services & Models
import { RelogioPontoAPIService } from '@/app/services/RelogioPontoAPI.service';
import { FuncionariosAPIService } from '@/app/services/FuncionariosAPI.service';
import { TableModel, tableColumns } from '@/app/table-dynamic/@core/table.model';
import { 
  PontoControllerConsultaMarcacaoMethodQueryParams, 
  ResCentroDeCustoDTO, 
  ResHorasIrregularesDTO, 
  ResRegistroPontoTurnoPontoDTO 
} from '@/api/relogio';

@Component({
  selector: 'app-relogio-pont-page',
  standalone: true,
  imports: [
    TableDynamicComponent, SkeletonModule, ReactiveFormsModule, 
    CommonModule, FormsModule, PageLayoutComponent, AsyncPipe, 
    PaginatorModule, HorasIrregularesParetoChartComponent
  ],
  templateUrl: './relogio-pont-page.component.html',
  styleUrl: './relogio-pont-page.component.css'
})
export class RelogioPontPageComponent implements OnInit {
  private api = inject(RelogioPontoAPIService);
  private fb = inject(FormBuilder);
  private funcionariosAPIService = inject(FuncionariosAPIService);

  // --- States (Signals) ---
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
    ccid: [undefined]
  });

  private searchSubject = new Subject<void>();

  // --- Configuração da Tabela ---
  tableModel: TableModel = {
    paginator: false,
    title: '',
    columns: [],
    ghostControll: [
      { color: '#eb5c5c95', desc: 'marcações ímpares', field: 'status', ifValueEqual: "INCOMPLETO" },
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
    // 1. Carga inicial de dados estáticos
    this.laodCentroDeCusto().subscribe();

    // 2. Fluxo da TABELA (Rápido)
    this.searchSubject.pipe(
      tap(() => this.fetching.table = true),
      switchMap(() => this.loadData(this.currentPage()).pipe(
        catchError(() => of(null)) // Se a tabela falhar, não trava o gráfico
      ))
    ).subscribe(res => {
      if (res) {
        const data = res.data || res.data || [];
        const total = res.total || res.total || 0;
        this.processData(data);
        this.totalItems.set(total);
      }
      this.fetching.table = false;
    });

    // 3. Fluxo do GRÁFICO (Pesado)
    // O switchMap aqui é vital: se o usuário filtrar de novo, a requisição pesada anterior é abortada.
    
    this.searchSubject.pipe(
      tap(() => this.fetching.pareto = true),
      switchMap(() => this.loadHorasIrregulares().pipe(
        catchError(() => of([])) 
      ))
    ).subscribe(kpiRes => {
      this.chartHorasIrregulares.set(kpiRes || []);
      this.fetching.pareto = false;
    });

    // Gatilho inicial
    this.search();
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
    const filter = { ...this.filterForm.value } as any;
    const params = {
      ...filter,
      dataInicio: filter.dataInicio || undefined,
      dataFim: filter.dataFim || undefined,
      page: page + 1,
      limit: this.itemsPerPage
    };
    return this.api.consultarPonto(params);
  }

  private loadHorasIrregulares() {
    const filter = { ...this.filterForm.value } as any;
    return this.api.consultarPontosIrregularesKPI({
      ...filter,
      dataInicio: filter.dataInicio || undefined,
      dataFim: filter.dataFim || undefined,
      page: 1,
      limit: 9999
    });
  }

  private laodCentroDeCusto() {
    return this.funcionariosAPIService.getCentroDeCusto().pipe(
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