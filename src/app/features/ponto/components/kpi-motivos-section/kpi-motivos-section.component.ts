import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PaginatedResFolhaMotivosHoraExtraDTO, ResCentroDeCustoDTO } from '@/api/relogio';
import { CategoriaHoraExtraAPIService } from '@/app/features/ponto/services/CategoriaHoraExtraAPI.service';
import {
  FolhaHoraExtraAPIService,
  mapFolhaHoraExtraError,
} from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import {
  SEM_CATEGORIA_CODIGO,
  SEM_CATEGORIA_LABEL,
  categoriaLabel,
  opcoesFiltroCategoria,
  somarTotaisPorCategoria,
  totalLabel,
} from '@/app/features/ponto/utils/categoria-he';
import { intervaloParaParams } from '@/app/features/ponto/utils/data-iso';
import { CategoriaBarrasComponent } from '@/app/features/ponto/widgets/categoria-barras/categoria-barras.component';
import { Subject, catchError, map, merge, of, switchMap, tap } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { BarraFiltrosComponent } from '../barra-filtros/barra-filtros.component';
import { EstadoVazioErroComponent } from '../estado-vazio-erro/estado-vazio-erro.component';
import { ResumoCardComponent } from '../resumo-card/resumo-card.component';

@Component({
  selector: 'app-kpi-motivos-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BarraFiltrosComponent,
    CategoriaBarrasComponent,
    DatePickerModule,
    EstadoVazioErroComponent,
    InputTextModule,
    PaginatorModule,
    ResumoCardComponent,
    SelectModule,
    SkeletonModule,
    TagModule,
  ],
  templateUrl: './kpi-motivos-section.component.html',
  styleUrls: ['../../styles/ponto-secao.css', './kpi-motivos-section.component.css'],
})
export class KpiMotivosSectionComponent implements OnInit {
  private readonly folhaService = inject(FolhaHoraExtraAPIService);
  private readonly categoriasService = inject(CategoriaHoraExtraAPIService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly consulta$ = new Subject<void>();

  /** Centros de custo carregados uma vez pela lista de folhas. */
  readonly centrosCusto = input<ResCentroDeCustoDTO[]>([]);

  protected readonly dataRangeFilter = new FormControl<Date[] | null>(null);
  protected readonly centroCustoFilter = new FormControl<number | null>(null);
  protected readonly termoFilter = new FormControl('', { nonNullable: true });
  protected readonly setorFilter = new FormControl('', { nonNullable: true });
  protected readonly categoriaFilter = new FormControl<string | null>(null);
  protected readonly categoriaNome = categoriaLabel;
  protected readonly totalLabel = totalLabel;

  protected readonly categoriaOptions = signal<Array<{ label: string; value: string }>>([
    { label: SEM_CATEGORIA_LABEL, value: SEM_CATEGORIA_CODIGO },
  ]);
  protected readonly resposta = signal<PaginatedResFolhaMotivosHoraExtraDTO | null>(null);
  /** Agregado das folhas exibidas: soma quantidadeFuncionarios por código. */
  protected readonly totaisPeriodo = computed(() =>
    somarTotaisPorCategoria((this.resposta()?.data ?? []).map(folha => folha.categorias)));
  protected readonly totalFuncionariosPagina = computed(() =>
    (this.resposta()?.data ?? []).reduce((soma, folha) => soma + folha.totalFuncionarios, 0));
  protected readonly loading = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly limit = signal(10);
  private readonly funcionariosAbertos = new Set<string>();

  ngOnInit(): void {
    // Catálogo com inativas (folhas antigas podem usar categorias desativadas), recarregado quando o cadastro muda.
    merge(of(false), this.categoriasService.catalogoAlterado$.pipe(map(() => true))).pipe(
      switchMap(forcar => this.categoriasService.getTodas(forcar).pipe(catchError(() => of(null)))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(categorias => {
      if (categorias) {
        this.categoriaOptions.set(opcoesFiltroCategoria(categorias));
      }
    });

    // switchMap descarta a resposta de pedidos antigos (page/limit divergentes dos filtros atuais).
    this.consulta$.pipe(
      tap(() => {
        this.loading.set(true);
        this.erro.set(null);
      }),
      switchMap(() => this.folhaService.getKpiMotivos({
        ...intervaloParaParams(this.dataRangeFilter.value),
        centroCustoCodigo: this.centroCustoFilter.value ?? undefined,
        termo: this.termoFilter.value.trim() || undefined,
        setor: this.setorFilter.value.trim() || undefined,
        categoriaCodigo: this.categoriaFilter.value ?? undefined,
        page: this.page(),
        limit: this.limit(),
      }).pipe(
        map(resposta => ({ resposta, erro: null as string | null })),
        catchError(err => of({ resposta: null, erro: mapFolhaHoraExtraError(err) })),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ resposta, erro }) => {
      this.resposta.set(resposta);
      this.erro.set(erro);
      this.loading.set(false);
    });
    this.carregar();
  }

  protected aplicar(): void {
    this.page.set(0);
    this.carregar();
  }

  protected chaveMotivo(folhaId: string, justificativa: string): string {
    return `${folhaId}|${justificativa}`;
  }

  protected funcionariosVisiveis(folhaId: string, justificativa: string): boolean {
    return this.funcionariosAbertos.has(this.chaveMotivo(folhaId, justificativa));
  }

  protected alternarFuncionarios(folhaId: string, justificativa: string): void {
    const chave = this.chaveMotivo(folhaId, justificativa);
    if (!this.funcionariosAbertos.delete(chave)) {
      this.funcionariosAbertos.add(chave);
    }
  }

  protected onPageChange(event: PaginatorState): void {
    this.page.set(event.page ?? 0);
    this.limit.set(event.rows ?? this.limit());
    this.carregar();
  }

  protected carregar(): void {
    this.consulta$.next();
  }
}
