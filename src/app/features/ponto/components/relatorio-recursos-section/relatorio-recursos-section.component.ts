import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RelatorioSetorDTO, ResCentroDeCustoDTO, ResItemFuncionarioHEDTO, ResRelatorioHoraExtraDTO } from '@/api/relogio';
import {
  FolhaHoraExtraAPIService,
  mapFolhaHoraExtraError,
} from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import { FuncionariosAPIService } from '@/app/features/ponto/services/FuncionariosAPI.service';
import { SEM_CATEGORIA_CODIGO, categoriaLabel, codigoFiltroCategoria, totalLabel } from '@/app/features/ponto/utils/categoria-he';
import { CategoriaBarrasComponent } from '@/app/features/ponto/widgets/categoria-barras/categoria-barras.component';
import { CategoriaTotaisChartComponent } from '@/app/features/ponto/widgets/categoria-totais-chart/categoria-totais-chart.component';
import { ToastMessageOptions } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MessagesModule } from 'primeng/messages';
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
    ButtonModule,
    CategoriaBarrasComponent,
    CategoriaTotaisChartComponent,
    DatePickerModule,
    MessagesModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './relatorio-recursos-section.component.html',
  styleUrls: ['../../styles/ponto-dashboard.css', './relatorio-recursos-section.component.css'],
})
export class RelatorioRecursosSectionComponent implements OnInit {
  private readonly folhaService = inject(FolhaHoraExtraAPIService);
  private readonly funcionariosService = inject(FuncionariosAPIService);

  protected readonly dataRangeFilter = new FormControl<Date[] | null>([new Date(), new Date()]);
  protected readonly centroCustoFilter = new FormControl<number | null>(null);
  protected readonly categoriaFilter = new FormControl<string | null>(null);
  protected readonly categoriaNome = categoriaLabel;

  protected centrosCusto: ResCentroDeCustoDTO[] = [];
  protected relatorio: ResRelatorioHoraExtraDTO | null = null;
  protected loading = false;
  protected messages: ToastMessageOptions[] = [];
  protected erro: string | null = null;
  private readonly setoresAbertos = new Set<string>();

  ngOnInit(): void {
    this.funcionariosService.getCentroDeCusto().subscribe({
      next: centros => this.centrosCusto = centros,
      error: err => this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }],
    });
    this.carregar();
  }

  /** Opções do filtro de categoria no cliente, a partir dos totais globais retornados. */
  protected get categoriaOptions(): Array<{ label: string; value: string }> {
    return (this.relatorio?.totaisPorCategoria ?? []).map(total => ({
      label: totalLabel(total),
      value: total.codigo ?? SEM_CATEGORIA_CODIGO,
    }));
  }

  protected get totalFuncionarios(): number {
    return (this.relatorio?.totaisPorCategoria ?? []).reduce((soma, total) => soma + total.quantidadeFuncionarios, 0);
  }

  /** Categoria com mais funcionários (os totais já vêm ordenados por quantidade). */
  protected get categoriaTop(): { nome: string; quantidade: number } | null {
    const top = this.relatorio?.totaisPorCategoria?.[0];
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
    const codigo = this.categoriaFilter.value;
    return codigo
      ? setor.funcionarios.filter(funcionario => codigoFiltroCategoria(funcionario.categoria) === codigo)
      : setor.funcionarios;
  }

  protected carregar(): void {
    const [inicio, fim] = this.dataRangeFilter.value ?? [];
    this.loading = true;
    this.erro = null;
    this.folhaService.getRelatorioRecursos({
      dataInicio: inicio ? this.formatDate(inicio) : undefined,
      dataFim: (fim ?? inicio) ? this.formatDate((fim ?? inicio) as Date) : undefined,
      centroCustoCodigo: this.centroCustoFilter.value ?? undefined,
    }).subscribe({
      next: relatorio => {
        this.relatorio = relatorio;
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.relatorio = null;
        this.erro = mapFolhaHoraExtraError(err);
      },
    });
  }

  private formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
