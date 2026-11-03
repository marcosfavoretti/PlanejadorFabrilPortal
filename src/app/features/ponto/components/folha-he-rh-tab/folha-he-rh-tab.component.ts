import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ResCategoriaHoraExtraResumoDTO, ResCentroDeCustoDTO } from '@/api/relogio';
import { CategoriaHoraExtraAPIService } from '@/app/features/ponto/services/CategoriaHoraExtraAPI.service';
import { SEM_CATEGORIA_CODIGO, SEM_CATEGORIA_LABEL, categoriaLabel, codigoFiltroCategoria, opcoesFiltroCategoria } from '@/app/features/ponto/utils/categoria-he';
import { categoriaColumn } from '@/app/features/ponto/utils/folha-he-colunas';
import { temExcecaoHE } from '@/app/features/ponto/utils/horarios-he';
import { FOLHA_HE_STATUS_TODOS, severidadeStatusFolhaHE } from '@/app/features/ponto/utils/folha-he-status';
import { formatDateIso } from '@/app/features/ponto/utils/data-iso';
import {
  FolhaHoraExtraAPIService,
  FolhaHoraExtraRefeicaoResumo,
  FolhaHoraExtraStatus,
  mapFolhaHoraExtraError,
  normalizeFolhasResponse,
} from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import { catchError, finalize, forkJoin, from, map, merge, mergeMap, Observable, of, Subject, switchMap, tap, toArray } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastMessageOptions } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent } from 'primeng/table';
import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { CategoriasHoraExtraSectionComponent } from '../categorias-hora-extra-section/categorias-hora-extra-section.component';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';

interface FuncionarioFolhaHEAprovada {
  id: string;
  categoria: ResCategoriaHoraExtraResumoDTO | null;
  nome: string;
  matricula: string;
  dataFolha: string;
  atualizadoEm: string;
  centroCustoCodigo: number;
  centroCustoDescricao: string;
  setor: string;
  inicioHE: string;
  fimHE: string;
  refeicao: string;
  transporte: string;
  observacao: string;
  status: FolhaHoraExtraStatus;
}

function createTodayRange(): Date[] {
  const today = new Date();
  return [today, today];
}

@Component({
  selector: 'app-folha-he-rh-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CategoriasHoraExtraSectionComponent,
    DatePickerModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TableDynamicComponent,
  ],
  templateUrl: './folha-he-rh-tab.component.html',
  styleUrls: ['./folha-he-rh-tab.component.css'],
})
export class FolhaHeRhTabComponent implements OnInit {
  private readonly folhaHoraExtraService = inject(FolhaHoraExtraAPIService);
  private readonly categoriasService = inject(CategoriaHoraExtraAPIService);
  private readonly destroyRef = inject(DestroyRef);

  /** Permissões e dados compartilhados vêm da lista de folhas. */
  readonly canViewRefeicoes = input(false);
  readonly canManageCategorias = input(false);
  readonly centrosCusto = input<ResCentroDeCustoDTO[]>([]);

  /** Mensagens de feedback exibidas pela lista de folhas. */
  readonly mensagensChange = output<ToastMessageOptions[]>();
  /** Sinaliza início/fim da impressão da tabela de refeições (a lista aplica a classe de impressão). */
  readonly imprimindoChange = output<boolean>();
  /** Pede à lista para abrir a folha selecionada na tabela de refeições. */
  readonly visualizarFolha = output<string>();

  protected readonly getStatusSeverity = severidadeStatusFolhaHE;

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
  protected readonly aprovadasStatusFilter = new FormControl<FolhaHoraExtraStatus[] | null>(
    ['AGUARDANDO_COORDENACAO', 'AGUARDANDO_DIRETORIA', 'APROVADO'],
  );
  protected readonly aprovadasRefeicaoFilter = new FormControl<string[] | null>(null);
  protected readonly aprovadasTransporteFilter = new FormControl<string[] | null>(null);
  protected readonly refeicoesCategoriaFilter = new FormControl<string | null>(null);
  protected readonly aprovadasCategoriaFilter = new FormControl<string | null>(null);
  protected categoriaFilterOptions: Array<{ label: string; value: string }> = [
    { label: SEM_CATEGORIA_LABEL, value: SEM_CATEGORIA_CODIGO },
  ];
  protected readonly transporteOptions = ['UBER', 'TAXI', 'FRETADO', 'N/A'].map(value => ({ label: value, value }));
  protected readonly refeicaoOptions = [
    { label: 'Marmitex', value: 'MARMITEX' as const },
    { label: 'Lanche', value: 'LANCHE' as const },
    { label: 'Sem refeição', value: 'N/A' as const },
  ];
  protected readonly refeicoesStatusOptions = FOLHA_HE_STATUS_TODOS
    .map(status => ({ label: status, value: status }));
  protected refeicoesPageSize = 50;
  protected refeicoesFirst = 0;
  protected refeicoesTotalRecords = 0;
  protected refeicoesHoje: FolhaHoraExtraRefeicaoResumo[] = [];
  protected funcionariosFolhasAprovadas: FuncionarioFolhaHEAprovada[] = [];
  protected refeicoesLoading = false;
  protected funcionariosFolhasAprovadasLoading = false;
  private readonly refeicoesConsulta$ = new Subject<void>();
  protected readonly temExcecaoHE = temExcecaoHE;
  protected readonly categoriaNome = categoriaLabel;
  protected readonly refeicoesTableModel: TableModel = {
    title: 'Refeições solicitadas',
    subtitle: 'Uma linha por funcionário, conforme os filtros informados',
    paginator: true,
    totalize: false,
    dataKey: 'folhaId',
    columns: [
      { alias: 'Funcionário', field: 'nome', filterable: false, sortable: false },
      { alias: 'Matrícula', field: 'matricula', filterable: false, sortable: false },
      categoriaColumn(),
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
          command: row => this.visualizarFolha.emit((row as FolhaHoraExtraRefeicaoResumo).folhaId),
        }],
      },
    ],
    ghostControll: [
      { field: 'inicioHE', desc: 'Exceção de horário', ifRowFunction: row => temExcecaoHE(row), color: '#fef9c3' },
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
    title: 'Funcionários nas folhas de HE',
    subtitle: 'Uma linha por funcionário incluído em uma folha de hora extra, independentemente do status',
    paginator: true,
    totalize: false,
    dataKey: 'id',
    sortField: 'nome',
    sortOrder: 1,
    columns: [
      { alias: 'Funcionário', field: 'nome', filterable: false },
      { alias: 'Matrícula', field: 'matricula', filterable: false },
      categoriaColumn(),
      {
        alias: 'Data da folha',
        field: 'dataFolha',
        isDate: true,
        dateFormat: 'dd/MM/yyyy',
        dateTimezone: 'UTC',
        filterable: false,
      },
      {
        alias: 'Última atualização da folha',
        field: 'atualizadoEm',
        isDate: true,
        dateFormat: 'dd/MM/yyyy HH:mm',
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
      {
        alias: 'Refeição',
        field: 'refeicao',
        isTag: true,
        filterable: false,
        tagLabelFn: (value, row) => this.getRefeicaoLabel(
          value as FolhaHoraExtraRefeicaoResumo['refeicao'],
          row as FolhaHoraExtraRefeicaoResumo,
        ),
        tagSeverityFn: value => this.getRefeicaoSeverity(value as FolhaHoraExtraRefeicaoResumo['refeicao']),
      },
      { alias: 'Transporte', field: 'transporte', filterable: false },
      {
        alias: 'Status da folha',
        field: 'status',
        isTag: true,
        filterable: false,
        tagSeverityFn: value => this.getStatusSeverity(value as FolhaHoraExtraStatus),
      },
      { alias: 'Observações', field: 'observacao', filterable: false },
    ],
    ghostControll: [{ field: 'inicioHE', desc: 'Exceção de horário', ifRowFunction: row => temExcecaoHE(row), color: '#fef9c3' }],
  };

  ngOnInit(): void {
    if (this.canViewRefeicoes()) {
      this.observarConsultaRefeicoes();
      this.loadCategoriasFiltro();
      // O filtro de categoria muda o conjunto de linhas e o total: volta para a primeira página.
      this.refeicoesCategoriaFilter.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.applyRefeicoesFilters());
      this.loadFuncionariosFolhasAprovadas();
    }
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
    this.refeicoesCategoriaFilter.setValue(null);
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
    this.aprovadasStatusFilter.setValue(['AGUARDANDO_COORDENACAO', 'AGUARDANDO_DIRETORIA', 'APROVADO']);
    this.aprovadasRefeicaoFilter.setValue(null);
    this.aprovadasTransporteFilter.setValue(null);
    this.aprovadasCategoriaFilter.setValue(null);
    this.applyAprovadasFilters();
  }

  protected printRefeicoes(): void {
    if (!this.refeicoesHoje.length) {
      return;
    }

    this.imprimindoChange.emit(true);
    document.body.classList.add('printing-refeicoes');
    const clearPrintMode = () => {
      this.imprimindoChange.emit(false);
      document.body.classList.remove('printing-refeicoes');
    };
    window.addEventListener('afterprint', clearPrintMode, { once: true });
    requestAnimationFrame(() => window.print());
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
    { inicioHE }: FolhaHoraExtraRefeicaoResumo,
  ): string {
    if (refeicao !== 'MARMITEX') {
      return refeicao;
    }

    return this.startsAtDinnerTime(inicioHE) ? 'MARMITEX (JANTA)' : 'MARMITEX (ALMOÇO)';
  }

  private startsAtDinnerTime(inicio: string): boolean {
    const [hours, minutes] = inicio.split(':').map(Number);
    const dinnerStart = 14 * 60;

    return hours * 60 + minutes >= dinnerStart;
  }

  private loadRefeicoesHoje(): void {
    this.refeicoesConsulta$.next();
  }

  /** switchMap: uma resposta antiga nunca sobrescreve a da consulta mais recente. */
  private observarConsultaRefeicoes(): void {
    this.refeicoesConsulta$.pipe(
      tap(() => this.refeicoesLoading = true),
      switchMap(() => this.consultarRefeicoes().pipe(
        catchError(err => {
          this.mensagensChange.emit([{
            severity: 'error',
            summary: 'Erro',
            detail: `Nao foi possivel carregar as refeicoes de hoje. ${mapFolhaHoraExtraError(err)}`,
          }]);
          return of({ data: [] as FolhaHoraExtraRefeicaoResumo[], total: 0 });
        }),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ data, total }) => {
      this.refeicoesHoje = data;
      this.refeicoesTotalRecords = total;
      this.refeicoesLoading = false;
    });
  }

  private consultarRefeicoes(): Observable<{ data: FolhaHoraExtraRefeicaoResumo[]; total: number }> {
    const range = this.refeicoesDataRangeFilter.value;
    const statuses = this.refeicoesStatusFilter.value ?? [];
    return this.folhaHoraExtraService.getRefeicoes({
      dataInicio: range?.[0] ? formatDateIso(range[0]) : undefined,
      dataFim: range?.[1] ? formatDateIso(range[1]) : undefined,
      centroCustoCodigo: this.refeicoesCentroCustoFilter.value ?? undefined,
      matricula: this.refeicoesMatriculaFilter.value.trim() || undefined,
      nome: this.refeicoesNomeFilter.value.trim() || undefined,
      refeicao: this.refeicoesTipoFilter.value ?? undefined,
      status: statuses.length ? statuses : undefined,
      // SEM_CATEGORIA também é aceito pelo servidor (folhas antigas).
      categoriaCodigo: this.refeicoesCategoriaFilter.value ?? undefined,
      page: Math.floor(this.refeicoesFirst / this.refeicoesPageSize),
      limit: this.refeicoesPageSize,
    }).pipe(map(response => ({ data: response.data, total: response.total })));
  }

  /** Inclui categorias inativas (folhas antigas as usam) e recarrega quando o cadastro de categorias muda. */
  private loadCategoriasFiltro(): void {
    merge(of(false), this.categoriasService.catalogoAlterado$.pipe(map(() => true))).pipe(
      switchMap(forcar => this.categoriasService.getTodas(forcar).pipe(catchError(() => of(null)))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(categorias => {
      // Em erro o filtro segue com as opções atuais.
      if (categorias) {
        this.categoriaFilterOptions = opcoesFiltroCategoria(categorias);
      }
    });
  }

  private loadFuncionariosFolhasAprovadas(): void {
    const pageSize = 100;
    this.funcionariosFolhasAprovadasLoading = true;
    const range = this.aprovadasDataRangeFilter.value;
    const matricula = this.aprovadasMatriculaFilter.value.trim();
    const nome = this.aprovadasNomeFilter.value.trim();
    const status = this.aprovadasStatusFilter.value;
    const refeicoes = this.aprovadasRefeicaoFilter.value ?? [];
    const transportes = this.aprovadasTransporteFilter.value ?? [];
    const categoriaCodigo = this.aprovadasCategoriaFilter.value;
    const filters = {
      dataInicio: range?.[0] ? formatDateIso(range[0]) : undefined,
      dataFim: range?.[1] ? formatDateIso(range[1]) : undefined,
      centroCustoCodigo: this.aprovadasCentroCustoFilter.value ?? undefined,
      nomeFuncionario: nome || undefined,
      matriculaFuncionario: matricula || undefined,
      status: status ?? undefined,
    };

    this.folhaHoraExtraService.getFolhas({
      ...filters,
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
              ...filters,
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
          categoria: funcionario.categoria ?? null,
          nome: funcionario.nome,
          matricula: funcionario.matricula,
          dataFolha: folha.dataContexto,
          atualizadoEm: folha.atualizadoEm,
          centroCustoCodigo: folha.centroCustoCodigo,
          centroCustoDescricao: folha.centroCustoDescricao,
          setor: folha.setor,
          inicioHE: funcionario.inicioHE,
          fimHE: funcionario.fimHE,
          refeicao: funcionario.refeicao ?? 'N/A',
          transporte: funcionario.transporte ?? 'N/A',
          observacao: funcionario.justificativa || folha.observacao || '-',
          status: folha.status,
        }))),
        toArray(),
      )),
      map(funcionariosPorFolha => {
        return funcionariosPorFolha
          .flat()
          .filter(funcionario => (!refeicoes.length || refeicoes.includes(funcionario.refeicao))
            && (!transportes.length || transportes.includes(funcionario.transporte))
            && (!categoriaCodigo || codigoFiltroCategoria(funcionario.categoria) === categoriaCodigo))
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      }),
      catchError(err => {
        this.mensagensChange.emit([{
          severity: 'error',
          summary: 'Erro',
          detail: `Não foi possível carregar os funcionários das folhas de HE. ${mapFolhaHoraExtraError(err)}`,
        }]);
        return of([] as FuncionarioFolhaHEAprovada[]);
      }),
      finalize(() => this.funcionariosFolhasAprovadasLoading = false),
    ).subscribe(funcionarios => this.funcionariosFolhasAprovadas = funcionarios);
  }
}
