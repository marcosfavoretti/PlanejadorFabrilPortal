import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { PageLayoutComponent } from '@/app/shared/layouts/page-layout/page-layout.component';
import {
  FuncionarioSucata,
  IndicadoresSucata,
  PesagemSucata,
  PesagemSucataPayload,
  ResumoSucata,
  ReporteSucataResultado,
} from '../../models/sucata.model';
import { SucataIndicatorsComponent } from '../../components/sucata-indicators/sucata-indicators.component';
import { SucataPesagemFormComponent } from '../../components/sucata-pesagem-form/sucata-pesagem-form.component';
import { SucataPesagensListComponent } from '../../components/sucata-pesagens-list/sucata-pesagens-list.component';
import { SucataResumoCardComponent } from '../../components/sucata-resumo-card/sucata-resumo-card.component';
import { Observable, Subscription } from 'rxjs';
import { SucataApiService } from '../../services/sucata-api.service';

function dataLocal(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-sucata-report-page',
  standalone: true,
  imports: [
    CommonModule,
    PageLayoutComponent,
    SucataPesagemFormComponent,
    SucataResumoCardComponent,
    SucataPesagensListComponent,
    SucataIndicatorsComponent,
  ],
  templateUrl: './sucata-report-page.component.html',
  styleUrl: './sucata-report-page.component.css',
})
export class SucataReportPageComponent implements OnInit, OnDestroy {
  @ViewChild(SucataPesagemFormComponent)
  private form?: SucataPesagemFormComponent;
  @ViewChild(SucataPesagensListComponent)
  private lista?: SucataPesagensListComponent;
  private buscaPesagens?: Subscription;
  private buscaIndicadores?: Subscription;
  private readonly api = inject(SucataApiService);
  protected readonly modo = signal<'pendentes' | 'periodo'>('pendentes');
  protected readonly ocupado = signal(false);
  protected readonly avisoFuncionarios = signal('');
  protected readonly mensagem = signal('');
  protected readonly tipo = signal<'gerada' | 'reportada'>('gerada');
  protected readonly agrupamento = signal<'dia' | 'semana' | 'mes' | 'ano'>(
    'mes',
  );
  protected readonly indicadorInicio = signal(
    `${new Date().getFullYear()}-01-01`,
  );
  protected readonly indicadorFim = signal(dataLocal());
  protected readonly hoje = dataLocal();
  protected readonly inicio = signal(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
  );
  protected readonly fim = signal(this.hoje);
  protected readonly pesagens = signal<PesagemSucata[]>([]);
  protected readonly resumo = signal<ResumoSucata | null>(null);
  protected readonly indicadores = signal<IndicadoresSucata | null>(null);
  protected readonly funcionarios = signal<FuncionarioSucata[]>([]);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly salvandoId = signal<number | null>(null);
  protected readonly erro = signal('');

  ngOnDestroy(): void {
    this.buscaPesagens?.unsubscribe();
    this.buscaIndicadores?.unsubscribe();
  }

  ngOnInit(): void {
    this.carregarFuncionarios();
    this.carregarDados();
  }

  protected carregarDados(): void {
    if (
      this.modo() === 'periodo' &&
      (!this.inicio() || !this.fim() || this.inicio() > this.fim())
    ) {
      this.erro.set('A data inicial deve ser anterior ou igual à data final.');
      return;
    }
    this.carregando.set(true);
    this.erro.set('');
    this.buscaPesagens?.unsubscribe();
    this.buscaPesagens = (
      this.modo() === 'pendentes'
        ? this.api.listarPendentes()
        : this.api.listarPesagens(this.inicio(), this.fim())
    ).subscribe({
      next: (items) => this.pesagens.set(items),
      error: (error) => {
        this.erro.set(
          this.mensagemErro(error, 'Não foi possível carregar as pesagens.'),
        );
        this.carregando.set(false);
      },
      complete: () => this.carregando.set(false),
    });
    this.api.obterResumo().subscribe({
      next: (resumo) => this.resumo.set(resumo),
      error: () => this.resumo.set(null),
    });
    this.carregarIndicadores();
  }

  protected carregarIndicadores(): void {
    if (
      !this.indicadorInicio() ||
      !this.indicadorFim() ||
      this.indicadorInicio() > this.indicadorFim()
    ) {
      this.erro.set('Informe um intervalo válido para os indicadores.');
      return;
    }
    this.buscaIndicadores?.unsubscribe();
    this.indicadores.set(null);
    this.buscaIndicadores = this.api
      .obterIndicadores(
        this.agrupamento(),
        this.indicadorInicio(),
        this.indicadorFim(),
        this.tipo(),
      )
      .subscribe({
        next: (items) => this.indicadores.set(items),
        error: (error) => {
          this.indicadores.set(null);
          this.erro.set(
            this.mensagemErro(
              error,
              'Não foi possível carregar os indicadores.',
            ),
          );
        },
      });
  }

  protected reportar(ids: number[]): void {
    if (this.ocupado() || !ids.length) return;
    const itens = this.pesagens().filter(
      (item) => ids.includes(item.id) && !item.reportado,
    );
    const peso = itens.reduce((total, item) => total + item.pesoKg, 0);
    if (
      !itens.length ||
      !window.confirm(
        `Reportar como levados os paletes ${itens.map((item) => item.id).join(', ')}? Total: ${this.formatarPeso(peso)}.`,
      )
    )
      return;
    this.ocupado.set(true);
    this.erro.set('');
    this.mensagem.set('');
    const pedido: Observable<PesagemSucata | ReporteSucataResultado> =
      itens.length === 1
        ? this.api.reportarPesagem(itens[0].id)
        : this.api.reportarPesagens(itens.map((item) => item.id));
    pedido.subscribe({
      next: (resultado) => {
        if ('qtdReportados' in resultado) {
          this.mensagem.set(
            `Reportados: ${resultado.qtdReportados} paletes · ${this.formatarPeso(resultado.totalKg)}.` +
              (resultado.jaReportados.length
                ? ` Já reportados: ${resultado.jaReportados.map((item) => item.id).join(', ')}.`
                : '') +
              (resultado.naoEncontrados.length
                ? ` Não encontrados: ${resultado.naoEncontrados.join(', ')}.`
                : ''),
          );
        } else
          this.mensagem.set(`Palete ${resultado.id} reportado como levado.`);
        this.carregarDados();
      },
      error: (error) => {
        this.erro.set(
          this.mensagemErro(error, 'Não foi possível reportar os paletes.'),
        );
        this.ocupado.set(false);
      },
      complete: () => this.ocupado.set(false),
    });
  }

  protected desfazer(pesagem: PesagemSucata): void {
    if (
      this.ocupado() ||
      !window.confirm(
        `Desfazer o reporte do palete ${pesagem.id}? Ele voltará aos pendentes.`,
      )
    )
      return;
    this.ocupado.set(true);
    this.api.desfazerReporte(pesagem.id).subscribe({
      next: () => {
        this.mensagem.set(`Reporte do palete ${pesagem.id} desfeito.`);
        this.carregarDados();
      },
      error: (error) => {
        this.erro.set(
          this.mensagemErro(error, 'Não foi possível desfazer o reporte.'),
        );
        this.ocupado.set(false);
      },
      complete: () => this.ocupado.set(false),
    });
  }

  protected registrar(payload: PesagemSucataPayload): void {
    this.salvando.set(true);
    this.api.criarPesagem(payload).subscribe({
      next: (item) => {
        this.form?.confirmarRegistro(item);
        this.carregarDados();
      },
      error: (error) => {
        this.form?.exibirResultado(
          this.mensagemErro(error, 'Não foi possível registrar a pesagem.'),
          true,
        );
        this.salvando.set(false);
      },
      complete: () => this.salvando.set(false),
    });
  }

  protected editar(event: {
    id: number;
    payload: Partial<PesagemSucataPayload>;
  }): void {
    if (this.salvandoId() !== null || this.ocupado()) return;
    this.salvandoId.set(event.id);
    this.api.atualizarPesagem(event.id, event.payload).subscribe({
      next: () => {
        if (this.lista) this.lista.editandoId = null;
        this.carregarDados();
      },
      error: (error) => {
        this.erro.set(
          this.mensagemErro(error, 'Não foi possível atualizar a pesagem.'),
        );
        this.salvandoId.set(null);
      },
      complete: () => this.salvandoId.set(null),
    });
  }

  protected excluir(pesagem: PesagemSucata): void {
    if (
      this.ocupado() ||
      pesagem.reportado ||
      !window.confirm(
        `Excluir o palete ${pesagem.id}: ${this.formatarPeso(pesagem.pesoKg)} registrado por ${pesagem.nome}?`,
      )
    )
      return;
    this.ocupado.set(true);
    this.api.excluirPesagem(pesagem.id).subscribe({
      next: () => this.carregarDados(),
      error: (error) => {
        this.erro.set(
          this.mensagemErro(error, 'Não foi possível excluir a pesagem.'),
        );
        this.ocupado.set(false);
      },
      complete: () => this.ocupado.set(false),
    });
  }

  protected setInicio(value: string): void {
    this.inicio.set(value);
  }
  protected setFim(value: string): void {
    this.fim.set(value);
  }
  protected formatarPeso(value?: number): string {
    return value === undefined
      ? '—'
      : `${value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg`;
  }

  private carregarFuncionarios(): void {
    this.api.listarFuncionarios().subscribe({
      next: (funcionarios) => this.funcionarios.set(funcionarios),
      // Cadastro manual continua disponível quando a lista de funcionários estiver indisponível.
      error: () => {
        this.funcionarios.set([]);
        this.avisoFuncionarios.set(
          'Lista de funcionários indisponível — digite o nome manualmente.',
        );
      },
    });
  }

  private mensagemErro(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const detail =
        (error.error as { erro?: string; message?: string } | null)?.erro ??
        (error.error as { message?: string } | null)?.message;
      return detail || fallback;
    }
    return fallback;
  }
}
