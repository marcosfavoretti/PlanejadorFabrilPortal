import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LIDERES_ROLES } from '@/app/core/auth/role-groups';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import { ResCentroDeCustoDTO, ResFuncionarioKpiCumprimentoFolhaHoraExtraDTO, ResKpiCumprimentoFolhaHoraExtraDTO } from '@/api/relogio';
import { FuncionariosAPIService } from '@/app/features/ponto/services/FuncionariosAPI.service';
import {
  FOLHA_HE_STATUS_LABEL,
  FolhaHoraExtraAPIService,
  FolhaHoraExtraListResponse,
  FolhaHoraExtraRefeicaoResumo,
  FolhaHoraExtraResumo,
  FolhaHoraExtraStatus,
  mapFolhaHoraExtraError,
  normalizeFolhasResponse,
} from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import { BehaviorSubject, catchError, finalize, map, of, switchMap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DialogService } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastMessageOptions } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { FolhaHoraExtraApprovalDialogComponent } from '../../widgets/folha-hora-extra-approval-dialog/folha-hora-extra-approval-dialog.component';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';

const FOLHA_HE_STATUS_OPERACIONAL: FolhaHoraExtraStatus[] = [
  'RASCUNHO',
  'AGUARDANDO_GERENCIA',
  'AGUARDANDO_DIRETORIA',
  'REJEITADO_GERENCIA',
  'REJEITADO_DIRETORIA',
];

const FOLHA_HE_STATUS_TODOS: FolhaHoraExtraStatus[] = [
  ...FOLHA_HE_STATUS_OPERACIONAL.slice(0, 3),
  'APROVADO',
  ...FOLHA_HE_STATUS_OPERACIONAL.slice(3),
];

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
    CardModule,
    DatePickerModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MessagesModule,
    MultiSelectModule,
    ProgressBarModule,
    SelectModule,
    TableModule,
    TableDynamicComponent,
    TagModule,
    TooltipModule,
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
  private readonly dialogService = inject(DialogService);

  protected readonly statusLabel = FOLHA_HE_STATUS_LABEL;
  protected readonly statusOptions = FOLHA_HE_STATUS_OPERACIONAL
    .map(status => ({ label: FOLHA_HE_STATUS_LABEL[status], value: status }));

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
  >(['AGUARDANDO_GERENCIA', 'AGUARDANDO_DIRETORIA', 'APROVADO']);
  protected readonly refeicaoOptions = [
    { label: 'Marmitex', value: 'MARMITEX' as const },
    { label: 'Lanche', value: 'LANCHE' as const },
    { label: 'Sem refeição', value: 'N/A' as const },
  ];
  protected readonly refeicoesStatusOptions = FOLHA_HE_STATUS_TODOS
    .map(status => ({ label: FOLHA_HE_STATUS_LABEL[status], value: status }));
  protected pageSize = 10;
  protected first = 0;
  protected totalRecords = 0;
  protected historicoPageSize = 10;
  protected historicoFirst = 0;
  protected historicoTotalRecords = 0;
  protected refeicoesPageSize = 10;
  protected refeicoesFirst = 0;
  protected refeicoesTotalRecords = 0;
  protected readonly approvalQueueOptions = [
    { label: 'Fila gerencia', status: 'AGUARDANDO_GERENCIA' as FolhaHoraExtraStatus },
    { label: 'Fila diretoria', status: 'AGUARDANDO_DIRETORIA' as FolhaHoraExtraStatus },
  ];

  protected folhas: FolhaHoraExtraResumo[] = [];
  protected historicoFolhas: FolhaHoraExtraResumo[] = [];
  protected refeicoesHoje: FolhaHoraExtraRefeicaoResumo[] = [];
  protected centrosCusto: ResCentroDeCustoDTO[] = [];
  protected loading = false;
  protected historicoLoading = false;
  protected refeicoesLoading = false;
  protected messages: ToastMessageOptions[] = [];
  protected kpiDialogVisible = false;
  protected kpiLoading = false;
  protected selectedFolha: FolhaHoraExtraResumo | null = null;
  protected selectedKpi: ResKpiCumprimentoFolhaHoraExtraDTO | null = null;
  protected printingRefeicoes = false;

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
        alias: 'CC',
        field: 'centroCustoCodigo',
        filterable: false,
        sortable: false,
      },
      {
        alias: 'Status',
        field: 'status',
        isTag: true,
        filterable: false,
        sortable: false,
        tagLabelFn: value => this.getStatusLabel(value as FolhaHoraExtraStatus),
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
        ifRowFunction: row => ['AGUARDANDO_GERENCIA', 'AGUARDANDO_DIRETORIA'].includes(row.status),
        color: '#fef3c7',
      },
      { field: 'status', desc: 'Rascunho', ifValueEqual: 'RASCUNHO', color: '#f1f5f9' },
      {
        field: 'status',
        desc: 'Rejeitada',
        ifRowFunction: row => ['REJEITADO_GERENCIA', 'REJEITADO_DIRETORIA'].includes(row.status),
        color: '#fee2e2',
      },
    ],
  };

  protected readonly folhasTableModel: TableModel = {
    title: this.usesHistoricoDashboard() ? 'Folhas aguardando aprovação' : 'Folhas de HE em andamento',
    subtitle: this.usesHistoricoDashboard()
      ? 'Fila operacional separada do histórico e do KPI'
      : 'Folhas criadas, editáveis ou em fluxo de aprovação',
    paginator: true,
    totalize: false,
    dataKey: 'id',
    columns: this.createFolhasColumns(false),
  };

  protected readonly historicoTableModel: TableModel = {
    title: 'Histórico de folhas de HE',
    subtitle: 'Folhas aprovadas por todos, disponíveis para auditoria de cumprimento por funcionário',
    paginator: true,
    totalize: false,
    dataKey: 'id',
    columns: this.createFolhasColumns(true),
  };

  private readonly reload$ = new BehaviorSubject<void>(undefined);

  ngOnInit(): void {
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
    return this.isAdmin() || this.hasLeaderRole() || this.userRoles().includes('SUPORTE');
  }

  protected onLazyLoad(event: TableLazyLoadEvent): void {
    this.first = event.first ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
    this.reload$.next();
  }

  protected onHistoricoLazyLoad(event: TableLazyLoadEvent): void {
    this.historicoFirst = event.first ?? 0;
    this.historicoPageSize = event.rows ?? this.historicoPageSize;
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
    this.refeicoesStatusFilter.setValue(['AGUARDANDO_GERENCIA', 'AGUARDANDO_DIRETORIA', 'APROVADO']);
    this.applyRefeicoesFilters();
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
        this.messages = [{ severity: 'success', summary: 'Sucesso', detail: 'Folha submetida para gerencia.' }];
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
    const canEdit = this.isAdmin() || this.hasLeaderRole(roles) || roles.includes('SUPORTE');
    return this.isEditableStatus(folha.status)
      && canEdit;
  }

  protected canSubmit(folha: FolhaHoraExtraResumo): boolean {
    return !this.userRoles().includes('SUPORTE')
      && ['RASCUNHO', 'REJEITADO_GERENCIA', 'REJEITADO_DIRETORIA'].includes(folha.status);
  }

  protected canApprove(folha: FolhaHoraExtraResumo): boolean {
    const roles = this.userRoles();
    if (this.isAdmin()) {
      return ['AGUARDANDO_GERENCIA', 'AGUARDANDO_DIRETORIA'].includes(folha.status);
    }

    return (
      (this.isManager(roles) && folha.status === 'AGUARDANDO_GERENCIA') ||
      (roles.includes(SetUserCargoDTOCargoEnum.DIRETOR) && folha.status === 'AGUARDANDO_DIRETORIA')
    );
  }

  protected canViewKpi(folha: FolhaHoraExtraResumo): boolean {
    return this.canAuditHistorico() && folha.status === 'APROVADO';
  }

  protected canViewFolhas(): boolean {
    const roles = this.userRoles();
    return !roles.includes('RH') && (this.usesHistoricoDashboard()
      || this.hasLeaderRole(roles)
      || roles.includes('SUPORTE'));
  }

  protected canViewRefeicoes(): boolean {
    return this.userRoles().includes('RH');
  }

  protected hasVisibleSections(): boolean {
    return this.canViewFolhas() || this.canViewRefeicoes() || this.canAuditHistorico();
  }

  protected usesHistoricoDashboard(): boolean {
    const roles = this.userRoles();
    return !roles.includes('RH') && (this.isManager(roles) || roles.includes(SetUserCargoDTOCargoEnum.DIRETOR) || this.isAdmin());
  }

  protected canAuditHistorico(): boolean {
    const roles = this.userRoles();
    return !roles.includes('RH') && (this.usesHistoricoDashboard() || this.hasLeaderRole(roles));
  }

  protected getStatusSeverity(status: FolhaHoraExtraStatus): 'secondary' | 'info' | 'warn' | 'success' | 'danger' {
    switch (status) {
      case 'RASCUNHO': return 'secondary';
      case 'AGUARDANDO_GERENCIA': return 'info';
      case 'AGUARDANDO_DIRETORIA': return 'warn';
      case 'APROVADO': return 'success';
      case 'REJEITADO_GERENCIA':
      case 'REJEITADO_DIRETORIA':
        return 'danger';
    }
  }

  protected getStatusLabel(status: FolhaHoraExtraStatus): string {
    return FOLHA_HE_STATUS_LABEL[status];
  }

  protected getCumprimentoSeverity(funcionario: ResFuncionarioKpiCumprimentoFolhaHoraExtraDTO): 'success' | 'danger' {
    return funcionario.cumpriuHorarioHE ? 'success' : 'danger';
  }

  protected getCumprimentoLabel(funcionario: ResFuncionarioKpiCumprimentoFolhaHoraExtraDTO): string {
    return funcionario.cumpriuHorarioHE ? 'Cumpriu' : 'Nao cumpriu';
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

  protected isAdmin(): boolean {
    return this.userRoles().includes(SetUserCargoDTOCargoEnum.ADMIN);
  }

  private createFolhasColumns(historico: boolean): TableModel['columns'] {
    return [
      {
        alias: 'Data',
        field: 'dataContexto',
        isDate: true,
        dateFormat: 'dd/MM/yyyy',
        dateTimezone: 'UTC',
        filterable: false,
        sortable: false,
      },
      { alias: 'Setor', field: 'setor', filterable: false, sortable: false },
      {
        alias: 'Centro de Custo',
        field: 'centroCustoCodigo',
        filterable: false,
        sortable: false,
        valueFormatter: (_, row: FolhaHoraExtraResumo) =>
          `${row.centroCustoCodigo} - ${row.centroCustoDescricao}`,
      },
      {
        alias: 'Turno',
        field: 'turno',
        isTag: true,
        filterable: false,
        sortable: false,
        tagLabelFn: value => value === 'NOTURNO' ? 'Noturno' : 'Normal',
        tagSeverityFn: value => value === 'NOTURNO' ? 'info' : 'secondary',
      },
      {
        alias: 'Percentual',
        field: 'percentualCusto',
        filterable: false,
        sortable: false,
        valueFormatter: value => `${value}%`,
      },
      {
        alias: 'Status',
        field: 'status',
        isTag: true,
        filterable: false,
        sortable: false,
        tagLabelFn: value => this.getStatusLabel(value as FolhaHoraExtraStatus),
        tagSeverityFn: value => this.getStatusSeverity(value as FolhaHoraExtraStatus),
      },
      { alias: 'Funcionários', field: 'totalFuncionarios', isNumber: true, filterable: false, sortable: false },
      { alias: 'Autor', field: 'autorNome', filterable: false, sortable: false },
      {
        alias: 'Atualizado em',
        field: 'atualizadoEm',
        isDate: true,
        dateFormat: 'dd/MM/yyyy HH:mm',
        filterable: false,
        sortable: false,
      },
      {
        alias: historico ? 'KPI' : 'Ações',
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
              {
                icon: 'pi pi-chart-bar',
                tooltip: 'Ver KPI',
                severity: 'success',
                visible: row => this.canViewKpi(row as FolhaHoraExtraResumo),
                command: row => this.openKpi(row as FolhaHoraExtraResumo),
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
                visible: () => !this.usesHistoricoDashboard(),
                disabled: row => !this.canEdit(row as FolhaHoraExtraResumo),
                command: row => this.editFolha(row as FolhaHoraExtraResumo),
              },
              {
                icon: 'pi pi-send',
                tooltip: 'Submeter',
                visible: () => !this.usesHistoricoDashboard() && !this.userRoles().includes('SUPORTE'),
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
    ];
  }

  private loadFolhas() {
    this.loading = true;
    const range = this.dataRangeFilter.value;
    const statusFilter = this.usesHistoricoDashboard()
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
      this.historicoFolhas = normalizeFolhasResponse(normalizedResponse);
      this.historicoTotalRecords = response.total ?? this.historicoFolhas.length;
    });
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

  /**
   * O endpoint de refeições normaliza a data recebida no fuso UTC e aplica o
   * resultado ao próximo dia operacional. Enviamos o dia anterior para que o
   * filtro exibido para o RH corresponda exatamente à data da folha.
   */
  private formatRefeicoesDate(date: Date): string {
    const previousDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
    return this.formatLocalDate(previousDay);
  }

  private isEditableStatus(status: FolhaHoraExtraStatus): boolean {
    return ['RASCUNHO', 'REJEITADO_GERENCIA', 'REJEITADO_DIRETORIA'].includes(status);
  }

  private userRoles(): string[] {
    return this.userStore.item()?.cargosLista ?? [];
  }

  private isManager(roles: string[]): boolean {
    return roles.includes('GERENTE');
  }

  private hasLeaderRole(roles = this.userRoles()): boolean {
    return LIDERES_ROLES
      .filter(role => role !== SetUserCargoDTOCargoEnum.ADMIN)
      .some(role => roles.includes(role));
  }

  private getApprovalStatusesForUser(): FolhaHoraExtraStatus[] {
    const roles = this.userRoles();
    const statuses: FolhaHoraExtraStatus[] = [];

    if (this.isAdmin() || this.isManager(roles)) {
      statuses.push('AGUARDANDO_GERENCIA');
    }
    if (this.isAdmin() || roles.includes(SetUserCargoDTOCargoEnum.DIRETOR)) {
      statuses.push('AGUARDANDO_DIRETORIA');
    }

    return statuses;
  }

  private getOperationalStatusesForUser(selectedStatus: FolhaHoraExtraStatus | null): FolhaHoraExtraStatus[] {
    if (selectedStatus && FOLHA_HE_STATUS_OPERACIONAL.includes(selectedStatus)) {
      return [selectedStatus];
    }

    return FOLHA_HE_STATUS_OPERACIONAL;
  }
}
