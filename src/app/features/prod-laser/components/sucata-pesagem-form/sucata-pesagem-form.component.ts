import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import type { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { FuncionarioSucata, PesagemSucataPayload } from '../../models/sucata.model';

@Component({
  selector: 'app-sucata-pesagem-form',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCompleteModule],
  templateUrl: './sucata-pesagem-form.component.html',
  styleUrl: './sucata-pesagem-form.component.css',
})
export class SucataPesagemFormComponent {
  @Input() funcionarios: FuncionarioSucata[] = [];
  @Input() salvando = false;
  @Output() registrar = new EventEmitter<PesagemSucataPayload>();
  nome: string | FuncionarioSucata = '';
  sugestoes: FuncionarioSucata[] = [];
  peso = '';
  mensagem = '';
  mensagemErro = false;

  enviar(): void {
    const nome = (typeof this.nome === 'string' ? this.nome : this.nome.nome).trim();
    const normalizedWeight = this.peso.trim().replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
    const pesoKg = Number(normalizedWeight);
    if (!nome) return this.setMessage('Informe o nome do funcionário.', true);
    if (!Number.isFinite(pesoKg) || pesoKg <= 0 || pesoKg > 99999) return this.setMessage('Informe um peso válido, maior que zero.', true);
    const funcionario = typeof this.nome === 'string'
      ? this.funcionarios.find((item) => item.nome.toLocaleLowerCase() === nome.toLocaleLowerCase())
      : this.nome;
    this.registrar.emit({ nome: funcionario?.nome ?? nome, matricula: funcionario?.matricula ?? null, pesoKg });
    this.mensagem = '';
  }

  buscarFuncionarios(event: AutoCompleteCompleteEvent): void {
    const termo = event.query.trim().toLocaleLowerCase();
    this.sugestoes = this.funcionarios.filter((item) =>
      item.nome.toLocaleLowerCase().includes(termo) || item.matricula?.toLocaleLowerCase().includes(termo),
    );
  }

  exibirResultado(texto: string, erro = false): void { this.setMessage(texto, erro); }

  private setMessage(texto: string, erro: boolean): void { this.mensagem = texto; this.mensagemErro = erro; }
}
