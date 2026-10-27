import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AxiosError } from 'axios';
import {
  addDays,
  differenceInCalendarDays,
  eachMonthOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent } from 'primeng/table';

import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';
import { FaltasKpiAPIService } from '@/app/features/ponto/services/FaltasKpiAPI.service';
import { FuncionariosAPIService } from '@/app/features/ponto/services/FuncionariosAPI.service';
import { FolhaHoraExtraAPIService } from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import {
  PontoKPIControllerRankingFaltasQueryParamsOrdenarPorEnum,
  ResCentroDeCustoDTO,
  ResKpiFaltasResumoDTO,
  ResKpiFaltasSetorDTO,
  ResRankingFaltasDTO,
} from '@/api/relogio';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';

const JANELA_MAXIMA_DIAS = 92;
const SEQUENCIA_CRITICA = 3;

const CARGOS_COM_SELECAO_LIVRE_CC = new Set<string>([
  SetUserCargoDTOCargoEnum.ADMIN,
  SetUserCargoDTOCargoEnum.RH,
  SetUserCargoDTOCargoEnum.DIRETOR,
]);

interface FiltrosKpiFaltas {
  dataInicio: string;
  dataFim: string;
  ccid?: string[];
  diaSemana?: string[];
  identificador?: string;
}

interface DiaCalendario {
  data: Date | null;
  falta: boolean;
}

interface MesCalendario {
  titulo: string;
  dias: DiaCalendario[];
}

@Component({
  selector: 'app-faltas-kpi',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, ChartModule, DatePickerModule,
    DialogModule, InputNumberModule, InputTextModule, MultiSelectModule, ProgressBarModule, SelectModule, TableDynamicComponent,
  ],
  templateUrl: './faltas-kpi.component.html',
  styleUrls: ['../../styles/ponto-dashboard.css', './faltas-kpi.component.css'],
})
export class FaltasKpiComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly faltasKpiService = inject(FaltasKpiAPIService);
  private readonly funcionariosAPIService = inject(FuncionariosAPIService);
  private readonly folhaHoraExtraService = inject(FolhaHoraExtraAPIService);
  private readonly userStore = inject(UserstoreService);

  protected readonly hoje = startOfDay(new Date());
  protected readonly semanaLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  protected readonly filtroForm = this.fb.group({
    periodo: this.fb.control<Date[] | null>([startOfMonth(this.hoje), this.hoje]),
    ccid: this.fb.control<number[]>([]),
    diaSemana: this.fb.control<string[]>([]),
    identificador: [''],
  });

  protected readonly rankingForm = this.fb.group({
    ordenarPor: this.fb.nonNullable.control(PontoKPIControllerRankingFaltasQueryParamsOrdenarPorEnum.faltas),
    minFaltas: this.fb.nonNullable.control(1),
  });

  protected readonly diaSemanaOptions = [
    { label: 'Domingo', value: '1' },
    { label: 'Segunda', value: '2' },
    { label: 'Terça', value: '3' },
    { label: 'Quarta', value: '4' },
    { label: 'Quinta', value: '5' },
    { label: 'Sexta', value: '6' },
    { label: 'Sábado', value: '7' },
  ];

  protected readonly ordenarPorOptions = [
    { label: 'Mais faltas', value: PontoKPIControllerRankingFaltasQueryParamsOrdenarPorEnum.faltas },
    { label: 'Maior taxa', value: PontoKPIControllerRankingFaltasQueryParamsOrdenarPorEnum.taxa },
    { label: 'Maior sequência', value: PontoKPIControllerRankingFaltasQueryParamsOrdenarPorEnum.maiorSequencia },
  ];

  protected readonly filterContextReady = signal(false);
  protected readonly semCentroCusto = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly resumo = signal<ResKpiFaltasResumoDTO | null>(null);
  protected readonly resumoLoading = signal(false);
  protected readonly ranking = signal<ResRankingFaltasDTO[]>([]);
  protected readonly rankingTotal = signal(0);
  protected readonly rankingLoading = signal(false);
  protected readonly atualizacaoLabel = signal('');

  protected readonly detalheVisivel = signal(false);
  protected readonly detalheFuncionario = signal<ResRankingFaltasDTO | null>(null);
  protected readonly detalheMeses = signal<MesCalendario[]>([]);
  protected readonly detalheLoading = signal(false);

  protected porDiaChartData: unknown = null;
  protected porDiaChartOptions: unknown = null;
  protected centroDeCusto: ResCentroDeCustoDTO[] = [];
  protected rankingFirst = 0;
  protected rankingPageSize = 10;
  private filtrosAplicados: FiltrosKpiFaltas | null = null;

  protected readonly setorTableModel: TableModel = {
    title: 'Absenteísmo por setor',
    subtitle: 'Ordenado da maior para a menor taxa',
    paginator: true,
    totalize: false,
    dataKey: 'setor',
    columns: [
      {
        alias: 'Setor', field: 'setor', filterable: false, sortable: false,
        valueFormatter: (value: string, row: ResKpiFaltasSetorDTO) => row.ccid ? `${row.ccid} - ${value}` : value,
      },
      { alias: 'Previstos', field: 'diasPrevistos', isNumber: true, filterable: false, sortable: true },
      { alias: 'Faltas', field: 'faltas', isNumber: true, filterable: false, sortable: true },
      { alias: 'Funcionários c/ falta', field: 'funcionariosComFalta', isNumber: true, filterable: false, sortable: true },
      {
        alias: 'Taxa', field: 'taxaAbsenteismo', filterable: false, sortable: true,
        valueFormatter: (value: number) => this.formatPercent(value),
      },
    ],
  };

  protected readonly rankingTableModel: TableModel = {
    title: 'Quem mais falta',
    subtitle: 'Sequência conta faltas em dias previstos consecutivos; folgas e feriados não interrompem',
    paginator: true,
    totalize: false,
    dataKey: 'matricula',
    columns: [
      { alias: 'Matrícula', field: 'matricula', filterable: false, sortable: false },
      { alias: 'Funcionário', field: 'nome', filterable: false, sortable: false },
      { alias: 'Setor', field: 'setor', filterable: false, sortable: false },
      { alias: 'Previstos', field: 'diasPrevistos', filterable: false, sortable: false },
      { alias: 'Faltas', field: 'faltas', filterable: false, sortable: false },
      {
        alias: 'Taxa', field: 'taxa', filterable: false, sortable: false,
        valueFormatter: (value: number) => this.formatPercent(value),
      },
      {
        alias: 'Maior sequência', field: 'maiorSequencia', isTag: true, filterable: false, sortable: false,
        tagLabelFn: (value: number) => `${value} dia${value === 1 ? '' : 's'}`,
        tagSeverityFn: value => Number(value) >= SEQUENCIA_CRITICA ? 'danger' : Number(value) > 1 ? 'warn' : 'secondary',
      },
      {
        alias: 'Última falta', field: 'ultimaFalta', filterable: false, sortable: false,
        valueFormatter: (value: unknown) => value ? format(parseISO(String(value)), 'dd/MM/yyyy') : '-',
      },
      {
        alias: '', field: 'acoes', isActions: true, filterable: false, sortable: false,
        actions: [{
          icon: 'pi pi-calendar', tooltip: 'Ver dias de falta', severity: 'secondary', text: true, rounded: true,
          command: (row: ResRankingFaltasDTO) => this.abrirDetalhe(row),
        }],
      },
    ],
  };

  ngOnInit(): void {
    this.funcionariosAPIService.getCentroDeCusto().subscribe({
      next: centros => {
        this.centroDeCusto = centros;
        this.applyLoggedUserCentroCustoScope(() => {
          this.filterContextReady.set(true);
          this.aplicarFiltros();
        });
      },
      error: err => console.error('Erro ao carregar centros de custo', err),
    });
  }

  protected aplicarFiltros(): void {
    const filtros = this.buildFiltros();
    if (!filtros) {
      return;
    }

    this.erro.set(null);
    this.filtrosAplicados = filtros;
    this.atualizacaoLabel.set(this.getAtualizacaoLabel(parseISO(filtros.dataFim)));
    this.rankingFirst = 0;
    this.loadResumo();
    this.loadRanking();
  }

  protected limparFiltros(): void {
    this.filtroForm.reset({
      periodo: [startOfMonth(this.hoje), this.hoje],
      ccid: [],
      diaSemana: [],
      identificador: '',
    });
    this.aplicarFiltros();
  }

  protected aplicarOrdenacaoRanking(): void {
    this.rankingFirst = 0;
    this.loadRanking();
  }

  protected onRankingLazyLoad(event: TableLazyLoadEvent): void {
    this.rankingFirst = event.first ?? 0;
    this.rankingPageSize = event.rows ?? this.rankingPageSize;
    this.loadRanking();
  }

  protected formatPercent(value: number | null | undefined): string {
    return `${(value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  }

  protected fecharDetalhe(): void {
    this.detalheVisivel.set(false);
    this.detalheFuncionario.set(null);
    this.detalheMeses.set([]);
  }

  private buildFiltros(): FiltrosKpiFaltas | null {
    const { periodo, ccid, diaSemana, identificador } = this.filtroForm.getRawValue();
    const [inicio, fim] = periodo ?? [];
    if (!inicio || !fim) {
      this.erro.set('Selecione a data inicial e a data final do período.');
      return null;
    }

    if (differenceInCalendarDays(fim, inicio) + 1 > JANELA_MAXIMA_DIAS) {
      this.erro.set(`O período máximo é de ${JANELA_MAXIMA_DIAS} dias.`);
      return null;
    }

    return {
      dataInicio: format(inicio, 'yyyy-MM-dd'),
      dataFim: format(fim, 'yyyy-MM-dd'),
      ccid: ccid?.length ? ccid.map(String) : undefined,
      diaSemana: diaSemana?.length ? diaSemana : undefined,
      identificador: identificador?.trim() || undefined,
    };
  }

  private loadResumo(): void {
    if (!this.filtrosAplicados) {
      return;
    }

    this.resumoLoading.set(true);
    this.faltasKpiService.getResumo(this.filtrosAplicados).subscribe({
      next: resumo => {
        this.resumo.set(resumo);
        this.semCentroCusto.set(resumo === null);
        this.updatePorDiaChart(resumo);
        this.resumoLoading.set(false);
      },
      error: err => {
        console.error('Erro ao consultar resumo de faltas', err);
        this.erro.set(this.getErrorMessage(err));
        this.resumo.set(null);
        this.updatePorDiaChart(null);
        this.resumoLoading.set(false);
      },
    });
  }

  private loadRanking(): void {
    if (!this.filtrosAplicados) {
      return;
    }

    const { ordenarPor, minFaltas } = this.rankingForm.getRawValue();
    this.rankingLoading.set(true);
    this.faltasKpiService.getRanking({
      ...this.filtrosAplicados,
      page: Math.floor(this.rankingFirst / this.rankingPageSize),
      limit: this.rankingPageSize,
      ordenarPor,
      minFaltas: Math.max(1, minFaltas || 1),
    }).subscribe({
      next: response => {
        this.ranking.set(response?.data ?? []);
        this.rankingTotal.set(response?.total ?? 0);
        this.rankingLoading.set(false);
      },
      error: err => {
        console.error('Erro ao consultar ranking de faltas', err);
        this.erro.set(this.getErrorMessage(err));
        this.ranking.set([]);
        this.rankingTotal.set(0);
        this.rankingLoading.set(false);
      },
    });
  }

  private abrirDetalhe(row: ResRankingFaltasDTO): void {
    if (!this.filtrosAplicados) {
      return;
    }

    const { dataInicio, dataFim, diaSemana } = this.filtrosAplicados;
    this.detalheFuncionario.set(row);
    this.detalheMeses.set([]);
    this.detalheVisivel.set(true);
    this.detalheLoading.set(true);
    this.faltasKpiService.getDiasDeFalta(row.matricula, { dataInicio, dataFim, diaSemana }).subscribe({
      next: response => {
        this.detalheMeses.set(this.buildCalendario(
          parseISO(response.dataInicio),
          parseISO(response.dataFim),
          response.dias.map(dia => parseISO(dia)),
        ));
        this.detalheLoading.set(false);
      },
      error: err => {
        console.error('Erro ao consultar dias de falta', err);
        this.erro.set(this.getErrorMessage(err));
        this.detalheLoading.set(false);
      },
    });
  }

  private buildCalendario(inicio: Date, fim: Date, faltas: Date[]): MesCalendario[] {
    return eachMonthOfInterval({ start: inicio, end: fim }).map(mes => {
      const dias: DiaCalendario[] = Array.from({ length: getDay(mes) }, () => ({ data: null, falta: false }));
      for (let dia = mes; dia <= endOfMonth(mes); dia = addDays(dia, 1)) {
        dias.push({ data: dia, falta: faltas.some(falta => isSameDay(falta, dia)) });
      }
      return { titulo: format(mes, "MMMM 'de' yyyy", { locale: ptBR }), dias };
    });
  }

  private updatePorDiaChart(resumo: ResKpiFaltasResumoDTO | null): void {
    if (!resumo?.porDia.length) {
      this.porDiaChartData = null;
      return;
    }

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-muted-color') || '#64748b';
    const gridColor = documentStyle.getPropertyValue('--p-content-border-color') || '#e5e7eb';

    this.porDiaChartData = {
      labels: resumo.porDia.map(dia => format(parseISO(dia.data), 'dd/MM')),
      datasets: [
        {
          type: 'line',
          label: 'Taxa de absenteísmo (%)',
          // Domingos e feriados vêm com previstos = 0: sem taxa, a linha pula o ponto.
          data: resumo.porDia.map(dia => dia.previstos ? dia.taxaAbsenteismo : null),
          borderColor: '#dc3545',
          backgroundColor: '#dc3545',
          tension: 0.3,
          spanGaps: true,
          yAxisID: 'taxa',
        },
        {
          type: 'bar',
          label: 'Faltas',
          data: resumo.porDia.map(dia => dia.faltas),
          backgroundColor: 'rgba(25, 135, 84, 0.55)',
          borderRadius: 4,
          yAxisID: 'faltas',
        },
      ],
    };

    this.porDiaChartOptions = {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: textColor } },
        tooltip: {
          callbacks: {
            afterBody: (items: { dataIndex: number }[]) => {
              const dia = resumo.porDia[items[0]?.dataIndex];
              return dia ? `Previstos: ${dia.previstos}` : '';
            },
          },
        },
      },
      scales: {
        x: { ticks: { color: textColor }, grid: { display: false } },
        faltas: {
          position: 'left', beginAtZero: true,
          ticks: { color: textColor, precision: 0 }, grid: { color: gridColor },
          title: { display: true, text: 'Faltas', color: textColor },
        },
        taxa: {
          position: 'right', beginAtZero: true,
          ticks: { color: textColor, callback: (value: number) => `${value}%` }, grid: { drawOnChartArea: false },
          title: { display: true, text: 'Taxa', color: textColor },
        },
      },
    };
  }

  /** Espelha o cache do backend: hoje 60s, até 3 dias atrás 5 min, mais antigo 1h. */
  private getAtualizacaoLabel(dataFim: Date): string {
    if (isSameDay(dataFim, this.hoje)) {
      return 'Dados atualizados a cada 1 minuto.';
    }
    if (dataFim >= subDays(this.hoje, 3)) {
      return 'Dados atualizados a cada 5 minutos.';
    }
    return 'Dados atualizados a cada 1 hora; ajustes do RH em dias antigos podem levar até 1 hora para aparecer.';
  }

  private getErrorMessage(err: unknown): string {
    const message = (err as AxiosError<{ message?: string | string[] }>)?.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(' ');
    }
    return message || 'Não foi possível carregar o KPI de faltas.';
  }

  private applyLoggedUserCentroCustoScope(afterLoad: () => void): void {
    if (this.podeSelecionarQualquerCentroCusto()) {
      afterLoad();
      return;
    }

    const usuarioId = this.userStore.item()?.id;
    if (!usuarioId) { afterLoad(); return; }

    // O backend já restringe aos centros do usuário; aqui só limitamos as opções do filtro.
    this.folhaHoraExtraService.getLiderCentroCusto(usuarioId).subscribe({
      next: vinculos => {
        const linkedCodes = new Set(vinculos.map(vinculo => vinculo.centroCustoCodigo));
        this.centroDeCusto = this.centroDeCusto.filter(cc => linkedCodes.has(cc.ccid));
        afterLoad();
      },
      error: err => { console.error('Erro ao carregar centros vinculados', err); afterLoad(); },
    });
  }

  private podeSelecionarQualquerCentroCusto(): boolean {
    return (this.userStore.item()?.cargosLista ?? []).some(cargo =>
      CARGOS_COM_SELECAO_LIVRE_CC.has(String(cargo).trim().toUpperCase()));
  }
}
