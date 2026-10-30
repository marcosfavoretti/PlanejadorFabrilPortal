import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RelatorioSetorDTO, ResCentroDeCustoDTO, ResItemFuncionarioHEDTO, ResRelatorioHoraExtraDTO } from '@/api/relogio';
import {
  FolhaHoraExtraAPIService,
  mapFolhaHoraExtraError,
} from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import { SEM_CATEGORIA_CODIGO, categoriaLabel, codigoFiltroCategoria, totalLabel } from '@/app/features/ponto/utils/categoria-he';
import { intervaloParaParams } from '@/app/features/ponto/utils/data-iso';
import { CategoriaBarrasComponent } from '@/app/features/ponto/widgets/categoria-barras/categoria-barras.component';
import { BarraFiltrosComponent } from '../barra-filtros/barra-filtros.component';
import { EstadoVazioErroComponent } from '../estado-vazio-erro/estado-vazio-erro.component';
import { ResumoCardComponent } from '../resumo-card/resumo-card.component';
import { Subject, catchError, map, of, switchMap, tap } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-relatorio-recursos-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BarraFiltrosComponent,
    CategoriaBarrasComponent,
    DatePickerModule,
    EstadoVazioErroComponent,
    ResumoCardComponent,
    SelectModule,
    SkeletonModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './relatorio-recursos-section.component.html',
  styleUrls: ['../../styles/ponto-secao.css', './relatorio-recursos-section.component.css'],
})
export class RelatorioRecursosSectionComponent implements OnInit {
  private readonly folhaService = inject(FolhaHoraExtraAPIService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly consulta$ = new Subject<void>();

  /** Centros de custo carregados uma vez pela lista de folhas. */
  readonly centrosCusto = input<ResCentroDeCustoDTO[]>([]);

  protected readonly dataRangeFilter = new FormControl<Date[] | null>([new Date(), new Date()]);
  protected readonly centroCustoFilter = new FormControl<number | null>(null);
  protected readonly categoriaFilter = new FormControl<string | null>(null);
  private readonly categoriaSelecionada = toSignal(this.categoriaFilter.valueChanges, { initialValue: null });
  protected readonly categoriaNome = categoriaLabel;
  protected readonly totalLabel = totalLabel;

  protected readonly relatorio = signal<ResRelatorioHoraExtraDTO | null>(null);
  protected readonly loading = signal(false);
  protected readonly erro = signal<string | null>(null);
  private readonly setoresAbertos = new Set<string>();

  ngOnInit(): void {
    // switchMap descarta a resposta de pedidos antigos quando o filtro muda durante a recarga.
    this.consulta$.pipe(
      tap(() => {
        this.loading.set(true);
        this.erro.set(null);
      }),
      switchMap(() => this.folhaService.getRelatorioRecursos({
        ...intervaloParaParams(this.dataRangeFilter.value),
        centroCustoCodigo: this.centroCustoFilter.value ?? undefined,
      }).pipe(
        map(relatorio => ({ relatorio, erro: null as string | null })),
        catchError(err => of({ relatorio: null, erro: mapFolhaHoraExtraError(err) })),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ relatorio, erro }) => {
      this.relatorio.set(relatorio);
      this.erro.set(erro);
      this.loading.set(false);
    });
    this.carregar();
  }

  /** Opções do filtro de categoria no cliente, a partir dos totais globais retornados. */
  protected categoriaOptions(): Array<{ label: string; value: string }> {
    return (this.relatorio()?.totaisPorCategoria ?? []).map(total => ({
      label: totalLabel(total),
      value: total.codigo ?? SEM_CATEGORIA_CODIGO,
    }));
  }

  protected totalFuncionarios(): number {
    return (this.relatorio()?.totaisPorCategoria ?? []).reduce((soma, total) => soma + total.quantidadeFuncionarios, 0);
  }

  /** Categoria com mais funcionários (os totais já vêm ordenados por quantidade). */
  protected categoriaTop(): { nome: string; quantidade: number } | null {
    const top = this.relatorio()?.totaisPorCategoria?.[0];
    return top ? { nome: totalLabel(top), quantidade: top.quantidadeFuncionarios } : null;
  }

  protected chaveSetor(setor: RelatorioSetorDTO): string {
    return `${setor.setor}|${setor.dataContexto}`;
  }

  protected setorAberto(setor: RelatorioSetorDTO): boolean {
    return this.setoresAbertos.has(this.chaveSetor(setor));
  }

  protected alternarSetor(setor: RelatorioSetorDTO): void {
    const chave = this.chaveSetor(setor);
    if (!this.setoresAbertos.delete(chave)) {
      this.setoresAbertos.add(chave);
    }
  }

  protected funcionariosFiltrados(setor: RelatorioSetorDTO): ResItemFuncionarioHEDTO[] {
    const codigo = this.categoriaSelecionada();
    return codigo
      ? setor.funcionarios.filter(funcionario => codigoFiltroCategoria(funcionario.categoria) === codigo)
      : setor.funcionarios;
  }

  protected carregar(): void {
    this.consulta$.next();
  }
}
