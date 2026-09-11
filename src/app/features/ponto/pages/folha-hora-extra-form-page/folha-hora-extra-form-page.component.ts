import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SetUserCargoDTOCargoEnum } from '@/api/auth';
import {
  ItemFuncionarioHEDTORefeicaoEnum,
  ItemFuncionarioHEDTOTransporteEnum,
  ResCentroDeCustoDTO,
  ResFuncionarioListagemDTO,
  ResTurnoDTO,
  ResTurnoFuncionarioDTO,
} from '@/api/relogio';
import { UserstoreService } from '@/app/core/user/stores/user-store.service';
import { FuncionariosAPIService } from '@/app/features/ponto/services/FuncionariosAPI.service';
import {
  FolhaHoraExtraAPIService,
  FolhaHoraExtraDetalhe,
  FolhaHoraExtraPayload,
  mapFolhaHoraExtraError,
} from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import type { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { ToastMessageOptions } from 'primeng/api';
import { Subscription } from 'rxjs';

type FuncionarioForm = FormGroup;

const FRETADO_EXIT_TIMES = new Set(['15:48', '17:18', '01:19', '06:00', '07:30']);

@Component({
  selector: 'app-folha-hora-extra-form-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AutoCompleteModule,
    ButtonModule,
    CheckboxModule,
    DatePickerModule,
    InputTextModule,
    MessagesModule,
    SelectModule,
    TooltipModule,
    TextareaModule,
  ],
  templateUrl: './folha-hora-extra-form-page.component.html',
  styleUrls: ['./folha-hora-extra-form-page.component.css'],
})
export class FolhaHoraExtraFormPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly folhaHoraExtraService = inject(FolhaHoraExtraAPIService);
  private readonly funcionariosService = inject(FuncionariosAPIService);
  private readonly userStore = inject(UserstoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected folhaForm = this.fb.group({
    dataContexto: [new Date(), Validators.required],
    centroCustoCodigo: [null as number | null, Validators.required],
    setor: ['', Validators.required],
    funcionarios: this.fb.array<FuncionarioForm>([], [Validators.required, Validators.minLength(1)]),
    observacao: [''],
  });

  protected centrosCusto: ResCentroDeCustoDTO[] = [];
  protected folhaId: string | null = null;
  protected isEditMode = false;
  protected loadingCentrosCusto = false;
  protected saving = false;
  protected messages: ToastMessageOptions[] = [];
  protected funcionarioSuggestions: ResFuncionarioListagemDTO[] = [];
  private loadedFolha: FolhaHoraExtraDetalhe | null = null;
  private readonly funcionarioRuleSubscriptions = new WeakMap<AbstractControl, Subscription>();

  ngOnInit(): void {
    this.folhaId = this.route.snapshot.paramMap.get('idFolha');
    this.isEditMode = !!this.folhaId;
    this.loadCentrosCusto();

    if (this.isEditMode && this.folhaId) {
      this.loadFolha(this.folhaId);
    } else {
      this.addFuncionario();
    }

    this.folhaForm.controls.dataContexto.valueChanges.subscribe(() => {
      this.applyRulesToFuncionarios();
      this.updateTurnoDescriptions();
    });
    this.applyRulesToFuncionarios();
  }

  protected get funcionarios(): FormArray<FuncionarioForm> {
    return this.folhaForm.controls.funcionarios;
  }

  protected addFuncionario(): void {
    const funcionarioGroup = this.fb.group({
      matricula: ['', [Validators.required, this.uniqueMatriculaValidator.bind(this)]],
      nome: ['', Validators.required],
      matriculaBloqueada: [false],
      turnoFuncionario: [null as ResTurnoFuncionarioDTO | null],
      turnoDescricao: [''],
      precisaUber: [false],
      inicioHE: ['', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
      fimHE: ['', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
      marmitex: [false],
      lanche: [false],
      justificativa: ['', Validators.required],
    });

    this.funcionarios.push(funcionarioGroup);
    this.setupFuncionarioRules(funcionarioGroup);
    this.applyRulesToFuncionario(funcionarioGroup);
  }

  protected removeFuncionario(index: number): void {
    this.funcionarioRuleSubscriptions.get(this.funcionarios.at(index))?.unsubscribe();
    this.funcionarios.removeAt(index);
    this.funcionarios.controls.forEach(control => control.controls['matricula'].updateValueAndValidity());
  }

  protected onCentroCustoChange(ccid: number | null): void {
    const centro = this.centrosCusto.find(item => item.ccid === ccid);
    if (centro) {
      this.folhaForm.controls.setor.setValue(centro.setor);
    }
  }

  protected searchFuncionariosByNome(index: number, event: AutoCompleteCompleteEvent): void {
    const centroCustoCodigo = this.folhaForm.controls.centroCustoCodigo.value;
    const query = event.query.trim();

    if (!centroCustoCodigo) {
      this.funcionarioSuggestions = [];
      this.messages = [{ severity: 'warn', summary: 'Atencao', detail: 'Selecione o centro de custo antes de buscar funcionario.' }];
      return;
    }

    if (query.length < 2) {
      this.funcionarioSuggestions = [];
      return;
    }

    this.funcionariosService.getFuncionarios({
      page: 0,
      limit: 10,
      nome: query,
      RA_CC: String(centroCustoCodigo) as unknown as object,
    }).subscribe({
      next: response => this.funcionarioSuggestions = response.data ?? [],
      error: err => this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }],
    });
  }

  protected selectFuncionario(index: number, event: AutoCompleteSelectEvent): void {
    const funcionario = event.value as ResFuncionarioListagemDTO;
    const row = this.funcionarios.at(index);

    row.patchValue({
      matricula: funcionario.matricula,
      nome: funcionario.nome,
      matriculaBloqueada: true,
    });
    row.controls['matricula'].updateValueAndValidity();
    this.loadTurnoFuncionario(row, funcionario.matricula);
  }

  protected clearFuncionario(index: number): void {
    const row = this.funcionarios.at(index);
    row.patchValue({
      matricula: '',
      nome: '',
      matriculaBloqueada: false,
      turnoFuncionario: null,
      turnoDescricao: '',
    });
    row.controls['matricula'].updateValueAndValidity();
  }

  protected buscarFuncionario(index: number): void {
    const row = this.funcionarios.at(index);
    const matricula = String(row.controls['matricula'].value ?? '').trim();
    const nome = String(row.controls['nome'].value ?? '').trim();
    if (!matricula && !nome) {
      return;
    }

    this.funcionariosService.getFuncionarios({
      page: 0,
      limit: 1,
      matricula: matricula || undefined,
      nome: nome || undefined,
      RA_CC: this.folhaForm.controls.centroCustoCodigo.value
        ? String(this.folhaForm.controls.centroCustoCodigo.value) as unknown as object
        : undefined,
    }).subscribe({
      next: response => {
        const funcionario = response.data?.[0];
        if (funcionario) {
          row.patchValue({ matricula: funcionario.matricula, nome: funcionario.nome, matriculaBloqueada: true });
          row.controls['matricula'].updateValueAndValidity();
          this.loadTurnoFuncionario(row, funcionario.matricula);
        }
      },
      error: err => this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }],
    });
  }

  protected totalHE(control: AbstractControl): string {
    const diff = this.totalMinutes(control);
    return `${Math.floor(diff / 60).toString().padStart(2, '0')}:${(diff % 60).toString().padStart(2, '0')}`;
  }

  protected shouldUseFretado(control: AbstractControl): boolean {
    return this.isWeekdayContextDate() && FRETADO_EXIT_TIMES.has(this.normalizeTime(control.get('fimHE')?.value));
  }

  protected transporteLabel(control: AbstractControl): string {
    return this.shouldUseFretado(control) ? 'Fretado' : 'Taxi/Uber';
  }

  private totalMinutes(control: AbstractControl): number {
    const inicio = control.get('inicioHE')?.value;
    const fim = control.get('fimHE')?.value;
    if (!inicio || !fim) {
      return 0;
    }

    const [inicioHora, inicioMinuto] = String(inicio).split(':').map(Number);
    const [fimHora, fimMinuto] = String(fim).split(':').map(Number);
    if ([inicioHora, inicioMinuto, fimHora, fimMinuto].some(Number.isNaN)) {
      return 0;
    }

    let inicioTotal = inicioHora * 60 + inicioMinuto;
    let fimTotal = fimHora * 60 + fimMinuto;
    if (fimTotal < inicioTotal) {
      fimTotal += 24 * 60;
    }

    return Math.max(fimTotal - inicioTotal, 0);
  }

  protected onSubmit(): void {
    if (this.folhaForm.invalid) {
      this.folhaForm.markAllAsTouched();
      this.messages = [{ severity: 'error', summary: 'Erro', detail: 'Verifique os campos obrigatorios da folha.' }];
      return;
    }

    this.saving = true;
    const payload = this.buildPayload();
    const request = this.isEditMode && this.folhaId
      ? this.folhaHoraExtraService.updateFolha(this.folhaId, payload)
      : this.folhaHoraExtraService.createFolha(payload);

    request.subscribe({
      next: folha => this.router.navigate(['/ponto/he/view', folha.id]),
      error: err => {
        this.saving = false;
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
      },
    });
  }

  protected onCancel(): void {
    if (this.isEditMode && this.folhaId) {
      this.router.navigate(['/ponto/he/view', this.folhaId]);
      return;
    }
    this.router.navigate(['/ponto/he']);
  }

  private loadCentrosCusto(): void {
    if (this.isAdmin()) {
      this.loadAllCentrosCusto();
      return;
    }

    const usuarioId = this.userStore.item()?.id;

    if (!usuarioId) {
      this.centrosCusto = [];
      this.folhaForm.controls.centroCustoCodigo.disable();
      this.messages = [{ severity: 'error', summary: 'Erro', detail: 'Usuario logado nao identificado para carregar centros de custo vinculados.' }];
      return;
    }

    this.loadingCentrosCusto = true;
    this.folhaHoraExtraService.getLiderCentroCusto(usuarioId).subscribe({
      next: vinculos => {
        this.centrosCusto = vinculos.map(vinculo => ({
          ccid: vinculo.centroCustoCodigo,
          setor: vinculo.centroCustoDescricao || String(vinculo.centroCustoCodigo),
        }));
        if (this.loadedFolha) {
          this.ensureFolhaCentroCustoOption(this.loadedFolha);
        }
        this.loadingCentrosCusto = false;

        if (!this.centrosCusto.length) {
          this.folhaForm.controls.centroCustoCodigo.disable();
          this.messages = [{ severity: 'warn', summary: 'Atencao', detail: 'Voce nao possui centro de custo vinculado para criar Folha HE.' }];
        }
      },
      error: err => {
        this.loadingCentrosCusto = false;
        this.centrosCusto = [];
        this.folhaForm.controls.centroCustoCodigo.disable();
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
      },
    });
  }

  private loadAllCentrosCusto(): void {
    this.loadingCentrosCusto = true;
    this.funcionariosService.getCentroDeCusto().subscribe({
      next: centros => {
        this.centrosCusto = centros;
        if (this.loadedFolha) {
          this.ensureFolhaCentroCustoOption(this.loadedFolha);
        }
        this.loadingCentrosCusto = false;
      },
      error: err => {
        this.loadingCentrosCusto = false;
        this.centrosCusto = [];
        this.folhaForm.controls.centroCustoCodigo.disable();
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
      },
    });
  }

  private ensureFolhaCentroCustoOption(folha: FolhaHoraExtraDetalhe): void {
    const exists = this.centrosCusto.some(centro => centro.ccid === folha.centroCustoCodigo);
    if (exists) {
      return;
    }

    this.centrosCusto = [
      ...this.centrosCusto,
      {
        ccid: folha.centroCustoCodigo,
        setor: folha.centroCustoDescricao || folha.setor || String(folha.centroCustoCodigo),
      },
    ];
  }

  private loadFolha(id: string): void {
    this.folhaHoraExtraService.getFolhaById(id).subscribe({
      next: folha => this.patchForm(folha),
      error: err => this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }],
    });
  }

  private patchForm(folha: FolhaHoraExtraDetalhe): void {
    this.loadedFolha = folha;
    this.ensureFolhaCentroCustoOption(folha);

    if (!this.isEditableStatus(folha.status)) {
      this.folhaForm.disable();
      this.messages = [{ severity: 'warn', summary: 'Atencao', detail: 'Esta folha nao pode ser editada enquanto esta em aprovacao.' }];
    }

    this.folhaForm.patchValue({
      dataContexto: this.parseBackendDateOnly(folha.dataContexto),
      centroCustoCodigo: folha.centroCustoCodigo,
      setor: folha.setor,
      observacao: folha.observacao ?? '',
    });

    this.funcionarios.clear();
    folha.funcionarios.forEach(funcionario => {
      const transporte = this.normalizeTransporte(funcionario);
      const refeicao = this.normalizeRefeicao(funcionario);
      const funcionarioGroup = this.fb.group({
          matricula: [funcionario.matricula, [Validators.required, this.uniqueMatriculaValidator.bind(this)]],
          nome: [funcionario.nome, Validators.required],
          matriculaBloqueada: [true],
          turnoFuncionario: [null as ResTurnoFuncionarioDTO | null],
          turnoDescricao: [''],
          precisaUber: [
          transporte === ItemFuncionarioHEDTOTransporteEnum.UBER ||
          transporte === ItemFuncionarioHEDTOTransporteEnum.TAXI ||
          transporte === ItemFuncionarioHEDTOTransporteEnum.FRETADO
        ],
        inicioHE: [funcionario.inicioHE, [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
        fimHE: [funcionario.fimHE, [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
        marmitex: [refeicao === ItemFuncionarioHEDTORefeicaoEnum.MARMITEX],
        lanche: [refeicao === ItemFuncionarioHEDTORefeicaoEnum.LANCHE],
        justificativa: [funcionario.justificativa ?? folha.justificativas?.[funcionario.matricula] ?? '', Validators.required],
      });

      this.funcionarios.push(funcionarioGroup);
      this.setupFuncionarioRules(funcionarioGroup);
      this.applyRulesToFuncionario(funcionarioGroup);
      this.loadTurnoFuncionario(funcionarioGroup, funcionario.matricula);
    });

    this.folhaForm.updateValueAndValidity();
  }

  private buildPayload(): FolhaHoraExtraPayload {
    const value = this.folhaForm.getRawValue() as {
      dataContexto: Date | string | null;
      setor: string | null;
      centroCustoCodigo: number | null;
      funcionarios: Array<{
        matricula: string;
        nome: string;
        precisaUber: boolean;
        inicioHE: string;
        fimHE: string;
        marmitex: boolean;
        lanche: boolean;
        justificativa: string;
      }>;
      observacao: string | null;
    };

    const funcionarios = value.funcionarios.map(funcionario => ({
      matricula: String(funcionario.matricula ?? '').trim(),
      nome: String(funcionario.nome ?? '').trim(),
      transporte: this.buildTransporte(funcionario.precisaUber, funcionario.fimHE),
      inicioHE: funcionario.inicioHE,
      fimHE: funcionario.fimHE,
      refeicao: this.buildRefeicao(funcionario.marmitex, funcionario.lanche),
      justificativa: String(funcionario.justificativa ?? '').trim(),
    }));
    const observacao = String(value.observacao ?? '').trim();

    return {
      dataContexto: this.formatDate(value.dataContexto),
      setor: value.setor ?? '',
      centroCustoCodigo: value.centroCustoCodigo ?? 0,
      funcionarios,
      observacao: observacao || undefined,
    };
  }

  private buildTransporte(precisaTransporte: boolean, fimHE: string): ItemFuncionarioHEDTOTransporteEnum {
    if (this.isFretadoTime(fimHE)) {
      return precisaTransporte ? ItemFuncionarioHEDTOTransporteEnum.FRETADO : ItemFuncionarioHEDTOTransporteEnum['N/A'];
    }

    return precisaTransporte ? ItemFuncionarioHEDTOTransporteEnum.UBER : ItemFuncionarioHEDTOTransporteEnum['N/A'];
  }

  private buildRefeicao(marmitex: boolean, lanche: boolean): ItemFuncionarioHEDTORefeicaoEnum {
    if (marmitex) {
      return ItemFuncionarioHEDTORefeicaoEnum.MARMITEX;
    }

    return lanche ? ItemFuncionarioHEDTORefeicaoEnum.LANCHE : ItemFuncionarioHEDTORefeicaoEnum['N/A'];
  }

  private normalizeTransporte(funcionario: FolhaHoraExtraDetalhe['funcionarios'][number]): ItemFuncionarioHEDTOTransporteEnum {
    if (funcionario.transporte) {
      return funcionario.transporte;
    }

    return funcionario.precisaUber ? ItemFuncionarioHEDTOTransporteEnum.UBER : ItemFuncionarioHEDTOTransporteEnum['N/A'];
  }

  private normalizeRefeicao(funcionario: FolhaHoraExtraDetalhe['funcionarios'][number]): ItemFuncionarioHEDTORefeicaoEnum {
    if (funcionario.refeicao) {
      return funcionario.refeicao;
    }

    if (funcionario.marmitex) {
      return ItemFuncionarioHEDTORefeicaoEnum.MARMITEX;
    }

    return funcionario.lanche ? ItemFuncionarioHEDTORefeicaoEnum.LANCHE : ItemFuncionarioHEDTORefeicaoEnum['N/A'];
  }

  private formatDate(date: Date | string | null): string {
    if (!date) {
      return '';
    }

    if (typeof date === 'string') {
      return date.slice(0, 10);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseBackendDateOnly(value: string): Date {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private setupFuncionarioRules(control: AbstractControl): void {
    if (this.funcionarioRuleSubscriptions.has(control)) {
      return;
    }

    const subscription = new Subscription();
    const inicioHEControl = control.get('inicioHE');
    const fimHEControl = control.get('fimHE');

    if (inicioHEControl) {
      subscription.add(inicioHEControl.valueChanges.subscribe(() => this.applyRulesToFuncionario(control)));
    }

    if (fimHEControl) {
      subscription.add(fimHEControl.valueChanges.subscribe(() => this.applyRulesToFuncionario(control)));
    }

    this.funcionarioRuleSubscriptions.set(control, subscription);
  }

  private applyRulesToFuncionarios(): void {
    this.funcionarios.controls.forEach(control => this.applyRulesToFuncionario(control));
  }

  private updateTurnoDescriptions(): void {
    this.funcionarios.controls.forEach(control => {
      const turnoFuncionario = control.get('turnoFuncionario')?.value as ResTurnoFuncionarioDTO | null;
      this.setTurnoDescription(control, turnoFuncionario);
    });
  }

  private applyRulesToFuncionario(control: AbstractControl): void {
    const totalMinutes = this.totalMinutes(control);
    this.setBooleanControl(control, 'marmitex', totalMinutes > 6 * 60);
    this.setBooleanControl(control, 'lanche', totalMinutes > 2 * 60 && totalMinutes < 6 * 60);

    const precisaUberControl = control.get('precisaUber');
    if (!precisaUberControl) {
      return;
    }

    if (this.folhaForm.enabled && precisaUberControl.disabled) {
      precisaUberControl.enable({ emitEvent: false });
    }
  }

  private setBooleanControl(control: AbstractControl, controlName: string, value: boolean): void {
    const childControl = control.get(controlName);
    if (childControl?.value !== value) {
      childControl?.setValue(value, { emitEvent: false });
    }
  }

  private loadTurnoFuncionario(control: AbstractControl, matricula: string | null | undefined): void {
    const matriculaValue = String(matricula ?? '').trim();
    if (!matriculaValue) {
      control.patchValue({ turnoFuncionario: null, turnoDescricao: '' }, { emitEvent: false });
      return;
    }

    control.get('turnoDescricao')?.setValue('Carregando turno...', { emitEvent: false });
    this.funcionariosService.getTurnoFuncionario(matriculaValue).subscribe({
      next: turnoFuncionario => {
        control.get('turnoFuncionario')?.setValue(turnoFuncionario, { emitEvent: false });
        this.setTurnoDescription(control, turnoFuncionario);
      },
      error: () => {
        control.patchValue({ turnoFuncionario: null, turnoDescricao: 'Turno nao localizado' }, { emitEvent: false });
      },
    });
  }

  private setTurnoDescription(control: AbstractControl, turnoFuncionario: ResTurnoFuncionarioDTO | null): void {
    control.get('turnoDescricao')?.setValue(this.formatTurnoFuncionario(turnoFuncionario), { emitEvent: false });
  }

  private formatTurnoFuncionario(turnoFuncionario: ResTurnoFuncionarioDTO | null): string {
    if (!turnoFuncionario) {
      return '';
    }

    const turnoDoDia = this.findTurnoForContextDate(turnoFuncionario.turnos ?? []);
    if (!turnoDoDia) {
      return `Turno ${turnoFuncionario.codigoTurno}`;
    }

    const periodos = [
      this.formatPeriodo(turnoDoDia.entrada1, turnoDoDia.saida1),
      this.formatPeriodo(turnoDoDia.entrada2, turnoDoDia.saida2),
    ].filter(Boolean);
    const horarios = periodos.length ? periodos.join(' / ') : 'Horario nao informado';
    const totalHoras = Number.isFinite(turnoDoDia.totalHorasDia) ? ` | ${turnoDoDia.totalHorasDia}h` : '';

    return `Turno ${turnoFuncionario.codigoTurno} | ${turnoDoDia.diaSemana}: ${horarios}${totalHoras}`;
  }

  private findTurnoForContextDate(turnos: ResTurnoDTO[]): ResTurnoDTO | null {
    const contextDate = this.getContextDate();
    if (!contextDate) {
      return turnos[0] ?? null;
    }

    const targetDay = this.normalizeWeekday(contextDate.getDay());
    return turnos.find(turno => this.normalizeText(turno.diaSemana).includes(targetDay)) ?? turnos[0] ?? null;
  }

  private formatPeriodo(entrada: string | null | undefined, saida: string | null | undefined): string {
    const inicio = this.normalizeTime(entrada);
    const fim = this.normalizeTime(saida);
    return inicio && fim ? `${inicio}-${fim}` : '';
  }

  private normalizeWeekday(day: number): string {
    return ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][day] ?? '';
  }

  private normalizeText(value: string | null | undefined): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private isWeekdayContextDate(): boolean {
    const date = this.getContextDate();
    if (!date) {
      return false;
    }

    const day = date.getDay();
    return day >= 1 && day <= 5;
  }

  private getContextDate(): Date | null {
    const value = this.folhaForm.controls.dataContexto.value;
    if (!value) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private normalizeTime(value: unknown): string {
    const [hour = '', minute = ''] = String(value ?? '').split(':');
    if (!hour || !minute) {
      return '';
    }

    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  private isFretadoTime(value: unknown): boolean {
    return this.isWeekdayContextDate() && FRETADO_EXIT_TIMES.has(this.normalizeTime(value));
  }

  private isHoliday(date: Date): boolean {
    const year = date.getFullYear();
    const monthDay = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const fixedHolidays = new Set(['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25']);
    if (fixedHolidays.has(monthDay)) {
      return true;
    }

    const easter = this.getEasterDate(year);
    const movableHolidayOffsets = [-48, -47, -2, 60];
    return movableHolidayOffsets.some(offset => this.isSameDate(date, this.addDays(easter, offset)));
  }

  private getEasterDate(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  private addDays(date: Date, days: number): Date {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private isSameDate(left: Date, right: Date): boolean {
    return left.getFullYear() === right.getFullYear()
      && left.getMonth() === right.getMonth()
      && left.getDate() === right.getDate();
  }

  private uniqueMatriculaValidator(control: AbstractControl): ValidationErrors | null {
    if (!this.funcionarios) {
      return null;
    }

    const matricula = String(control.value ?? '').trim();
    if (!matricula) {
      return null;
    }

    const duplicated = this.funcionarios.controls
      .filter(row => row.controls['matricula'] !== control)
      .some(row => String(row.controls['matricula'].value ?? '').trim() === matricula);

    return duplicated ? { duplicated: true } : null;
  }

  private isAdmin(): boolean {
    return this.userStore.item()?.cargosLista?.includes(SetUserCargoDTOCargoEnum.ADMIN) ?? false;
  }

  private isEditableStatus(status: string | null | undefined): boolean {
    const normalizedStatus = String(status ?? '').trim().toUpperCase();
    return ['RASCUNHO', 'REJEITADO', 'REJEITADO_COORDENACAO', 'REJEITADO_DIRETORIA'].includes(normalizedStatus);
  }
}
