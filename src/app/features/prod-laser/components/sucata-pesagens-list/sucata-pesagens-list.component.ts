import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PesagemSucata, PesagemSucataPayload } from '../../models/sucata.model';

@Component({
  selector: 'app-sucata-pesagens-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sucata-pesagens-list.component.html',
  styleUrl: './sucata-pesagens-list.component.css',
})
export class SucataPesagensListComponent {
  @Input() pesagens: PesagemSucata[] = [];
  @Input() carregando = false;
  @Input() salvandoId: number | null = null;
  @Output() atualizar = new EventEmitter<void>();
  @Output() editar = new EventEmitter<{ id: number; payload: Partial<PesagemSucataPayload> }>();
  @Output() excluir = new EventEmitter<PesagemSucata>();
  editandoId: number | null = null;
  nomeEdicao = '';
  pesoEdicao = '';

  iniciarEdicao(pesagem: PesagemSucata): void {
    this.editandoId = pesagem.id;
    this.nomeEdicao = pesagem.nome;
    this.pesoEdicao = String(pesagem.pesoKg).replace('.', ',');
  }

  salvarEdicao(pesagem: PesagemSucata): void {
    const nome = this.nomeEdicao.trim();
    const pesoKg = Number(this.pesoEdicao.trim().replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.'));
    if (!nome || !Number.isFinite(pesoKg) || pesoKg <= 0) return;
    this.editar.emit({ id: pesagem.id, payload: { nome, pesoKg } });
    this.editandoId = null;
  }
}
