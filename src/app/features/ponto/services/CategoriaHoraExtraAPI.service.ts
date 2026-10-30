import { Injectable } from '@angular/core';
import {
  AtualizarCategoriaHoraExtraDTO,
  CriarCategoriaHoraExtraDTO,
  ResCategoriaHoraExtraDTO,
  categoriaHoraExtraControllerAtualizar,
  categoriaHoraExtraControllerCriar,
  categoriaHoraExtraControllerListar,
} from '@/api/relogio';
import { Observable, from, of, tap } from 'rxjs';
import { extractErrorMessage } from './FolhaHoraExtraAPI.service';

export type CategoriaHoraExtra = ResCategoriaHoraExtraDTO;

/** Catálogo de categorias da folha de HE (cadastro via kubb em `@/api/relogio`). */
@Injectable({ providedIn: 'root' })
export class CategoriaHoraExtraAPIService {
  private ativasCache: CategoriaHoraExtra[] | null = null;

  /** Lista só as categorias ativas, com cache em memória para não recarregar por linha. */
  getAtivas(forceReload = false): Observable<CategoriaHoraExtra[]> {
    if (this.ativasCache && !forceReload) {
      return of(this.ativasCache);
    }
    return from(categoriaHoraExtraControllerListar()).pipe(tap(categorias => this.ativasCache = categorias));
  }

  /** Lista todas, inclusive inativas (tela admin e filtro do KPI de motivos). */
  getTodas(): Observable<CategoriaHoraExtra[]> {
    return from(categoriaHoraExtraControllerListar({ incluirInativas: true }));
  }

  criar(dto: CriarCategoriaHoraExtraDTO): Observable<CategoriaHoraExtra> {
    return from(categoriaHoraExtraControllerCriar(dto)).pipe(tap(() => this.ativasCache = null));
  }

  atualizar(id: string, dto: AtualizarCategoriaHoraExtraDTO): Observable<CategoriaHoraExtra> {
    return from(categoriaHoraExtraControllerAtualizar(id, dto)).pipe(tap(() => this.ativasCache = null));
  }
}

/** Traduz os erros do cadastro (400, 403, 404, 409) para mensagens de tela. */
export function mapCategoriaHoraExtraError(error: unknown): string {
  const status = (error as { response?: { status?: number }; status?: number })?.response?.status
    ?? (error as { status?: number })?.status;
  const mensagem = extractErrorMessage(error);

  if (status === 403) {
    return 'Voce nao tem permissao para gerenciar categorias de hora extra.';
  }
  if (status === 404) {
    return mensagem || 'Categoria de hora extra nao encontrada.';
  }
  if (status === 409) {
    return mensagem || 'Ja existe uma categoria de hora extra com este codigo.';
  }
  return mensagem || 'Nao foi possivel concluir a operacao.';
}
