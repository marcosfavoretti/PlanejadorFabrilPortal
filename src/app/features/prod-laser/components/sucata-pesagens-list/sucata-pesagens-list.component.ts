import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FuncionarioSucata,
  PesagemSucata,
  PesagemSucataPayload,
} from '../../models/sucata.model';

@Component({
  selector: 'app-sucata-pesagens-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sucata-pesagens-list.component.html',
  styleUrl: './sucata-pesagens-list.component.css',
})
export class SucataPesagensListComponent implements OnChanges {
  @Input() funcionarios: FuncionarioSucata[] = [];
  @Input() ocupado = false;
  @Input() modo: 'pendentes' | 'periodo' = 'pendentes';
  @Output() reportar = new EventEmitter<number[]>();
  @Output() desfazer = new EventEmitter<PesagemSucata>();
  selecionados = new Set<number>();
  dataEdicao = '';
  erroEdicao = '';
  get bloqueado(): boolean {
    return this.ocupado || this.carregando || this.salvandoId !== null;
  }
  get pendentes(): PesagemSucata[] {
    return this.pesagens.filter((item) => !item.reportado);
  }
  get itensSelecionados(): PesagemSucata[] {
    return this.pendentes.filter((item) => this.selecionados.has(item.id));
  }
  get pesoSelecionado(): number {
    return this.itensSelecionados.reduce((s, i) => s + i.pesoKg, 0);
  }
  get total(): number {
    return this.pesagens.reduce((s, i) => s + i.pesoKg, 0);
  }
  get todosMarcados(): boolean {
    return (
      this.pendentes.length > 0 &&
      this.itensSelecionados.length === this.pendentes.length
    );
  }
  ngOnChanges(): void {
    this.selecionados = new Set(
      [...this.selecionados].filter((id) =>
        this.pendentes.some((item) => item.id === id),
      ),
    );
    if (
      this.editandoId !== null &&
      !this.pendentes.some((item) => item.id === this.editandoId)
    )
      this.editandoId = null;
  }
  alternar(id: number): void {
    if (this.bloqueado) return;
    this.selecionados.has(id)
      ? this.selecionados.delete(id)
      : this.selecionados.add(id);
  }
  alternarTodos(): void {
    this.selecionados = this.todosMarcados
      ? new Set()
      : new Set(this.pendentes.map((item) => item.id));
  }
  reportarSelecionados(): void {
    this.reportar.emit(this.itensSelecionados.map((item) => item.id));
  }

  @Input() pesagens: PesagemSucata[] = [];
  @Input() carregando = false;
  @Input() salvandoId: number | null = null;
  @Output() atualizar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<{
    id: number;
    payload: Partial<PesagemSucataPayload>;
  }>();
  @Output() excluir = new EventEmitter<PesagemSucata>();
  editandoId: number | null = null;
  nomeEdicao = '';
  pesoEdicao = '';

  iniciarEdicao(pesagem: PesagemSucata): void {
    if (this.bloqueado || pesagem.reportado) return;
    this.erroEdicao = '';
    this.dataEdicao = pesagem.dataColeta.replace(' ', 'T').slice(0, 16);
    this.editandoId = pesagem.id;
    this.nomeEdicao = pesagem.nome;
    this.pesoEdicao = String(pesagem.pesoKg).replace('.', ',');
  }

  salvarEdicao(pesagem: PesagemSucata): void {
    const nome = this.nomeEdicao.trim();
    const pesoKg = Number(
      this.pesoEdicao
        .trim()
        .replace(/\.(?=\d{3}(?:\D|$))/g, '')
        .replace(',', '.'),
    );
    if (this.bloqueado) return;
    if (!nome || !Number.isFinite(pesoKg) || pesoKg <= 0 || !this.dataEdicao) {
      this.erroEdicao = 'Informe nome, data e peso válido.';
      return;
    }
    const funcionario = this.funcionarios.find(
      (item) => item.nome.toLocaleLowerCase() === nome.toLocaleLowerCase(),
    );
    this.editar.emit({
      id: pesagem.id,
      payload: {
        nome: funcionario?.nome ?? nome,
        matricula: funcionario?.matricula ?? null,
        pesoKg,
        dataColeta: this.dataEdicao,
      },
    });
  }
}
