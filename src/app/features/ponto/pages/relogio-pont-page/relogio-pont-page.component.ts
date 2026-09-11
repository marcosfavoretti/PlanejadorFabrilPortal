import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { isSameDay } from 'date-fns';

// PrimeNG & Layout
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect'; // Added MultiSelectModule
import { TableDynamicComponent } from "@/app/shared/components/table-dynamic/table-dynamic.component";
import { HorasIrregularesParetoChartComponent } from '@/app/features/ponto/widgets/horas-irregulares-pareto-chart/horas-irregulares-pareto-chart.component';

// Services & Models
import { RelogioPontoAPIService } from '@/app/features/ponto/services/RelogioPontoAPI.service';
import { FuncionariosAPIService } from '@/app/features/ponto/services/FuncionariosAPI.service';
import { FolhaHoraExtraAPIService } from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { TableModel, tableColumns } from '@/app/shared/components/table-dynamic/table.model';
import {
  ResCentroDeCustoDTO,
  ResHorasIrregularesDTO,
  ResRegistroPontoTurnoPontoDTO,
  ResTurnoDTO,
} from '@/api/relogio';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { ActivatedRoute } from '@angular/router';

const CARGOS_COM_SELECAO_LIVRE_CC = new Set<string>([
  SetUserCargoDTOCargoEnum.ADMIN,
  SetUserCargoDTOCargoEnum.RH,
  SetUserCargoDTOCargoEnum.DIRETOR,
]);

@Component({
  selector: 'app-relogio-pont-page',
  standalone: true,
  imports: [
    TableDynamicComponent, SkeletonModule, ReactiveFormsModule,
    CommonModule, FormsModule,
    PaginatorModule, HorasIrregularesParetoChartComponent, DropdownModule, MultiSelectModule
  ],
  templateUrl: './relogio-pont-page.component.html',
  styleUrl: './relogio-pont-page.component.css'
})
export class RelogioPontPageComponent implements OnInit {
  private api = inject(RelogioPontoAPIService);
  private fb = inject(FormBuilder);
  private funcionariosAPIService = inject(FuncionariosAPIService);
  private folhaHoraExtraService = inject(FolhaHoraExtraAPIService);
  private userStore = inject(UserstoreService);
  private routerAcive = inject(ActivatedRoute);

  constructor() {
    // O usuário pode ser carregado depois da criação da página. Mantém os
    // controles sincronizados quando os cargos ficam disponíveis no store.
    effect(() => {
      this.centroCustoSelectorDisabled();
      this.syncCentroCustoControlState();
    });
  }

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
  protected readonly centroCustoSelectorDisabled = computed(() => {
    const possuiPreFiltroDeRota = (this.preFilterSetor()?.length ?? 0) > 0;
    return possuiPreFiltroDeRota || !this.podeSelecionarQualquerCentroCusto();
  });

  // --- Form & Search Gatilho ---
  filterForm = this.fb.group({
    indetificador: [''],
    dataInicio: [''],
    dataFim: [''],
    ccid: [[] as ResCentroDeCustoDTO[]]
  });

  private getFilterParams() {
    const filter = { ...this.filterForm.getRawValue() } as any;
    let ccidsToUse: string[] | undefined;

    if (this.preFilterSetor() && this.preFilterSetor()!.length > 0) {
      ccidsToUse = this.preFilterSetor()!;
    } else if (filter.ccid && filter.ccid.length > 0) {
      ccidsToUse = filter.ccid.map((cc: ResCentroDeCustoDTO) => String(cc.ccid));
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
        color: '#eb5c5c95',
        desc: 'marcações ímpares',
        field: 'status',
        ifValueEqual: 'FALHA'
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
    this.syncCentroCustoControlState();

    // 1. Iniciamos carregando os Centros de Custo
    this.laodCentroDeCusto().subscribe({
      next: (res) => {
        // 2. Configuramos os filtros iniciais baseados nos Centros de Custo carregados
        if (ccsParam) {
          this.applyRoutePreFilter(ccsParam);
          this.setupDataStreams();
          this.search();
        } else {
          this.applyLoggedUserCentroCustoPreSelection(() => {
            this.setupDataStreams();
            this.search();
          });
        }
      },
      error: (err) => console.error("Erro ao carregar centros de custo", err)
    });
  }

  private applyRoutePreFilter(ccsParam: string): void {
    const lista = ccsParam
      .split(',')
      .map(cc => cc.trim())
      .filter(Boolean);

    this.preFilterSetor.set(lista);
    const targets = this.centroDeCusto.filter(cc => lista.includes(cc.ccid.toString()));
    this.filterForm.patchValue({ ccid: targets });
    this.syncCentroCustoControlState();
  }

  private applyLoggedUserCentroCustoPreSelection(afterLoad: () => void): void {
    this.preFilterSetor.set([]);

    const usuarioId = this.userStore.item()?.id;
    if (!usuarioId) {
      this.centroDeCusto = [];
      this.filterForm.patchValue({ ccid: [] });
      this.syncCentroCustoControlState();
      afterLoad();
      return;
    }

    this.folhaHoraExtraService.getLiderCentroCusto(usuarioId).subscribe({
      next: vinculos => {
        const linkedCodes = new Set(vinculos.map(vinculo => vinculo.centroCustoCodigo));
        const targets = this.centroDeCusto.filter(cc => linkedCodes.has(cc.ccid));
        const missingTargets = vinculos
          .filter(vinculo => !this.centroDeCusto.some(cc => cc.ccid === vinculo.centroCustoCodigo))
          .map(vinculo => ({
            ccid: vinculo.centroCustoCodigo,
            setor: vinculo.centroCustoDescricao || String(vinculo.centroCustoCodigo),
          }));

        if (missingTargets.length) {
          this.centroDeCusto = [...this.centroDeCusto, ...missingTargets];
        }

        const centrosVinculados = [...targets, ...missingTargets];
        if (!this.podeSelecionarQualquerCentroCusto()) {
          this.centroDeCusto = centrosVinculados;
        }

        this.filterForm.patchValue({ ccid: centrosVinculados });
        this.syncCentroCustoControlState();
        afterLoad();
      },
      error: err => {
        console.error('Erro ao carregar centros de custo vinculados ao usuario', err);
        if (!this.podeSelecionarQualquerCentroCusto()) {
          this.centroDeCusto = [];
          this.filterForm.patchValue({ ccid: [] });
        }
        this.syncCentroCustoControlState();
        afterLoad();
      },
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
      { alias: 'Período do turno', field: 'turnoBase' },
      { alias: 'Data', field: 'turnoDia', isDate: true },
      { alias: 'Horas Trab.', field: "horasTrabalhadas" },
    ];

    for (let i = 1; i <= maxRegistros; i++) {
      newColumns.push({ alias: `M${i}`, field: `marcacao_${i}` });
      newColumns.push({ alias: `Hora ${i}`, field: `hora_${i}` });
    }
    newColumns.push({ alias: `Status`, field: `status` });
    this.tableModel.columns = newColumns;

    const mappedData = data.map(item => {
      const turnoBase = (item as ResRegistroPontoTurnoPontoDTO & {
        turnoBase?: ResTurnoDTO;
      }).turnoBase;

      const newItem: any = {
        matricula: item.matricula,
        nome: item.nome,
        turnoBase: turnoBase?.periodo?.replace('~', ' - ') ?? '-',
        horasIrregular: item.horasIrregulares,
        setor: item.setor,
        horasTrabalhadas: item.qtdHoras,
        turnoDia: item.turnoDia,
        // Preserva o status da API; somente marcação ímpar encerrada vira falha.
        status: this.getStatus(item)
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

  private getStatus(item: ResRegistroPontoTurnoPontoDTO): string {
    const registrosImpares = (item.registros?.length ?? 0) % 2 !== 0;
    const turnoEhHoje = item.turnoDia ? isSameDay(new Date(item.turnoDia), new Date()) : false;
    const statusApi = (item as ResRegistroPontoTurnoPontoDTO & { status?: string }).status;

    if (turnoEhHoje) {
      return 'OK';
    }

    if (registrosImpares) {
      return 'FALHA';
    }

    return statusApi ?? (item.horasIrregulares > 0 ? 'ALERTA' : 'OK');
  }

  private podeSelecionarQualquerCentroCusto(): boolean {
    const cargos = this.userStore.item()?.cargosLista ?? [];
    return cargos.some(cargo =>
      CARGOS_COM_SELECAO_LIVRE_CC.has(String(cargo).trim().toUpperCase())
    );
  }

  private syncCentroCustoControlState(): void {
    // O p-multiSelect pode preservar seu estado desabilitado após um HMR.
    // A restrição dos cargos é aplicada visualmente no template, preservando o
    // valor dos CCs vinculados no formulário e evitando o controle travado.
    this.filterForm.controls.ccid.enable({ emitEvent: false });
  }
}
