import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LIDERES_ROLES } from '@/app/core/auth/role-groups';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { ResCentroDeCustoDTO, ResFuncionarioKpiCumprimentoFolhaHoraExtraDTO, ResKpiCumprimentoFolhaHoraExtraDTO } from '@/api/relogio';
import { FuncionariosAPIService } from '@/app/features/ponto/services/FuncionariosAPI.service';
import {
  FolhaHoraExtraAPIService,
  FolhaHoraExtraListResponse,
  FolhaHoraExtraRefeicaoResumo,
  FolhaHoraExtraResumo,
  FolhaHoraExtraStatus,
  mapFolhaHoraExtraError,
  normalizeFolhasResponse,
} from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import { BehaviorSubject, catchError, finalize, forkJoin, from, map, mergeMap, Observable, of, switchMap, toArray } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DialogService } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { ToastMessageOptions } from 'primeng/api';
import { FolhaHoraExtraApprovalDialogComponent } from '../../widgets/folha-hora-extra-approval-dialog/folha-hora-extra-approval-dialog.component';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';

const FOLHA_HE_STATUS_OPERACIONAL: FolhaHoraExtraStatus[] = [
  'RASCUNHO',
  'AGUARDANDO_COORDENACAO',
  'AGUARDANDO_DIRETORIA',
  'REJEITADO_COORDENACAO',
  'REJEITADO_DIRETORIA',
];

const FOLHA_HE_STATUS_TODOS: FolhaHoraExtraStatus[] = [
  ...FOLHA_HE_STATUS_OPERACIONAL.slice(0, 3),
  'APROVADO',
  ...FOLHA_HE_STATUS_OPERACIONAL.slice(3),
];

interface FuncionarioFolhaHEAprovada {
  id: string;
  nome: string;
  matricula: string;
  dataFolha: string;
  centroCustoCodigo: number;
  centroCustoDescricao: string;
  setor: string;
  inicioHE: string;
  fimHE: string;
  refeicao: string;
  transporte: string;
  observacao: string;
}

interface FuncionarioJornadaIrregular {
  matricula: string;
  nome: string;
  ocorrenciasNaoCumprimento: number;
  ocorrenciasExtrapolacao: number;
  minutosIrregularesNaoCumprimentoHE: number;
  minutosIrregularesExtrapolacaoHE: number;
  minutosExcedentesHE: number;
  centroCusto: string;
}

function createTodayRange(): Date[] {
  const today = new Date();
  return [today, today];
}

@Component({
  selector: 'app-folha-hora-extra-list-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ChartModule,
    DatePickerModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MessagesModule,
    MultiSelectModule,
    ProgressBarModule,
    SelectModule,
    TableDynamicComponent,
    TagModule,
    TabsModule,
  ],
  templateUrl: './folha-hora-extra-list-page.component.html',
  styleUrls: ['./folha-hora-extra-list-page.component.css'],
  providers: [DialogService],
})
export class FolhaHoraExtraListPageComponent implements OnInit {
  private readonly folhaHoraExtraService = inject(FolhaHoraExtraAPIService);
  private readonly funcionariosService = inject(FuncionariosAPIService);
  private readonly userStore = inject(UserstoreService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(DialogService);

  protected readonly statusOptions = FOLHA_HE_STATUS_OPERACIONAL
    .map(status => ({ label: status, value: status }));

  protected readonly dataRangeFilter = new FormControl<Date[] | null>(null);
  protected readonly centroCustoFilter = new FormControl<number | null>(null);
  protected readonly statusFilter = new FormControl<FolhaHoraExtraStatus | null>(null);
  protected readonly approvalStatusFilter = new FormControl<FolhaHoraExtraStatus | null>(null);
  protected readonly refeicoesDataRangeFilter = new FormControl<Date[] | null>(createTodayRange());
  protected readonly refeicoesCentroCustoFilter = new FormControl<number | null>(null);
  protected readonly refeicoesMatriculaFilter = new FormControl('', { nonNullable: true });
  protected readonly refeicoesNomeFilter = new FormControl('', { nonNullable: true });
  protected readonly refeicoesTipoFilter = new FormControl<'MARMITEX' | 'LANCHE' | 'N/A' | null>(null);
  protected readonly refeicoesStatusFilter = new FormControl<
    FolhaHoraExtraStatus[] | null
  >(['AGUARDANDO_COORDENACAO', 'AGUARDANDO_DIRETORIA', 'APROVADO']);
  protected readonly aprovadasDataRangeFilter = new FormControl<Date[] | null>(createTodayRange());
  protected readonly aprovadasCentroCustoFilter = new FormControl<number | null>(null);
  protected readonly aprovadasMatriculaFilter = new FormControl('', { nonNullable: true });
  protected readonly aprovadasNomeFilter = new FormControl('', { nonNullable: true });
  protected readonly refeicaoOptions = [
    { label: 'Marmitex', value: 'MARMITEX' as const },
    { label: 'Lanche', value: 'LANCHE' as const },
    { label: 'Sem refeição', value: 'N/A' as const },
  ];
  protected readonly refeicoesStatusOptions = FOLHA_HE_STATUS_TODOS
    .map(status => ({ label: status, value: status }));
  protected pageSize = 10;
  protected first = 0;
  protected totalRecords = 0;
  protected historicoPageSize = 10;
  protected historicoFirst = 0;
  protected historicoTotalRecords = 0;
  protected refeicoesPageSize = 50;
  protected refeicoesFirst = 0;
  protected refeicoesTotalRecords = 0;
  protected readonly approvalQueueOptions = [
    { label: 'Fila coordenação', status: 'AGUARDANDO_COORDENACAO' as FolhaHoraExtraStatus },
    { label: 'Fila diretoria', status: 'AGUARDANDO_DIRETORIA' as FolhaHoraExtraStatus },
  ];

  protected folhas: FolhaHoraExtraResumo[] = [];
  protected historicoFolhas: FolhaHoraExtraResumo[] = [];
  protected refeicoesHoje: FolhaHoraExtraRefeicaoResumo[] = [];
  protected funcionariosFolhasAprovadas: FuncionarioFolhaHEAprovada[] = [];
  protected centrosCusto: ResCentroDeCustoDTO[] = [];
  protected loading = false;
  protected historicoLoading = false;
  protected refeicoesLoading = false;
  protected funcionariosFolhasAprovadasLoading = false;
  protected messages: ToastMessageOptions[] = [];
  protected kpiDialogVisible = false;
  protected kpiLoading = false;
  protected selectedFolha: FolhaHoraExtraResumo | null = null;
  protected selectedKpi: ResKpiCumprimentoFolhaHoraExtraDTO | null = null;
  protected printingRefeicoes = false;
  private historicoSortField: keyof FolhaHoraExtraResumo | null = null;
  private historicoSortOrder: 1 | -1 = 1;
  protected gastoFolhaPorDiaLoading = false;
  protected gastoFolhaPorDiaChartData: Record<string, unknown> | null = null;
  protected readonly gastoFolhaGranularidade = new FormControl<'dia' | 'mes' | 'ano'>('mes', { nonNullable: true });
  protected readonly gastoFolhaGranularidadeOptions = [
    { label: 'Dia', value: 'dia' as const },
    { label: 'Mês', value: 'mes' as const },
    { label: 'Ano', value: 'ano' as const },
  ];
  protected jornadaIrregularLoading = false;
  protected funcionariosJornadaIrregular: FuncionarioJornadaIrregular[] = [];
  protected jornadaIrregularChartFuncionarios: FuncionarioJornadaIrregular[] = [];
  protected funcionarioFolhasLoading = false;
  protected funcionarioFolhasSelecionado: FuncionarioJornadaIrregular | null = null;
  protected funcionarioFolhas: FolhaHoraExtraResumo[] = [];
  protected readonly funcionarioFolhasKpi: Record<string, ResKpiCumprimentoFolhaHoraExtraDTO | undefined> = {};
  protected readonly funcionarioFolhasKpiLoading = new Set<string>();
  protected readonly historicoKpi: Record<string, ResKpiCumprimentoFolhaHoraExtraDTO | undefined> = {};
  protected readonly historicoKpiLoading = new Set<string>();
  protected jornadaIrregularChartData: Record<string, unknown> | null = null;
  protected readonly jornadaIrregularSort = new FormControl<'horas' | 'ocorrencias'>('horas', { nonNullable: true });
  protected activeTab: 'rh' | 'folhas' | 'kpi' = 'folhas';
  protected readonly gastoFolhaPorDiaChartOptions: Record<string, unknown> = {
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: { parsed: { y: number | null } }) =>
            `Total: ${this.formatCurrency(context.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => this.formatCurrency(Number(value)),
        },
      },
    },
  };
  protected readonly jornadaIrregularChartOptions: Record<string, unknown> = {
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 28, padding: 10, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          title: (items: Array<{ dataIndex: number }>) => {
            const funcionario = this.jornadaIrregularChartFuncionarios[items[0]?.dataIndex ?? -1];
            return funcionario
              ? `${funcionario.nome} · CC: ${funcionario.centroCusto}`
              : '';
          },
          label: (context: { dataset: { yAxisID?: string; label?: string }; parsed: { y: number | null } }) =>
            context.dataset.yAxisID === 'y1'
              ? `${context.dataset.label}: ${this.formatHours(context.parsed.y ?? 0)}`
              : `${context.dataset.label}: ${context.parsed.y ?? 0}`,
          footer: (items: Array<{ dataIndex: number }>) => {
            const funcionario = this.jornadaIrregularChartFuncionarios[items[0]?.dataIndex ?? -1];
            return funcionario ? `CC: ${funcionario.centroCusto}` : '';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        position: 'left',
        title: { display: true, text: 'Ocorrências' },
        ticks: { precision: 0 },
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        title: { display: true, text: 'Horas irregulares' },
        grid: { drawOnChartArea: false },
        ticks: { callback: (value: string | number) => this.formatHours(Number(value)) },
      },
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 14,
          maxRotation: 35,
          minRotation: 25,
          font: { size: 10 },
        },
      },
    },
  };

  protected readonly refeicoesTableModel: TableModel = {
    title: 'Refeições solicitadas',
    subtitle: 'Uma linha por funcionário, conforme os filtros informados',
    paginator: true,
    totalize: false,
    dataKey: 'folhaId',
    columns: [
      { alias: 'Funcionário', field: 'nome', filterable: false, sortable: false },
      { alias: 'Matrícula', field: 'matricula', filterable: false, sortable: false },
      {
        alias: 'Refeição',
        field: 'refeicao',
        isTag: true,
        filterable: false,
        sortable: false,
        tagLabelFn: (value, row) => this.getRefeicaoLabel(
          value as FolhaHoraExtraRefeicaoResumo['refeicao'],
          row as FolhaHoraExtraRefeicaoResumo,
        ),
        tagSeverityFn: value => this.getRefeicaoSeverity(value as FolhaHoraExtraRefeicaoResumo['refeicao']),
      },
      {
        alias: 'Horário HE',
        field: 'inicioHE',
        filterable: false,
        sortable: false,
        valueFormatter: (_, row: FolhaHoraExtraRefeicaoResumo) => `${row.inicioHE} - ${row.fimHE}`,
      },
      {
        alias: 'CC - Setor',
        field: 'centroCustoCodigo',
        filterable: false,
        sortable: false,
        valueFormatter: (_, row: FolhaHoraExtraRefeicaoResumo) =>
          `${row.centroCustoCodigo} - ${row.setor}`,
      },
      {
        alias: 'Status',
        field: 'status',
        isTag: true,
        filterable: false,
        sortable: false,
        tagSeverityFn: value => this.getStatusSeverity(value as FolhaHoraExtraStatus),
      },
      { alias: 'Justificativa', field: 'justificativa', filterable: false, sortable: false },
      { alias: 'Autor', field: 'autorNome', filterable: false, sortable: false },
      {
        alias: 'Folha',
        field: 'acoes',
        isActions: true,
        filterable: false,
        sortable: false,
        actions: [{
          icon: 'pi pi-eye',
          tooltip: 'Visualizar folha',
          command: row => this.viewFolha((row as FolhaHoraExtraRefeicaoResumo).folhaId),
        }],
      },
    ],
    ghostControll: [
      { field: 'status', desc: 'Aprovada', ifValueEqual: 'APROVADO', color: '#dcfce7' },
      {
        field: 'status',
        desc: 'Pendente',
        ifRowFunction: row => ['AGUARDANDO_COORDENACAO', 'AGUARDANDO_DIRETORIA'].includes(row.status),
        color: '#fef3c7',
      },
      { field: 'status', desc: 'Rascunho', ifValueEqual: 'RASCUNHO', color: '#f1f5f9' },
      {
        field: 'status',
        desc: 'Rejeitada',
        ifRowFunction: row => ['REJEITADO_COORDENACAO', 'REJEITADO_DIRETORIA'].includes(row.status),
        color: '#fee2e2',
      },
    ],
  };

  protected readonly funcionariosFolhasAprovadasTableModel: TableModel = {
    title: 'Funcionários com folha de HE aprovada',
    subtitle: 'Uma linha por funcionário incluído em uma folha de hora extra aprovada',
    paginator: true,
    totalize: false,
    dataKey: 'id',
    sortField: 'nome',
    sortOrder: 1,
    columns: [
      { alias: 'Funcionário', field: 'nome', filterable: false },
      { alias: 'Matrícula', field: 'matricula', filterable: false },
      {
        alias: 'Data da folha',
        field: 'dataFolha',
        isDate: true,
        dateFormat: 'dd/MM/yyyy',
        dateTimezone: 'UTC',
        filterable: false,
      },
      {
        alias: 'CC - Setor',
        field: 'centroCustoCodigo',
        filterable: false,
        valueFormatter: (_, row: FuncionarioFolhaHEAprovada) =>
          `${row.centroCustoCodigo} - ${row.centroCustoDescricao}`,
      },
      { alias: 'Setor', field: 'setor', filterable: false },
      {
        alias: 'Horário HE',
        field: 'inicioHE',
        filterable: false,
        valueFormatter: (_, row: FuncionarioFolhaHEAprovada) => `${row.inicioHE} - ${row.fimHE}`,
      },
      { alias: 'Refeição', field: 'refeicao', filterable: false },
      { alias: 'Transporte', field: 'transporte', filterable: false },
      { alias: 'Observações', field: 'observacao', filterable: false },
    ],
  };

  protected readonly kpiFuncionariosTableModel: TableModel = {
    title: 'Cumprimento por funcionário',
    subtitle: 'Comparativo entre HE prevista e marcações registradas no ponto',
    paginator: true,
    totalize: false,
    dataKey: 'matricula',
    sortField: 'nome',
    sortOrder: 1,
    columns: [
      { alias: 'Matrícula', field: 'matricula' },
      { alias: 'Funcionário', field: 'nome' },
      {
        alias: 'HE prevista',
        field: 'inicioHEPrevisto',
        valueFormatter: (_, row: ResFuncionarioKpiCumprimentoFolhaHoraExtraDTO) =>
          `${row.inicioHEPrevisto} - ${row.fimHEPrevisto} (${row.totalHEPrevisto})`,
      },
      { alias: 'Primeira batida', field: 'primeiraBatida', isDate: true, dateFormat: 'HH:mm' },
      { alias: 'Última batida', field: 'ultimaBatida', isDate: true, dateFormat: 'HH:mm' },
      { alias: 'Horas', field: 'horasTrabalhadasNoTurno', isNumber: true },
      {
        alias: 'Atraso',
        field: 'minutosAtrasoInicioHE',
        valueFormatter: value => this.formatMinutes(value as number),
      },
      {
        alias: 'Saída antecipada',
        field: 'minutosSaidaAntesFimHE',
        valueFormatter: value => this.formatMinutes(value as number),
      },
      {
        alias: 'Status',
        field: 'statusCumprimentoHE',
        isTag: true,
        tagLabelFn: value => this.getCumprimentoStatusLabel(String(value)),
        tagSeverityFn: value => this.getCumprimentoStatusSeverity(String(value)),
      },
      {
        alias: 'Marcações',
        field: 'registros',
        valueFormatter: (_, row: ResFuncionarioKpiCumprimentoFolhaHoraExtraDTO) => this.formatMarcacoes(row),
      },
    ],
  };

  protected readonly folhasTableModel: TableModel = {
    title: this.hasCombinedLeaderCoordinatorRoles()
      ? 'Folhas de HE: operação e aprovação'
      : this.usesHistoricoDashboard() ? 'Folhas aguardando aprovação' : 'Folhas de HE em andamento',
    subtitle: this.hasCombinedLeaderCoordinatorRoles()
      ? 'Rascunhos, folhas rejeitadas e fila de aprovação da coordenação do centro de custo'
      : this.usesHistoricoDashboard()
        ? 'Fila operacional separada do histórico e do KPI'
        : 'Folhas criadas, editáveis ou em fluxo de aprovação',
    paginator: true,
    totalize: false,
    dataKey: 'id',
    columns: this.createFolhasColumns(false, this.usesHistoricoDashboard()),
  };

  protected readonly historicoTableModel: TableModel = {
    title: 'Histórico de folhas de HE',
    subtitle: 'Folhas aprovadas por todos, disponíveis para auditoria de cumprimento por funcionário',
    paginator: true,
    totalize: false,
    dataKey: 'id',
    expandable: true,
    columns: this.createFolhasColumns(true),
    ghostControll: [
      {
        field: 'statusCumprimentoHorarioHE',
        desc: 'Não cumpriu',
        ifRowFunction: row => row.statusCumprimentoHorarioHE === 'NAO_CUMPRIU' && !this.isFolhaHoje(row),
        color: '#fee2e2',
      },
      {
        field: 'statusCumprimentoHorarioHE',
        desc: 'Extrapolou 15 min',
        ifValueEqual: 'EXTRAPOLOU',
        color: '#fef3c7',
      },
      {
        field: 'statusCumprimentoHorarioHE',
        desc: 'Cumpriu',
        ifRowFunction: row => row.statusCumprimentoHorarioHE === 'CUMPRIU' && !this.isFolhaHoje(row),
        color: '#dcfce7',
      },
    ],
  };

  protected readonly funcionarioFolhasTableModel: TableModel = {
    title: 'Folhas de HE do funcionário',
    subtitle: 'Folhas visíveis para o usuário autenticado, filtradas pela matrícula selecionada no KPI',
    paginator: true,
    totalize: false,
    dataKey: 'id',
    expandable: true,
    columns: this.createFolhasColumns(false).map(column => column.field === 'acoes'
      ? {
          ...column,
          actions: [
            {
              icon: 'pi pi-eye',
              tooltip: 'Visualizar folha',
              command: row => this.viewFolha((row as FolhaHoraExtraResumo).id),
            },
            {
              icon: 'pi pi-print',
              tooltip: 'Imprimir folha',
              command: row => this.printFolha((row as FolhaHoraExtraResumo).id),
            },
          ],
        }
      : column),
    ghostControll: [
      {
        field: 'statusCumprimentoHorarioHE',
        desc: 'Não cumpriu',
        ifValueEqual: 'NAO_CUMPRIU',
        color: '#fee2e2',
      },
      {
        field: 'statusCumprimentoHorarioHE',
        desc: 'Extrapolou 15 min',
        ifValueEqual: 'EXTRAPOLOU',
        color: '#fef3c7',
      },
      {
        field: 'statusCumprimentoHorarioHE',
        desc: 'Cumpriu',
        ifValueEqual: 'CUMPRIU',
        color: '#dcfce7',
      },
    ],
  };

  private readonly reload$ = new BehaviorSubject<void>(undefined);

  ngOnInit(): void {
    this.activeTab = this.getInitialTab();
    if (this.hasVisibleSections()) {
      this.loadCentrosCusto();
    }

    if (this.canViewFolhas()) {
      this.reload$
        .pipe(switchMap(() => this.loadFolhas()))
        .subscribe(folhas => this.folhas = folhas);
    }

    if (this.canAuditHistorico()) {
      this.loadHistoricoFolhas();
    }

    if (this.canViewGastoFolhaPorDia()) {
      this.loadGastoFolhaPorDia();
      this.loadJornadaIrregular();
    }

    if (this.canViewRefeicoes()) {
      this.loadFuncionariosFolhasAprovadas();
    }
  }

  protected applyFilters(): void {
    this.first = 0;
    this.historicoFirst = 0;
    this.reload$.next();
    if (this.canAuditHistorico()) {
      this.loadHistoricoFolhas();
    }
  }

  protected clearFilters(): void {
    this.dataRangeFilter.setValue(null);
    this.centroCustoFilter.setValue(null);
    this.statusFilter.setValue(null);
    this.approvalStatusFilter.setValue(null);
    this.applyFilters();
  }

  protected applyApprovalQueue(status: FolhaHoraExtraStatus): void {
    this.approvalStatusFilter.setValue(this.approvalStatusFilter.value === status ? null : status);
    this.first = 0;
    this.reload$.next();
  }

  protected viewFolha(id: string): void {
    this.router.navigate(['/ponto/he/view', id]);
  }

  protected printFolha(id: string): void {
    this.router.navigate(['/ponto/he/view', id], { queryParams: { imprimir: true } });
  }

  protected createFolha(): void {
    this.router.navigate(['/ponto/he/criar']);
  }

  protected canCreateFolha(): boolean {
    return this.isAdmin()
      || this.hasLeaderRole()
      || this.userRoles().includes(SetUserCargoDTOCargoEnum.SUPORTE);
  }

  protected onLazyLoad(event: TableLazyLoadEvent): void {
    this.first = event.first ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
    this.reload$.next();
  }

  protected onHistoricoLazyLoad(event: TableLazyLoadEvent): void {
    this.historicoFirst = event.first ?? 0;
    this.historicoPageSize = event.rows ?? this.historicoPageSize;
    if (typeof event.sortField === 'string' && event.sortOrder) {
      this.historicoSortField = event.sortField as keyof FolhaHoraExtraResumo;
      this.historicoSortOrder = event.sortOrder === -1 ? -1 : 1;
    }
    this.loadHistoricoFolhas();
  }

  protected onRefeicoesLazyLoad(event: TableLazyLoadEvent): void {
    this.refeicoesFirst = event.first ?? 0;
    this.refeicoesPageSize = event.rows ?? this.refeicoesPageSize;
    this.loadRefeicoesHoje();
  }

  protected applyRefeicoesFilters(): void {
    this.refeicoesFirst = 0;
    this.loadRefeicoesHoje();
  }

  protected restoreRefeicoesDefaultFilters(): void {
    this.refeicoesDataRangeFilter.setValue(createTodayRange());
    this.refeicoesCentroCustoFilter.setValue(null);
    this.refeicoesMatriculaFilter.setValue('');
    this.refeicoesNomeFilter.setValue('');
    this.refeicoesTipoFilter.setValue(null);
    this.refeicoesStatusFilter.setValue(['AGUARDANDO_COORDENACAO', 'AGUARDANDO_DIRETORIA', 'APROVADO']);
    this.applyRefeicoesFilters();
  }

  protected applyAprovadasFilters(): void {
    this.loadFuncionariosFolhasAprovadas();
  }

  protected restoreAprovadasDefaultFilters(): void {
    this.aprovadasDataRangeFilter.setValue(createTodayRange());
    this.aprovadasCentroCustoFilter.setValue(null);
    this.aprovadasMatriculaFilter.setValue('');
    this.aprovadasNomeFilter.setValue('');
    this.applyAprovadasFilters();
  }

  protected printRefeicoes(): void {
    if (!this.refeicoesHoje.length) {
      return;
    }

    this.printingRefeicoes = true;
    document.body.classList.add('printing-refeicoes');
    const clearPrintMode = () => {
      this.printingRefeicoes = false;
      document.body.classList.remove('printing-refeicoes');
    };
    window.addEventListener('afterprint', clearPrintMode, { once: true });
    requestAnimationFrame(() => window.print());
  }

  protected editFolha(folha: FolhaHoraExtraResumo): void {
    if (!this.canEdit(folha)) {
      this.messages = [{ severity: 'warn', summary: 'Atencao', detail: 'Esta folha nao pode ser editada enquanto esta em aprovacao.' }];
      return;
    }
    this.router.navigate(['/ponto/he/editar', folha.id]);
  }

  protected submitFolha(folha: FolhaHoraExtraResumo): void {
    this.folhaHoraExtraService.submitFolha(folha.id).subscribe({
      next: () => {
        this.messages = [{ severity: 'success', summary: 'Sucesso', detail: 'Folha submetida para coordenação.' }];
        this.applyFilters();
      },
      error: err => this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }],
    });
  }

  protected openApprovalDialog(folha: FolhaHoraExtraResumo): void {
    if (!this.canApprove(folha)) {
      return;
    }

    const ref = this.dialogService.open(FolhaHoraExtraApprovalDialogComponent, {
      header: 'Aprovar ou rejeitar folha',
      width: '480px',
      data: { folha },
      closable: true,
    });

    ref.onClose.subscribe(result => {
      if (result?.updated) {
        this.messages = [{ severity: 'success', summary: 'Sucesso', detail: 'Fluxo de aprovacao atualizado.' }];
        this.applyFilters();
      }
    });
  }

  protected openKpi(folha: FolhaHoraExtraResumo): void {
    this.selectedFolha = folha;
    this.selectedKpi = null;
    this.kpiDialogVisible = true;
    this.kpiLoading = true;

    this.folhaHoraExtraService.getKpiCumprimento(folha.id)
      .pipe(finalize(() => this.kpiLoading = false))
      .subscribe({
        next: kpi => this.selectedKpi = kpi,
        error: err => {
          this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
          this.kpiDialogVisible = false;
        },
      });
  }

  protected closeKpi(): void {
    this.kpiDialogVisible = false;
    this.selectedFolha = null;
    this.selectedKpi = null;
  }

  protected canEdit(folha: FolhaHoraExtraResumo): boolean {
    const roles = this.userRoles();
    const canEdit = this.isAdmin()
      || this.hasLeaderRole(roles)
      || roles.includes(SetUserCargoDTOCargoEnum.SUPORTE);
    return this.isEditableStatus(folha.status)
      && canEdit;
  }

  protected canSubmit(folha: FolhaHoraExtraResumo): boolean {
    return !this.userRoles().includes(SetUserCargoDTOCargoEnum.SUPORTE)
      && ['RASCUNHO', 'REJEITADO_COORDENACAO', 'REJEITADO_DIRETORIA'].includes(folha.status);
  }

  protected canApprove(folha: FolhaHoraExtraResumo): boolean {
    const roles = this.userRoles();
    if (this.isAdmin()) {
      return ['AGUARDANDO_COORDENACAO', 'AGUARDANDO_DIRETORIA'].includes(folha.status);
    }

    return (this.hasCoordinatorRole(roles) && folha.status === 'AGUARDANDO_COORDENACAO')
      || (roles.includes(SetUserCargoDTOCargoEnum.DIRETOR) && folha.status === 'AGUARDANDO_DIRETORIA');
  }

  protected canViewKpi(folha: FolhaHoraExtraResumo): boolean {
    return this.canAuditHistorico() && folha.status === 'APROVADO';
  }

  protected canViewFolhas(): boolean {
    const roles = this.userRoles();
    return this.isAdmin()
      || this.hasLeaderRole(roles)
      || roles.includes(SetUserCargoDTOCargoEnum.SUPORTE)
      || this.hasCoordinatorRole(roles)
      || roles.includes(SetUserCargoDTOCargoEnum.DIRETOR);
  }

  protected canViewRefeicoes(): boolean {
    const roles = this.userRoles();
    return this.isAdmin() || roles.includes(SetUserCargoDTOCargoEnum.RH);
  }

  protected canViewRhTab(): boolean {
    return this.canViewRefeicoes();
  }

  protected canViewFolhasTab(): boolean {
    return this.canViewFolhas();
  }

  protected canViewKpiTab(): boolean {
    return this.canViewGastoFolhaPorDia();
  }

  protected onTabChange(value: string | number): void {
    const tab = String(value) as 'rh' | 'folhas' | 'kpi';
    if (!this.isAllowedTab(tab)) {
      return;
    }

    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { aba: tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected hasVisibleSections(): boolean {
    return this.canViewFolhas() || this.canViewRefeicoes() || this.canAuditHistorico();
  }

  protected usesHistoricoDashboard(): boolean {
    const roles = this.userRoles();
    return !this.hasCombinedLeaderCoordinatorRoles(roles)
      && (this.hasCoordinatorRole(roles)
      || roles.includes(SetUserCargoDTOCargoEnum.DIRETOR)
      || this.isAdmin());
  }

  protected canAuditHistorico(): boolean {
    const roles = this.userRoles();
    return this.usesHistoricoDashboard() || this.hasLeaderRole(roles);
  }

  protected canViewGastoFolhaPorDia(): boolean {
    const roles = this.userRoles();
    return this.isAdmin()
      || roles.includes(SetUserCargoDTOCargoEnum.RH)
      || this.hasCoordinatorRole(roles)
      || roles.includes(SetUserCargoDTOCargoEnum.DIRETOR);
  }

  protected getStatusSeverity(status: FolhaHoraExtraStatus): 'secondary' | 'info' | 'warn' | 'success' | 'danger' {
    switch (status) {
      case 'RASCUNHO': return 'secondary';
      case 'AGUARDANDO_COORDENACAO': return 'info';
      case 'AGUARDANDO_DIRETORIA': return 'warn';
      case 'APROVADO': return 'success';
      case 'REJEITADO_COORDENACAO':
      case 'REJEITADO_DIRETORIA':
        return 'danger';
    }
  }

  protected getCumprimentoLabel(funcionario: ResFuncionarioKpiCumprimentoFolhaHoraExtraDTO): string {
    return this.getCumprimentoStatusLabel(funcionario.statusCumprimentoHE);
  }

  protected getCumprimentoStatusLabel(status: string): string {
    if (status === 'NAO_CUMPRIU') return 'Não cumpriu';
    if (status === 'EXTRAPOLOU') return 'Extrapolou 15 min';
    return 'Cumpriu';
  }

  protected getCumprimentoStatusSeverity(status: string): 'success' | 'warn' | 'danger' {
    if (status === 'NAO_CUMPRIU') return 'danger';
    if (status === 'EXTRAPOLOU') return 'warn';
    return 'success';
  }

  protected formatMinutes(value: number): string {
    if (!value) {
      return '-';
    }
    return `${value} min`;
  }

  protected formatMarcacoes(funcionario: ResFuncionarioKpiCumprimentoFolhaHoraExtraDTO): string {
    if (!funcionario.registros?.length) {
      return '-';
    }
    return funcionario.registros.map(registro => registro.marcacao).join(' | ');
  }

  protected getRefeicaoSeverity(
    refeicao: FolhaHoraExtraRefeicaoResumo['refeicao'],
  ): 'success' | 'warn' | 'secondary' {
    if (refeicao === 'MARMITEX') return 'success';
    if (refeicao === 'LANCHE') return 'warn';
    return 'secondary';
  }

  protected getRefeicaoLabel(
    refeicao: FolhaHoraExtraRefeicaoResumo['refeicao'],
    { inicioHE, fimHE }: FolhaHoraExtraRefeicaoResumo,
  ): string {
    if (refeicao !== 'MARMITEX') {
      return refeicao;
    }

    return this.isWithinDinnerRange(inicioHE) && this.isWithinDinnerRange(fimHE)
      ? 'MARMITEX (JANTA)'
      : 'MARMITEX (ALMOÇO)';
  }

  private isWithinDinnerRange(time: string): boolean {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const dinnerStart = 15 * 60 + 48;
    const dinnerEnd = 1 * 60;

    return totalMinutes >= dinnerStart || totalMinutes <= dinnerEnd;
  }

  protected isAdmin(): boolean {
    return this.userRoles().includes(SetUserCargoDTOCargoEnum.ADMIN);
  }

  private createFolhasColumns(historico: boolean, hideSetor = historico): TableModel['columns'] {
    return ([
      {
        alias: 'Data',
        field: 'dataContexto',
        isDate: true,
        dateFormat: 'dd/MM/yyyy',
        dateTimezone: 'UTC',
        filterable: false,
        sortable: historico,
      },
      { alias: 'Setor', field: 'setor', filterable: false, sortable: historico },
      {
        alias: 'CC - Setor',
        field: 'centroCustoCodigo',
        filterable: false,
        sortable: historico,
        valueFormatter: (_, row: FolhaHoraExtraResumo) =>
          `${row.centroCustoCodigo} - ${row.centroCustoDescricao}`,
      },
      {
        alias: 'Turno',
        field: 'turno',
        isTag: true,
        filterable: false,
        sortable: historico,
        tagLabelFn: value => value === 'NOTURNO' ? 'Noturno' : 'Normal',
        tagSeverityFn: value => value === 'NOTURNO' ? 'info' : 'secondary',
      },
      {
        alias: 'Percentual',
        field: 'percentualCusto',
        filterable: false,
        sortable: historico,
        valueFormatter: value => `${value}%`,
      },
      {
        alias: 'Status',
        field: 'status',
        isTag: true,
        filterable: false,
        sortable: historico,
        tagSeverityFn: value => this.getStatusSeverity(value as FolhaHoraExtraStatus),
      },
      { alias: 'Funcionários', field: 'totalFuncionarios', isNumber: true, filterable: false, sortable: historico },
      { alias: 'Autor', field: 'autorNome', filterable: false, sortable: historico },
      {
        alias: 'Atualizado em',
        field: 'atualizadoEm',
        isDate: true,
        dateFormat: 'dd/MM/yyyy HH:mm',
        filterable: false,
        sortable: historico,
      },
      {
        alias: 'Ações',
        field: 'acoes',
        isActions: true,
        filterable: false,
        sortable: false,
        actions: historico
          ? [
              {
                icon: 'pi pi-eye',
                tooltip: 'Visualizar',
                command: row => this.viewFolha((row as FolhaHoraExtraResumo).id),
              },
              {
                icon: 'pi pi-print',
                tooltip: 'Imprimir folha',
                command: row => this.printFolha((row as FolhaHoraExtraResumo).id),
              },
            ]
          : [
              {
                icon: 'pi pi-eye',
                tooltip: 'Visualizar',
                command: row => this.viewFolha((row as FolhaHoraExtraResumo).id),
              },
              {
                icon: 'pi pi-print',
                tooltip: 'Imprimir folha',
                command: row => this.printFolha((row as FolhaHoraExtraResumo).id),
              },
              {
                icon: 'pi pi-pencil',
                tooltip: 'Editar',
                // Lider e coordenador acumulam permissoes: o lider continua
                // podendo editar mesmo ao visualizar a fila de coordenacao.
                visible: () => !this.usesHistoricoDashboard() || this.hasLeaderRole(),
                disabled: row => !this.canEdit(row as FolhaHoraExtraResumo),
                command: row => this.editFolha(row as FolhaHoraExtraResumo),
              },
              {
                icon: 'pi pi-send',
                tooltip: 'Submeter',
                visible: () => (!this.usesHistoricoDashboard() || this.hasLeaderRole())
                  && !this.userRoles().includes(SetUserCargoDTOCargoEnum.SUPORTE),
                disabled: row => !this.canSubmit(row as FolhaHoraExtraResumo),
                command: row => this.submitFolha(row as FolhaHoraExtraResumo),
              },
              {
                icon: 'pi pi-check-circle',
                tooltip: 'Aprovar/Rejeitar',
                severity: 'success',
                visible: row => this.canApprove(row as FolhaHoraExtraResumo),
                command: row => this.openApprovalDialog(row as FolhaHoraExtraResumo),
              },
            ],
      },
    ] as TableModel['columns']).filter(column => !(hideSetor && column.field === 'setor'));
  }

  private loadFolhas() {
    this.loading = true;
    const range = this.dataRangeFilter.value;
    const statusFilter = this.hasCombinedLeaderCoordinatorRoles()
      ? this.getCombinedLeaderCoordinatorStatuses(this.statusFilter.value)
      : this.usesHistoricoDashboard()
        ? this.approvalStatusFilter.value ?? this.getApprovalStatusesForUser()
        : this.getOperationalStatusesForUser(this.statusFilter.value);
    const filters = {
      dataInicio: range?.[0] ? this.formatLocalDate(range[0]) : undefined,
      dataFim: range?.[1] ? this.formatLocalDate(range[1]) : undefined,
      centroCustoCodigo: this.centroCustoFilter.value ?? undefined,
      status: statusFilter,
      page: Math.floor(this.first / this.pageSize),
      limit: this.pageSize,
    };

    return this.folhaHoraExtraService.getFolhas(filters).pipe(
      map(response => {
        const folhas = normalizeFolhasResponse(response);
        this.totalRecords = Array.isArray(response) ? folhas.length : response.total ?? folhas.length;
        return folhas;
      }),
      catchError(err => {
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
        this.totalRecords = 0;
        return of([]);
      }),
      finalize(() => this.loading = false),
    );
  }

  private loadHistoricoFolhas(): void {
    this.historicoLoading = true;
    const range = this.dataRangeFilter.value;

    this.folhaHoraExtraService.getHistorico({
      dataInicio: range?.[0] ? this.formatLocalDate(range[0]) : undefined,
      dataFim: range?.[1] ? this.formatLocalDate(range[1]) : undefined,
      centroCustoCodigo: this.centroCustoFilter.value ?? undefined,
      status: 'APROVADO',
      page: Math.floor(this.historicoFirst / this.historicoPageSize),
      limit: this.historicoPageSize,
    }).pipe(
      catchError(err => {
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
        this.historicoTotalRecords = 0;
        return of({ data: [], total: 0, page: 0, limit: this.historicoPageSize, totalPages: 0 } as FolhaHoraExtraListResponse);
      }),
      finalize(() => this.historicoLoading = false),
    ).subscribe(response => {
      const normalizedResponse = response as unknown as FolhaHoraExtraListResponse;
      this.historicoFolhas = this.sortHistoricoFolhas(normalizeFolhasResponse(normalizedResponse));
      this.historicoTotalRecords = response.total ?? this.historicoFolhas.length;
    });
  }

  private sortHistoricoFolhas(folhas: FolhaHoraExtraResumo[]): FolhaHoraExtraResumo[] {
    if (!this.historicoSortField) {
      return folhas;
    }

    const field = this.historicoSortField;
    const direction = this.historicoSortOrder;
    const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

    return [...folhas].sort((a, b) => {
      const firstValue = a[field];
      const secondValue = b[field];
      if (firstValue == null) return 1;
      if (secondValue == null) return -1;

      if (typeof firstValue === 'number' && typeof secondValue === 'number') {
        return (firstValue - secondValue) * direction;
      }

      return collator.compare(String(firstValue), String(secondValue)) * direction;
    });
  }

  private loadGastoFolhaPorDia(): void {
    this.gastoFolhaPorDiaLoading = true;
    this.folhaHoraExtraService.getKpiCusto({ granularidade: this.gastoFolhaGranularidade.value }).pipe(
      catchError(err => {
        this.messages = [{
          severity: 'error',
          summary: 'Erro',
          detail: `Não foi possível carregar o gasto diário das folhas de HE. ${mapFolhaHoraExtraError(err)}`,
        }];
        return of(null);
      }),
      finalize(() => this.gastoFolhaPorDiaLoading = false),
    ).subscribe(kpi => {
      if (!kpi) {
        this.gastoFolhaPorDiaChartData = null;
        return;
      }
      this.gastoFolhaPorDiaChartData = this.createGastoFolhaPorDiaChart(kpi.periodos);
    });
  }

  protected updateGastoFolhaPorDiaChart(): void {
    this.loadGastoFolhaPorDia();
  }

  protected getGastoFolhaGranularidadeLabel(): string {
    return this.gastoFolhaGranularidade.value === 'dia'
      ? 'dia'
      : this.gastoFolhaGranularidade.value === 'mes' ? 'mês' : 'ano';
  }

  private loadJornadaIrregular(): void {
    this.jornadaIrregularLoading = true;
    this.folhaHoraExtraService.getKpiJornada().pipe(
      map(kpi => kpi.funcionariosComMaisOcorrencias.map(funcionario => {
        // O KPI deve trazer o centro de custo junto do funcionário. Não fazemos
        // consultas adicionais ao histórico/detalhes para evitar N+1 requests.
        const funcionarioComCentro = funcionario as typeof funcionario & {
          centroCusto?: string;
          centroCustoCodigo?: number;
          centroCustoDescricao?: string;
          centrosCusto?: Array<{ codigo?: number | string; descricao?: string; setor?: string }>;
        };
        const centroCusto = this.resolveFuncionarioCentroCusto(funcionarioComCentro);
        return { ...funcionario, centroCusto };
      })),
      catchError(err => {
        this.messages = [{
          severity: 'error',
          summary: 'Erro',
          detail: `Não foi possível carregar o indicador de HE irregular. ${mapFolhaHoraExtraError(err)}`,
        }];
        return of([] as FuncionarioJornadaIrregular[]);
      }),
      finalize(() => this.jornadaIrregularLoading = false),
    ).subscribe(funcionarios => {
      this.funcionariosJornadaIrregular = funcionarios;
      this.updateJornadaIrregularChart();
    });
  }

  private resolveFuncionarioCentroCusto(funcionario: {
    centroCusto?: unknown;
    centroCustoCodigo?: number | string;
    centroCustoDescricao?: string;
    centroDeCusto?: unknown;
    centrosCusto?: Array<{ codigo?: number | string; descricao?: string; setor?: string }>;
  }): string {
    if (funcionario.centrosCusto?.length) {
      return funcionario.centrosCusto
        .map(centro => `${centro.codigo ?? ''} - ${centro.descricao ?? centro.setor ?? ''}`.trim())
        .filter(Boolean)
        .join(', ');
    }

    if (typeof funcionario.centroCusto === 'string' && funcionario.centroCusto.trim()) {
      return funcionario.centroCusto;
    }

    const centro = funcionario.centroCusto ?? funcionario.centroDeCusto;
    if (centro && typeof centro === 'object') {
      const item = centro as { codigo?: number | string; descricao?: string; setor?: string };
      const codigo = item.codigo ?? funcionario.centroCustoCodigo;
      const descricao = item.descricao ?? item.setor ?? funcionario.centroCustoDescricao;
      if (codigo != null || descricao) return `${codigo ?? ''} - ${descricao ?? ''}`.trim();
    }

    if (funcionario.centroCustoCodigo != null || funcionario.centroCustoDescricao) {
      return `${funcionario.centroCustoCodigo ?? ''} - ${funcionario.centroCustoDescricao ?? ''}`.trim();
    }

    return 'Não informado';
  }

  protected updateJornadaIrregularChart(): void {
    const sortBy = this.jornadaIrregularSort.value;
    const funcionarios = [...this.funcionariosJornadaIrregular].sort((a, b) => sortBy === 'horas'
      ? ((b.minutosIrregularesNaoCumprimentoHE ?? 0) + (b.minutosIrregularesExtrapolacaoHE ?? 0))
        - ((a.minutosIrregularesNaoCumprimentoHE ?? 0) + (a.minutosIrregularesExtrapolacaoHE ?? 0))
      : ((b.ocorrenciasNaoCumprimento ?? 0) + (b.ocorrenciasExtrapolacao ?? 0))
        - ((a.ocorrenciasNaoCumprimento ?? 0) + (a.ocorrenciasExtrapolacao ?? 0)));

    this.jornadaIrregularChartData = funcionarios.length ? {
      // O nome facilita a leitura para a liderança; o nome completo e a matrícula ficam no tooltip.
      labels: funcionarios.map(funcionario => this.formatFuncionarioChartLabel(funcionario.nome)),
      datasets: [
        {
          type: 'bar',
          label: 'Ocorrências de não cumprimento',
          data: funcionarios.map(funcionario => funcionario.ocorrenciasNaoCumprimento ?? 0),
          backgroundColor: 'rgba(220, 38, 38, .7)',
          borderColor: '#dc2626',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          type: 'bar',
          label: 'Ocorrências de extrapolação',
          data: funcionarios.map(funcionario => funcionario.ocorrenciasExtrapolacao ?? 0),
          backgroundColor: 'rgba(124, 58, 237, .7)',
          borderColor: '#7c3aed',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'Horas não cumpridas',
          data: funcionarios.map(funcionario => (funcionario.minutosIrregularesNaoCumprimentoHE ?? 0) / 60),
          borderColor: '#f97316',
          backgroundColor: '#f97316',
          borderWidth: 2,
          tension: .3,
          pointRadius: 4,
          yAxisID: 'y1',
        },
        {
          type: 'line',
          label: 'Horas de extrapolação',
          data: funcionarios.map(funcionario => (funcionario.minutosIrregularesExtrapolacaoHE ?? 0) / 60),
          borderColor: '#0891b2',
          backgroundColor: '#0891b2',
          borderWidth: 2,
          borderDash: [6, 4],
          tension: .3,
          pointRadius: 4,
          yAxisID: 'y1',
        },
      ],
    } : null;
    this.jornadaIrregularChartFuncionarios = funcionarios;
  }

  private formatFuncionarioChartLabel(nome: string): string {
    const normalized = nome.trim();
    return normalized.length > 16 ? `${normalized.slice(0, 15)}…` : normalized;
  }

  protected onJornadaFuncionarioSelect(event: { element?: { index?: number }; index?: number }): void {
    const index = event.element?.index ?? event.index;
    if (index == null) return;

    const funcionario = this.jornadaIrregularChartFuncionarios[index];
    if (!funcionario) return;

    this.funcionarioFolhasSelecionado = funcionario;
    this.funcionarioFolhasLoading = true;
    this.folhaHoraExtraService.getHistorico({
      nomeFuncionario: funcionario.nome,
      matriculaFuncionario: funcionario.matricula,
      page: 0,
      limit: 100,
    }).pipe(
      switchMap(firstResponse => {
        const firstPage = normalizeFolhasResponse(firstResponse as unknown as FolhaHoraExtraListResponse);
        const total = firstResponse.total ?? firstPage.length;
        const totalPages = Math.ceil(total / 100);
        if (totalPages <= 1) return of(firstPage);

        return forkJoin(
          Array.from({ length: totalPages - 1 }, (_, page) =>
            this.folhaHoraExtraService.getHistorico({
              nomeFuncionario: funcionario.nome,
              matriculaFuncionario: funcionario.matricula,
              page: page + 1,
              limit: 100,
            }).pipe(map(response => normalizeFolhasResponse(response as unknown as FolhaHoraExtraListResponse))),
          ),
        ).pipe(map(pages => firstPage.concat(...pages)));
      }),
      catchError(err => {
        this.messages = [{
          severity: 'error',
          summary: 'Erro',
          detail: `Não foi possível carregar as folhas de ${funcionario.nome}. ${mapFolhaHoraExtraError(err)}`,
        }];
        return of([] as FolhaHoraExtraResumo[]);
      }),
      finalize(() => this.funcionarioFolhasLoading = false),
    ).subscribe(folhas => this.funcionarioFolhas = folhas);
  }

  protected onFuncionarioFolhaExpand(folha: FolhaHoraExtraResumo): void {
    if (this.funcionarioFolhasKpi[folha.id] || this.funcionarioFolhasKpiLoading.has(folha.id)) {
      return;
    }

    this.funcionarioFolhasKpiLoading.add(folha.id);
    this.folhaHoraExtraService.getKpiCumprimento(folha.id)
      .pipe(finalize(() => this.funcionarioFolhasKpiLoading.delete(folha.id)))
      .subscribe({
        next: kpi => this.funcionarioFolhasKpi[folha.id] = kpi,
        error: err => {
          this.messages = [{ severity: 'error', summary: 'Erro', detail: `Não foi possível carregar o KPI da folha. ${mapFolhaHoraExtraError(err)}` }];
        },
      });
  }

  protected onHistoricoExpand(folha: FolhaHoraExtraResumo): void {
    if (this.historicoKpi[folha.id] || this.historicoKpiLoading.has(folha.id)) {
      return;
    }

    this.historicoKpiLoading.add(folha.id);
    this.folhaHoraExtraService.getKpiCumprimento(folha.id)
      .pipe(finalize(() => this.historicoKpiLoading.delete(folha.id)))
      .subscribe({
        next: kpi => this.historicoKpi[folha.id] = kpi,
        error: err => {
          this.messages = [{ severity: 'error', summary: 'Erro', detail: `Não foi possível carregar o KPI da folha. ${mapFolhaHoraExtraError(err)}` }];
        },
      });
  }

  private createGastoFolhaPorDiaChart(dias: Array<{ data: string; custo: number }>): Record<string, unknown> | null {
    if (!dias.length) {
      return null;
    }

    return {
      labels: dias.map(dia => this.formatGastoFolhaLabel(dia.data)),
      datasets: [{
        label: `Gasto por ${this.getGastoFolhaGranularidadeLabel()}`,
        data: dias.map(dia => dia.custo),
        borderColor: '#198754',
        backgroundColor: 'rgba(25, 135, 84, .14)',
        fill: true,
        tension: .3,
        pointBackgroundColor: '#198754',
        pointRadius: 4,
      }],
    };
  }

  private formatGastoFolhaLabel(data: string): string {
    if (this.gastoFolhaGranularidade.value !== 'ano') return this.formatChartDate(data);
    if (data.length >= 7) {
      const [year, month] = data.split('-');
      return `${month}/${year}`;
    }
    return data.slice(0, 4);
  }

  private loadRefeicoesHoje(): void {
    this.refeicoesLoading = true;
    const range = this.refeicoesDataRangeFilter.value;
    const statuses = this.refeicoesStatusFilter.value ?? [];

    this.folhaHoraExtraService.getRefeicoes({
      dataInicio: range?.[0] ? this.formatRefeicoesDate(range[0]) : undefined,
      dataFim: range?.[1] ? this.formatRefeicoesDate(range[1]) : undefined,
      centroCustoCodigo: this.refeicoesCentroCustoFilter.value ?? undefined,
      matricula: this.refeicoesMatriculaFilter.value.trim() || undefined,
      nome: this.refeicoesNomeFilter.value.trim() || undefined,
      refeicao: this.refeicoesTipoFilter.value ?? undefined,
      status: statuses.length ? statuses : undefined,
      page: Math.floor(this.refeicoesFirst / this.refeicoesPageSize),
      limit: this.refeicoesPageSize,
    }).pipe(
      catchError(err => {
        this.messages = [{
          severity: 'error',
          summary: 'Erro',
          detail: `Nao foi possivel carregar as refeicoes de hoje. ${mapFolhaHoraExtraError(err)}`,
        }];
        return of({
          data: [],
          total: 0,
          page: 0,
          limit: this.refeicoesPageSize,
          totalPages: 0,
        });
      }),
      finalize(() => this.refeicoesLoading = false),
    ).subscribe(response => {
      this.refeicoesHoje = response.data;
      this.refeicoesTotalRecords = response.total;
    });
  }

  private loadFuncionariosFolhasAprovadas(): void {
    const pageSize = 100;
    this.funcionariosFolhasAprovadasLoading = true;
    const range = this.aprovadasDataRangeFilter.value;
    const matricula = this.aprovadasMatriculaFilter.value.trim().toLocaleLowerCase('pt-BR');
    const nome = this.aprovadasNomeFilter.value.trim().toLocaleLowerCase('pt-BR');

    this.folhaHoraExtraService.getFolhas({
      status: 'APROVADO',
      dataInicio: range?.[0] ? this.formatLocalDate(range[0]) : undefined,
      dataFim: range?.[1] ? this.formatLocalDate(range[1]) : undefined,
      centroCustoCodigo: this.aprovadasCentroCustoFilter.value ?? undefined,
      page: 0,
      limit: pageSize,
    }).pipe(
      switchMap(firstResponse => {
        const firstPage = normalizeFolhasResponse(firstResponse);
        const total = Array.isArray(firstResponse) ? firstPage.length : firstResponse.total ?? firstPage.length;
        const totalPages = Math.ceil(total / pageSize);

        if (totalPages <= 1) {
          return of(firstPage);
        }

        return forkJoin(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            this.folhaHoraExtraService.getFolhas({
              status: 'APROVADO',
              dataInicio: range?.[0] ? this.formatLocalDate(range[0]) : undefined,
              dataFim: range?.[1] ? this.formatLocalDate(range[1]) : undefined,
              centroCustoCodigo: this.aprovadasCentroCustoFilter.value ?? undefined,
              page: index + 1,
              limit: pageSize,
            }).pipe(map(normalizeFolhasResponse)),
          ),
        ).pipe(map(pages => firstPage.concat(...pages)));
      }),
      switchMap(folhas => from(folhas).pipe(
        // Evita disparar uma requisição por folha de uma só vez.
        mergeMap(folha => this.folhaHoraExtraService.getFolhaById(folha.id), 8),
        map(folha => folha.funcionarios.map(funcionario => ({
          id: `${folha.id}-${funcionario.matricula}`,
          nome: funcionario.nome,
          matricula: funcionario.matricula,
          dataFolha: folha.dataContexto,
          centroCustoCodigo: folha.centroCustoCodigo,
          centroCustoDescricao: folha.centroCustoDescricao,
          setor: folha.setor,
          inicioHE: funcionario.inicioHE,
          fimHE: funcionario.fimHE,
          refeicao: funcionario.refeicao ?? 'N/A',
          transporte: funcionario.transporte ?? 'N/A',
          observacao: funcionario.justificativa || folha.observacao || '-',
        }))),
        toArray(),
      )),
      map(funcionariosPorFolha => {
        return funcionariosPorFolha
          .flat()
          .filter(funcionario =>
            (!matricula || funcionario.matricula.toLocaleLowerCase('pt-BR').includes(matricula))
            && (!nome || funcionario.nome.toLocaleLowerCase('pt-BR').includes(nome)),
          )
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      }),
      catchError(err => {
        this.messages = [{
          severity: 'error',
          summary: 'Erro',
          detail: `Não foi possível carregar os funcionários com folha de HE aprovada. ${mapFolhaHoraExtraError(err)}`,
        }];
        return of([] as FuncionarioFolhaHEAprovada[]);
      }),
      finalize(() => this.funcionariosFolhasAprovadasLoading = false),
    ).subscribe(funcionarios => this.funcionariosFolhasAprovadas = funcionarios);
  }

  private loadCentrosCusto(): void {
    this.funcionariosService.getCentroDeCusto().subscribe({
      next: centros => this.centrosCusto = centros,
      error: err => this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }],
    });
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isFolhaHoje(folha: Pick<FolhaHoraExtraResumo, 'dataContexto'>): boolean {
    const dataFolha = String(folha.dataContexto ?? '');
    const dataISO = /^\d{4}-\d{2}-\d{2}/.test(dataFolha)
      ? dataFolha.slice(0, 10)
      : this.formatLocalDate(new Date(dataFolha));
    return dataISO === this.formatLocalDate(new Date());
  }

  private formatChartDate(date: string): string {
    const [year, month, day] = date.split('-');
    return year && month && day ? `${day}/${month}/${year}` : date;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    }).format(value);
  }

  private formatHours(value: number): string {
    const minutes = Math.max(0, Math.round((value || 0) * 60));
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}min`;
  }

  private formatRefeicoesDate(date: Date): string {
    return this.formatLocalDate(date);
  }

  private isEditableStatus(status: FolhaHoraExtraStatus): boolean {
    return ['RASCUNHO', 'REJEITADO_COORDENACAO', 'REJEITADO_DIRETORIA'].includes(status);
  }

  private userRoles(): string[] {
    return this.userStore.item()?.cargosLista ?? [];
  }

  private getInitialTab(): 'rh' | 'folhas' | 'kpi' {
    const requested = this.route.snapshot.queryParamMap.get('aba');
    if (requested && this.isAllowedTab(requested as 'rh' | 'folhas' | 'kpi')) {
      return requested as 'rh' | 'folhas' | 'kpi';
    }

    if (this.canViewRhTab()) return 'rh';
    if (this.canViewFolhasTab()) return 'folhas';
    return 'kpi';
  }

  private isAllowedTab(tab: 'rh' | 'folhas' | 'kpi'): boolean {
    if (tab === 'rh') return this.canViewRhTab();
    if (tab === 'folhas') return this.canViewFolhasTab();
    return this.canViewKpiTab();
  }

  private hasLeaderRole(roles = this.userRoles()): boolean {
    return LIDERES_ROLES
      .filter(role => role !== SetUserCargoDTOCargoEnum.ADMIN)
      .some(role => roles.includes(role));
  }

  private hasCoordinatorRole(roles = this.userRoles()): boolean {
    return roles.includes(SetUserCargoDTOCargoEnum.COORDENADOR);
  }

  private hasCombinedLeaderCoordinatorRoles(roles = this.userRoles()): boolean {
    return this.hasLeaderRole(roles) && this.hasCoordinatorRole(roles);
  }

  private getApprovalStatusesForUser(): FolhaHoraExtraStatus[] {
    const roles = this.userRoles();
    const statuses: FolhaHoraExtraStatus[] = [];

    if (this.isAdmin() || this.hasCoordinatorRole(roles)) {
      statuses.push('AGUARDANDO_COORDENACAO');
    }
    if (this.isAdmin() || roles.includes(SetUserCargoDTOCargoEnum.DIRETOR)) {
      statuses.push('AGUARDANDO_DIRETORIA');
    }

    return statuses;
  }

  private getCombinedLeaderCoordinatorStatuses(
    selectedStatus: FolhaHoraExtraStatus | null,
  ): FolhaHoraExtraStatus[] {
    if (selectedStatus && FOLHA_HE_STATUS_OPERACIONAL.includes(selectedStatus)) {
      return [selectedStatus];
    }

    return [...new Set([
      ...FOLHA_HE_STATUS_OPERACIONAL,
      ...this.getApprovalStatusesForUser(),
    ])];
  }

  private getOperationalStatusesForUser(selectedStatus: FolhaHoraExtraStatus | null): FolhaHoraExtraStatus[] {
    if (selectedStatus && FOLHA_HE_STATUS_OPERACIONAL.includes(selectedStatus)) {
      return [selectedStatus];
    }

    return FOLHA_HE_STATUS_OPERACIONAL;
  }
}
