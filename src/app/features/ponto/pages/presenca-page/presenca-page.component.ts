import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { tap } from 'rxjs/operators';

import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent } from 'primeng/table';

import { TableDynamicComponent } from '@/app/shared/components/table-dynamic/table-dynamic.component';
import { TableModel } from '@/app/shared/components/table-dynamic/table.model';
import { FuncionariosAPIService } from '@/app/features/ponto/services/FuncionariosAPI.service';
import { FolhaHoraExtraAPIService } from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import {
  FuncionarioControllerConsultarPresencaFuncionariosQueryParamsStatusEnum,
  ResCentroDeCustoDTO,
  ResPresencaFuncionarioDTO,
  ResPresencaFuncionarioDTOStatusEnum,
} from '@/api/relogio';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';

const CARGOS_COM_SELECAO_LIVRE_CC = new Set<string>([
  SetUserCargoDTOCargoEnum.ADMIN,
  SetUserCargoDTOCargoEnum.RH,
  SetUserCargoDTOCargoEnum.DIRETOR,
]);

@Component({
  selector: 'app-presenca-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SelectModule, TableDynamicComponent],
  templateUrl: './presenca-page.component.html',
  styleUrl: './presenca-page.component.css',
})
export class PresencaPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly funcionariosAPIService = inject(FuncionariosAPIService);
  private readonly folhaHoraExtraService = inject(FolhaHoraExtraAPIService);
  private readonly userStore = inject(UserstoreService);

  protected readonly presencas = signal<ResPresencaFuncionarioDTO[]>([]);
  protected readonly presencaTotalItems = signal(0);
  protected readonly filterContextReady = signal(false);
  protected readonly centroCustoSelectorDisabled = computed(() => !this.podeSelecionarQualquerCentroCusto());

  protected readonly presencaFilterForm = this.fb.group({
    status: this.fb.control<FuncionarioControllerConsultarPresencaFuncionariosQueryParamsStatusEnum | null>(
      FuncionarioControllerConsultarPresencaFuncionariosQueryParamsStatusEnum.NAO_PRESENTE,
    ),
    nome: [''],
    matricula: [''],
    centroCustoCodigo: this.fb.control<number | null>(null),
  });

  protected readonly presencaStatusOptions = [
    { label: 'Presente', value: FuncionarioControllerConsultarPresencaFuncionariosQueryParamsStatusEnum.PRESENTE },
    { label: 'Não presente', value: FuncionarioControllerConsultarPresencaFuncionariosQueryParamsStatusEnum.NAO_PRESENTE },
    { label: 'Fora do turno', value: FuncionarioControllerConsultarPresencaFuncionariosQueryParamsStatusEnum.FORA_DO_TURNO },
    { label: 'Férias', value: FuncionarioControllerConsultarPresencaFuncionariosQueryParamsStatusEnum.FERIAS },
    { label: 'Afastado', value: FuncionarioControllerConsultarPresencaFuncionariosQueryParamsStatusEnum.AFASTADO },
  ];

  protected readonly presencaTableModel: TableModel = {
    title: 'Presença dos funcionários',
    subtitle: 'Situação atual calculada pela última marcação válida e pelo turno do dia',
    paginator: true,
    totalize: false,
    dataKey: 'matricula',
    columns: [
      { alias: 'Matrícula', field: 'matricula', filterable: false, sortable: false },
      { alias: 'Funcionário', field: 'nome', filterable: false, sortable: false },
      { alias: 'Setor', field: 'setor', filterable: false, sortable: false },
      {
        alias: 'Turno base', field: 'turnoBase', filterable: false, sortable: false,
        valueFormatter: (_: string, row: ResPresencaFuncionarioDTO) =>
          row.entradaTurnoBase && row.saidaTurnoBase
            ? `${row.entradaTurnoBase} - ${row.saidaTurnoBase}`
            : row.turnoBase || '-',
      },
      {
        alias: 'Situação', field: 'status', isTag: true, filterable: false, sortable: false,
        tagLabelFn: value => this.getPresencaStatusLabel(value as ResPresencaFuncionarioDTOStatusEnum),
        tagSeverityFn: value => this.getPresencaStatusSeverity(value as ResPresencaFuncionarioDTOStatusEnum),
      },
    ],
  };

  protected centroDeCusto: ResCentroDeCustoDTO[] = [];
  protected presencaFirst = 0;
  protected presencaPageSize = 10;
  protected fetching = false;
  private centroCustoCodigosVinculados: number[] = [];

  constructor() {
    effect(() => {
      this.centroCustoSelectorDisabled();
      this.syncCentroCustoControlState();
    });
  }

  ngOnInit(): void {
    this.syncCentroCustoControlState();
    this.laodCentroDeCusto().subscribe({
      next: () => {
        this.applyLoggedUserCentroCustoScope(() => {
          this.filterContextReady.set(true);
          this.loadPresencas();
        });
      },
      error: err => console.error('Erro ao carregar centros de custo', err),
    });
  }

  protected onPresencaLazyLoad(event: TableLazyLoadEvent): void {
    this.presencaFirst = event.first ?? 0;
    this.presencaPageSize = event.rows ?? this.presencaPageSize;
    this.loadPresencas();
  }

  protected applyPresencaFilters(): void {
    this.presencaFirst = 0;
    this.loadPresencas();
  }

  protected clearPresencaFilters(): void {
    this.presencaFilterForm.reset({
      status: FuncionarioControllerConsultarPresencaFuncionariosQueryParamsStatusEnum.NAO_PRESENTE,
      nome: '', matricula: '', centroCustoCodigo: null,
    });
    this.applyPresencaFilters();
  }

  private applyLoggedUserCentroCustoScope(afterLoad: () => void): void {
    if (this.podeSelecionarQualquerCentroCusto()) {
      this.centroCustoCodigosVinculados = [];
      this.presencaFilterForm.patchValue({ centroCustoCodigo: null });
      this.syncCentroCustoControlState();
      afterLoad();
      return;
    }

    const usuarioId = this.userStore.item()?.id;
    if (!usuarioId) { afterLoad(); return; }

    this.folhaHoraExtraService.getLiderCentroCusto(usuarioId).subscribe({
      next: vinculos => {
        const linkedCodes = new Set(vinculos.map(vinculo => vinculo.centroCustoCodigo));
        const targets = this.centroDeCusto.filter(cc => linkedCodes.has(cc.ccid));
        this.centroCustoCodigosVinculados = [...linkedCodes];
        this.centroDeCusto = targets;
        this.presencaFilterForm.patchValue({ centroCustoCodigo: null });
        this.syncCentroCustoControlState();
        afterLoad();
      },
      error: err => { console.error('Erro ao carregar centros vinculados', err); afterLoad(); },
    });
  }

  private loadPresencas(): void {
    const filter = this.presencaFilterForm.getRawValue();
    const podeSelecionarQualquerCC = this.podeSelecionarQualquerCentroCusto();
    if (!podeSelecionarQualquerCC && !this.centroCustoCodigosVinculados.length) {
      this.presencas.set([]);
      this.presencaTotalItems.set(0);
      return;
    }

    const centroCustoCodigo = podeSelecionarQualquerCC
      ? filter.centroCustoCodigo ? String(filter.centroCustoCodigo) : undefined
      : this.centroCustoCodigosVinculados.join(',');
    this.fetching = true;
    this.funcionariosAPIService.getPresencaFuncionarios({
      page: Math.floor(this.presencaFirst / this.presencaPageSize),
      limit: this.presencaPageSize,
      status: filter.status ?? undefined,
      nome: filter.nome?.trim() || undefined,
      matricula: filter.matricula?.trim() || undefined,
      centroCustoCodigo: centroCustoCodigo as unknown as object | undefined,
    }).subscribe({
      next: response => { this.presencas.set(response.data ?? []); this.presencaTotalItems.set(response.total ?? 0); this.fetching = false; },
      error: err => { console.error('Erro ao consultar presença dos funcionários', err); this.presencas.set([]); this.presencaTotalItems.set(0); this.fetching = false; },
    });
  }

  private laodCentroDeCusto() {
    return this.funcionariosAPIService.getCentroDeCusto().pipe(tap(res => this.centroDeCusto = res));
  }

  private podeSelecionarQualquerCentroCusto(): boolean {
    return (this.userStore.item()?.cargosLista ?? []).some(cargo =>
      CARGOS_COM_SELECAO_LIVRE_CC.has(String(cargo).trim().toUpperCase()));
  }

  private syncCentroCustoControlState(): void {
    const control = this.presencaFilterForm.controls.centroCustoCodigo;
    if (this.podeSelecionarQualquerCentroCusto()) {
      control.enable({ emitEvent: false });
      return;
    }

    control.disable({ emitEvent: false });
  }

  private getPresencaStatusLabel(status: ResPresencaFuncionarioDTOStatusEnum): string {
    const labels: Record<string, string> = { PRESENTE: 'Presente', NAO_PRESENTE: 'Não presente', FORA_DO_TURNO: 'Fora do turno', FERIAS: 'Férias', AFASTADO: 'Afastado' };
    return labels[status] ?? 'Não informado';
  }

  private getPresencaStatusSeverity(status: ResPresencaFuncionarioDTOStatusEnum): 'success' | 'danger' | 'warn' {
    return status === ResPresencaFuncionarioDTOStatusEnum.PRESENTE ? 'success'
      : status === ResPresencaFuncionarioDTOStatusEnum.NAO_PRESENTE ? 'danger' : 'warn';
  }
}
