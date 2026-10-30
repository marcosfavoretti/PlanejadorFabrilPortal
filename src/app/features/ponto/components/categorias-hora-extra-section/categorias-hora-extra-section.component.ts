import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CriarCategoriaHoraExtraDTO } from '@/api/relogio';
import {
  CategoriaHoraExtra,
  CategoriaHoraExtraAPIService,
  mapCategoriaHoraExtraError,
} from '@/app/features/ponto/services/CategoriaHoraExtraAPI.service';
import { sugerirOrdemCategoria } from '@/app/features/ponto/utils/categoria-he';
import { ToastMessageOptions } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

/** Mesmo padrão do backend para o código (imutável após a criação). */
export const CODIGO_CATEGORIA_PATTERN = /^[A-Z0-9_]{2,40}$/;

@Component({
  selector: 'app-categorias-hora-extra-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MessagesModule,
    TableModule,
    TagModule,
    TextareaModule,
  ],
  templateUrl: './categorias-hora-extra-section.component.html',
  styleUrls: ['../../styles/ponto-dashboard.css', './categorias-hora-extra-section.component.css'],
})
export class CategoriasHoraExtraSectionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoriasService = inject(CategoriaHoraExtraAPIService);

  protected categorias: CategoriaHoraExtra[] = [];
  protected loading = false;
  protected saving = false;
  protected dialogVisible = false;
  protected editando: CategoriaHoraExtra | null = null;
  protected messages: ToastMessageOptions[] = [];
  protected dialogMessages: ToastMessageOptions[] = [];

  protected readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.pattern(CODIGO_CATEGORIA_PATTERN)]],
    nome: ['', [Validators.required, Validators.maxLength(80)]],
    descricao: ['', Validators.maxLength(300)],
    exigeDetalhe: [false],
    ordem: [1, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.carregar();
  }

  protected abrirCriacao(): void {
    this.editando = null;
    this.dialogMessages = [];
    this.form.reset({
      codigo: '',
      nome: '',
      descricao: '',
      exigeDetalhe: false,
      ordem: sugerirOrdemCategoria(this.categorias),
    });
    this.form.controls.codigo.enable();
    this.dialogVisible = true;
  }

  protected abrirEdicao(categoria: CategoriaHoraExtra): void {
    this.editando = categoria;
    this.dialogMessages = [];
    this.form.reset({
      codigo: categoria.codigo,
      nome: categoria.nome,
      descricao: categoria.descricao ?? '',
      exigeDetalhe: categoria.exigeDetalhe,
      ordem: categoria.ordem,
    });
    // O código é imutável: somente leitura na edição.
    this.form.controls.codigo.disable();
    this.dialogVisible = true;
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const descricao = value.descricao.trim();
    this.saving = true;
    this.dialogMessages = [];

    const request = this.editando
      ? this.categoriasService.atualizar(this.editando.id, {
          nome: value.nome.trim(),
          descricao,
          exigeDetalhe: value.exigeDetalhe,
          ordem: value.ordem,
        })
      : this.categoriasService.criar({
          codigo: value.codigo.trim(),
          nome: value.nome.trim(),
          descricao: descricao || undefined,
          exigeDetalhe: value.exigeDetalhe,
          ordem: value.ordem,
        } satisfies CriarCategoriaHoraExtraDTO);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.dialogVisible = false;
        this.messages = [{ severity: 'success', summary: 'Sucesso', detail: 'Categoria salva.' }];
        this.carregar();
      },
      error: err => {
        this.saving = false;
        this.dialogMessages = [{ severity: 'error', summary: 'Erro', detail: mapCategoriaHoraExtraError(err) }];
      },
    });
  }

  protected alternarAtivo(categoria: CategoriaHoraExtra): void {
    this.categoriasService.atualizar(categoria.id, { ativo: !categoria.ativo }).subscribe({
      next: () => {
        this.messages = [{
          severity: 'success',
          summary: 'Sucesso',
          detail: categoria.ativo ? 'Categoria desativada.' : 'Categoria ativada.',
        }];
        this.carregar();
      },
      error: err => this.messages = [{ severity: 'error', summary: 'Erro', detail: mapCategoriaHoraExtraError(err) }],
    });
  }

  private carregar(): void {
    this.loading = true;
    this.categoriasService.getTodas().subscribe({
      next: categorias => {
        this.categorias = categorias;
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.messages = [{ severity: 'error', summary: 'Erro', detail: mapCategoriaHoraExtraError(err) }];
      },
    });
  }
}
