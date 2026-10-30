import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PaginatedResFolhaMotivosHoraExtraDTO, ResCentroDeCustoDTO } from '@/api/relogio';
import { CategoriaHoraExtraAPIService } from '@/app/features/ponto/services/CategoriaHoraExtraAPI.service';
import {
  FolhaHoraExtraAPIService,
  mapFolhaHoraExtraError,
} from '@/app/features/ponto/services/FolhaHoraExtraAPI.service';
import { FuncionariosAPIService } from '@/app/features/ponto/services/FuncionariosAPI.service';
import {
  CategoriaTotalAgregado,
  SEM_CATEGORIA_CODIGO,
  SEM_CATEGORIA_LABEL,
  categoriaLabel,
  somarTotaisPorCategoria,
  totalLabel,
} from '@/app/features/ponto/utils/categoria-he';
import { CategoriaTotaisChartComponent } from '@/app/features/ponto/widgets/categoria-totais-chart/categoria-totais-chart.component';
import { ToastMessageOptions } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-kpi-motivos-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CategoriaTotaisChartComponent,
    DatePickerModule,
    InputTextModule,
    MessagesModule,
    PaginatorModule,
    SelectModule,
    TagModule,
  ],
  templateUrl: './kpi-motivos-page.component.html',
  styleUrls: ['../../styles/ponto-dashboard.css', './kpi-motivos-page.component.css'],
})
export class KpiMotivosPageComponent implements OnInit {
  private readonly folhaService = inject(FolhaHoraExtraAPIService);
  private readonly categoriasService = inject(CategoriaHoraExtraAPIService);
  private readonly funcionariosService = inject(FuncionariosAPIService);

  protected readonly dataRangeFilter = new FormControl<Date[] | null>(null);
  protected readonly centroCustoFilter = new FormControl<number | null>(null);
  protected readonly termoFilter = new FormControl('', { nonNullable: true });
  protected readonly categoriaFilter = new FormControl<string | null>(null);
  protected readonly categoriaNome = categoriaLabel;
  protected readonly totalLabel = totalLabel;

  protected centrosCusto: ResCentroDeCustoDTO[] = [];
  protected categoriaOptions: Array<{ label: string; value: string }> = [
    { label: SEM_CATEGORIA_LABEL, value: SEM_CATEGORIA_CODIGO },
  ];
  protected resposta: PaginatedResFolhaMotivosHoraExtraDTO | null = null;
  protected totaisPeriodo: CategoriaTotalAgregado[] = [];
  protected loading = false;
  protected page = 0;
  protected limit = 10;
  protected messages: ToastMessageOptions[] = [];

  ngOnInit(): void {
    this.funcionariosService.getCentroDeCusto().subscribe({
      next: centros => this.centrosCusto = centros,
      error: err => this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }],
    });
    // incluirInativas=true: folhas antigas podem usar categorias já desativadas.
    this.categoriasService.getTodas().subscribe({
      next: categorias => this.categoriaOptions = [
        { label: SEM_CATEGORIA_LABEL, value: SEM_CATEGORIA_CODIGO },
        ...categorias.map(categoria => ({
          label: categoria.ativo ? categoria.nome : `${categoria.nome} (inativa)`,
          value: categoria.codigo,
        })),
      ],
      error: err => this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }],
    });
    this.carregar();
  }

  protected aplicar(): void {
    this.page = 0;
    this.carregar();
  }

  protected onPageChange(event: PaginatorState): void {
    this.page = event.page ?? 0;
    this.limit = event.rows ?? this.limit;
    this.carregar();
  }

  private carregar(): void {
    const [inicio, fim] = this.dataRangeFilter.value ?? [];
    const termo = this.termoFilter.value.trim();
    this.loading = true;
    this.folhaService.getKpiMotivos({
      dataInicio: inicio ? this.formatDate(inicio) : undefined,
      dataFim: (fim ?? inicio) ? this.formatDate((fim ?? inicio) as Date) : undefined,
      centroCustoCodigo: this.centroCustoFilter.value ?? undefined,
      termo: termo || undefined,
      categoriaCodigo: this.categoriaFilter.value ?? undefined,
      page: this.page,
      limit: this.limit,
    }).subscribe({
      next: resposta => {
        this.resposta = resposta;
        // Agregado das folhas exibidas: soma quantidadeFuncionarios por codigo.
        this.totaisPeriodo = somarTotaisPorCategoria(resposta.data.map(folha => folha.categorias));
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.resposta = null;
        this.totaisPeriodo = [];
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapFolhaHoraExtraError(err) }];
      },
    });
  }

  private formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
