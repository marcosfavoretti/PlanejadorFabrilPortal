import { Injectable } from '@angular/core';
import {
  AtualizarCategoriaHoraExtraDTO,
  CriarCategoriaHoraExtraDTO,
  ResCategoriaHoraExtraDTO,
  categoriaHoraExtraControllerAtualizar,
  categoriaHoraExtraControllerCriar,
  categoriaHoraExtraControllerListar,
} from '@/api/relogio';
import { Observable, Subject, from, of, tap } from 'rxjs';
import { extractErrorMessage, extractErrorStatus } from '../utils/error-message';

export type CategoriaHoraExtra = ResCategoriaHoraExtraDTO;

/** Catálogo de categorias da folha de HE (cadastro via kubb em `@/api/relogio`). */
@Injectable({ providedIn: 'root' })
export class CategoriaHoraExtraAPIService {
  private ativasCache: CategoriaHoraExtra[] | null = null;
  private todasCache: CategoriaHoraExtra[] | null = null;
  private readonly catalogoAlteradoSubject = new Subject<void>();

  /** Emite depois de criar/atualizar uma categoria, para filtros recarregarem o catálogo. */
  readonly catalogoAlterado$ = this.catalogoAlteradoSubject.asObservable();

  /** Lista só as categorias ativas, com cache em memória para não recarregar por linha. */
  getAtivas(forceReload = false): Observable<CategoriaHoraExtra[]> {
    if (this.ativasCache && !forceReload) {
      return of(this.ativasCache);
    }
    return from(categoriaHoraExtraControllerListar()).pipe(tap(categorias => this.ativasCache = categorias));
  }

  /** Lista todas, inclusive inativas (tela admin e filtros), com cache invalidado em criar/atualizar. */
  getTodas(forceReload = false): Observable<CategoriaHoraExtra[]> {
    if (this.todasCache && !forceReload) {
      return of(this.todasCache);
    }
    return from(categoriaHoraExtraControllerListar({ incluirInativas: true }))
      .pipe(tap(categorias => this.todasCache = categorias));
  }

  criar(dto: CriarCategoriaHoraExtraDTO): Observable<CategoriaHoraExtra> {
    return from(categoriaHoraExtraControllerCriar(dto)).pipe(tap(() => this.catalogoMudou()));
  }

  atualizar(id: string, dto: AtualizarCategoriaHoraExtraDTO): Observable<CategoriaHoraExtra> {
    return from(categoriaHoraExtraControllerAtualizar(id, dto)).pipe(tap(() => this.catalogoMudou()));
  }

  private catalogoMudou(): void {
    this.ativasCache = null;
    this.todasCache = null;
    this.catalogoAlteradoSubject.next();
  }
}

/** Traduz os erros do cadastro (400, 403, 404, 409) para mensagens de tela. */
export function mapCategoriaHoraExtraError(error: unknown): string {
  const status = extractErrorStatus(error);
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
