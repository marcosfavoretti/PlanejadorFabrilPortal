import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { PageLayoutComponent } from '@/app/shared/layouts/page-layout/page-layout.component';
import { FuncionarioSucata, IndicadoresSucata, PesagemSucata, PesagemSucataPayload, ResumoSucata } from '../../models/sucata.model';
import { SucataIndicatorsComponent } from '../../components/sucata-indicators/sucata-indicators.component';
import { SucataPesagemFormComponent } from '../../components/sucata-pesagem-form/sucata-pesagem-form.component';
import { SucataPesagensListComponent } from '../../components/sucata-pesagens-list/sucata-pesagens-list.component';
import { SucataResumoCardComponent } from '../../components/sucata-resumo-card/sucata-resumo-card.component';
import { SucataApiService } from '../../services/sucata-api.service';

function dataLocal(date = new Date()): string {
  const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-sucata-report-page',
  standalone: true,
  imports: [CommonModule, PageLayoutComponent, SucataPesagemFormComponent, SucataResumoCardComponent, SucataPesagensListComponent, SucataIndicatorsComponent],
  templateUrl: './sucata-report-page.component.html',
  styleUrl: './sucata-report-page.component.css',
})
export class SucataReportPageComponent implements OnInit {
  @ViewChild(SucataPesagemFormComponent) private form?: SucataPesagemFormComponent;
  private readonly api = inject(SucataApiService);
  protected readonly hoje = dataLocal();
  protected readonly inicio = signal(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
  protected readonly fim = signal(this.hoje);
  protected readonly pesagens = signal<PesagemSucata[]>([]);
  protected readonly resumo = signal<ResumoSucata | null>(null);
  protected readonly indicadores = signal<IndicadoresSucata | null>(null);
  protected readonly funcionarios = signal<FuncionarioSucata[]>([]);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly salvandoId = signal<number | null>(null);
  protected readonly erro = signal('');

  ngOnInit(): void {
    this.carregarFuncionarios();
    this.carregarDados();
  }

  protected carregarDados(): void {
    if (this.inicio() > this.fim()) { this.erro.set('A data inicial deve ser anterior ou igual à data final.'); return; }
    this.carregando.set(true); this.erro.set('');
    this.api.listarPesagens(this.inicio(), this.fim()).subscribe({
      next: (items) => this.pesagens.set(items),
      error: (error) => { this.erro.set(this.mensagemErro(error, 'Não foi possível carregar as pesagens.')); this.carregando.set(false); },
      complete: () => this.carregando.set(false),
    });
    this.api.obterResumo().subscribe({ next: (resumo) => this.resumo.set(resumo), error: () => this.resumo.set(null) });
    this.api.obterIndicadores('dia', this.inicio(), this.fim()).subscribe({ next: (items) => this.indicadores.set(items), error: (error) => { this.indicadores.set(null); this.erro.set(this.mensagemErro(error, 'Não foi possível carregar os indicadores.')); } });
  }

  protected registrar(payload: PesagemSucataPayload): void {
    this.salvando.set(true);
    this.api.criarPesagem(payload).subscribe({
      next: (item) => { this.form?.exibirResultado(`Pesagem registrada: ${item.pesoKg.toLocaleString('pt-BR')} kg para ${item.nome}.`); this.carregarDados(); },
      error: (error) => { this.form?.exibirResultado(this.mensagemErro(error, 'Não foi possível registrar a pesagem.'), true); this.salvando.set(false); },
      complete: () => this.salvando.set(false),
    });
  }

  protected editar(event: { id: number; payload: Partial<PesagemSucataPayload> }): void {
    this.salvandoId.set(event.id);
    this.api.atualizarPesagem(event.id, event.payload).subscribe({
      next: () => this.carregarDados(),
      error: (error) => { this.erro.set(this.mensagemErro(error, 'Não foi possível atualizar a pesagem.')); this.salvandoId.set(null); },
      complete: () => this.salvandoId.set(null),
    });
  }

  protected excluir(pesagem: PesagemSucata): void {
    if (!window.confirm(`Excluir a pesagem de ${pesagem.pesoKg.toLocaleString('pt-BR')} kg registrada por ${pesagem.nome}?`)) return;
    this.api.excluirPesagem(pesagem.id).subscribe({ next: () => this.carregarDados(), error: (error) => this.erro.set(this.mensagemErro(error, 'Não foi possível excluir a pesagem.')) });
  }

  protected setInicio(value: string): void { this.inicio.set(value); }
  protected setFim(value: string): void { this.fim.set(value); }
  protected formatarPeso(value?: number): string { return value === undefined ? '—' : `${value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg`; }

  private carregarFuncionarios(): void {
    this.api.listarFuncionarios().subscribe({
      next: (funcionarios) => this.funcionarios.set(funcionarios),
      // Cadastro manual continua disponível quando a lista de funcionários estiver indisponível.
      error: () => this.funcionarios.set([]),
    });
  }

  private mensagemErro(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const detail = (error.error as { erro?: string; message?: string } | null)?.erro ?? (error.error as { message?: string } | null)?.message;
      return detail || fallback;
    }
    return fallback;
  }
}
