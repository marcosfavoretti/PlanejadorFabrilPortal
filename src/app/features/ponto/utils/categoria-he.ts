import { ResCategoriaHoraExtraResumoDTO, ResCategoriaTotalHoraExtraDTO } from '@/api/relogio';

/** Tamanho mínimo da justificativa (após trim) quando a categoria exige detalhe. */
export const CATEGORIA_DETALHE_MIN_CHARS = 15;

/** Valor aceito pelo filtro `categoriaCodigo` do KPI de motivos para folhas sem categoria. */
export const SEM_CATEGORIA_CODIGO = 'SEM_CATEGORIA';
export const SEM_CATEGORIA_LABEL = 'Sem categoria';

/** Cor neutra usada para o item "Sem categoria" nos gráficos. */
export const SEM_CATEGORIA_COR = '#94a3b8';

/** Ordens >= 99 são reservadas (ex.: categorias residuais) e não entram na sugestão. */
const ORDEM_LIMITE_SUGESTAO = 99;

export interface CategoriaComNome {
  nome: string;
}

export function categoriaLabel(categoria: CategoriaComNome | null | undefined): string {
  return categoria?.nome?.trim() || SEM_CATEGORIA_LABEL;
}

export function totalLabel(total: Pick<ResCategoriaTotalHoraExtraDTO, 'codigo' | 'nome'>): string {
  return total.codigo === null ? SEM_CATEGORIA_LABEL : total.nome;
}

export function tamanhoJustificativa(justificativa: string | null | undefined): number {
  return String(justificativa ?? '').trim().length;
}

/** Espelha a regra do backend: justificativa obrigatória e, com exigeDetalhe, 15+ caracteres (trim). */
export function justificativaAtendeCategoria(
  justificativa: string | null | undefined,
  exigeDetalhe: boolean,
): boolean {
  const tamanho = tamanhoJustificativa(justificativa);
  return exigeDetalhe ? tamanho >= CATEGORIA_DETALHE_MIN_CHARS : tamanho > 0;
}

/** Maior ordem atual (< 99) mais 1; 1 quando não há categorias. */
export function sugerirOrdemCategoria(categorias: ReadonlyArray<{ ordem: number }>): number {
  const ordens = categorias.map(categoria => categoria.ordem).filter(ordem => ordem < ORDEM_LIMITE_SUGESTAO);
  return ordens.length ? Math.max(...ordens) + 1 : 1;
}

export interface CategoriaTotalAgregado {
  codigo: string | null;
  nome: string;
  quantidadeFuncionarios: number;
}

/** Soma `quantidadeFuncionarios` por código, ordenando por quantidade desc e nome. */
export function somarTotaisPorCategoria(
  listas: ReadonlyArray<ReadonlyArray<CategoriaTotalAgregado> | null | undefined>,
): CategoriaTotalAgregado[] {
  const mapa = new Map<string | null, CategoriaTotalAgregado>();
  for (const lista of listas) {
    for (const total of lista ?? []) {
      const atual = mapa.get(total.codigo);
      if (atual) {
        atual.quantidadeFuncionarios += total.quantidadeFuncionarios;
      } else {
        mapa.set(total.codigo, { ...total });
      }
    }
  }
  return [...mapa.values()].sort(
    (a, b) => b.quantidadeFuncionarios - a.quantidadeFuncionarios
      || totalLabel(a).localeCompare(totalLabel(b), 'pt-BR'),
  );
}

/** Código usado no filtro de categoria no cliente: o da categoria ou SEM_CATEGORIA. */
export function codigoFiltroCategoria(categoria: ResCategoriaHoraExtraResumoDTO | null | undefined): string {
  return categoria?.codigo ?? SEM_CATEGORIA_CODIGO;
}

/** Mantém só os itens cuja categoria tem o código informado (SEM_CATEGORIA casa com `null`); sem código, devolve tudo. */
export function filtrarPorCategoria<T extends { categoria?: ResCategoriaHoraExtraResumoDTO | null }>(
  itens: ReadonlyArray<T>,
  codigo: string | null | undefined,
): T[] {
  return codigo ? itens.filter(item => codigoFiltroCategoria(item.categoria) === codigo) : [...itens];
}

/** Fatia `rows` itens a partir de `first` (paginação no cliente, como o `first` do p-table). */
export function paginarLocal<T>(itens: ReadonlyArray<T>, first: number, rows: number): T[] {
  return itens.slice(Math.max(0, first), Math.max(0, first) + rows);
}

/** Acha a categoria pelo id nos catálogos (ativas primeiro, depois o completo com inativas). */
export function resolverCategoria<T extends { id: string }>(
  id: string | null | undefined,
  ...catalogos: ReadonlyArray<ReadonlyArray<T>>
): T | null {
  if (!id) {
    return null;
  }
  for (const catalogo of catalogos) {
    const encontrada = catalogo.find(categoria => categoria.id === id);
    if (encontrada) {
      return encontrada;
    }
  }
  return null;
}

export interface OpcaoCategoria {
  label: string;
  value: string;
}

/** Opções dos filtros de categoria: "Sem categoria" + catálogo completo (inativas marcadas, folhas antigas as usam). */
export function opcoesFiltroCategoria(
  categorias: ReadonlyArray<{ codigo: string; nome: string; ativo: boolean }>,
): OpcaoCategoria[] {
  return [
    { label: SEM_CATEGORIA_LABEL, value: SEM_CATEGORIA_CODIGO },
    ...categorias.map(categoria => ({
      label: categoria.ativo ? categoria.nome : `${categoria.nome} (inativa)`,
      value: categoria.codigo,
    })),
  ];
}

/**
 * Descobre quais linhas (por matrícula) são citadas numa mensagem de erro do backend,
 * ex.: "... (funcionário 12345 - Fulano)". Também entende "funcionarios.2.categoriaId".
 */
function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function linhasCitadasNoErro(
  mensagens: string[],
  matriculas: ReadonlyArray<string>,
): Set<number> {
  const indices = new Set<number>();
  for (const mensagem of mensagens) {
    matriculas.forEach((matricula, indice) => {
      const limpa = matricula.trim();
      // Fronteira antes da matrícula: "123 - " não pode casar dentro de "0123 - X".
      if (limpa && new RegExp(`(^|\\D)${escaparRegex(limpa)} - `).test(mensagem)) {
        indices.add(indice);
      }
    });
    for (const match of mensagem.matchAll(/funcionarios\.(\d+)\./g)) {
      indices.add(Number(match[1]));
    }
  }
  return indices;
}

export interface LinhaCategoriaState {
  modoEdicao: boolean;
  /** Linha criada nesta edição (matrícula que não veio do GET). Sempre true na criação. */
  linhaNova: boolean;
  categoriaId: string | null;
  categoriaOriginalId: string | null;
  /** exigeDetalhe da categoria efetiva da linha (escolhida ou mantida); false para categoria nula. */
  exigeDetalhe: boolean;
  justificativa: string | null | undefined;
}

/** Criação: toda linha. Edição: só linhas novas (linhas legadas sem categoria seguem livres). */
export function categoriaObrigatoria(state: Pick<LinhaCategoriaState, 'modoEdicao' | 'linhaNova'>): boolean {
  return !state.modoEdicao || state.linhaNova;
}

/**
 * "Limpar" só faz sentido onde o envio de `null` teria efeito: linhas que já têm categoria gravada
 * não podem ficar sem (o backend mantém o snapshot) e linhas novas/criação exigem categoria.
 */
export function podeLimparCategoria(
  state: Pick<LinhaCategoriaState, 'modoEdicao' | 'linhaNova' | 'categoriaOriginalId'>,
): boolean {
  return !categoriaObrigatoria(state) && !state.categoriaOriginalId;
}

/** Espelha as validações do backend para uma linha de funcionário. */
export function validarLinhaCategoria(state: LinhaCategoriaState): { categoriaObrigatoria?: true; justificativaCurta?: true } | null {
  const erros: { categoriaObrigatoria?: true; justificativaCurta?: true } = {};
  if (categoriaObrigatoria(state) && !state.categoriaId) {
    erros.categoriaObrigatoria = true;
  }
  // O snapshot só vale para a linha original; linha nova (matrícula trocada) depende da categoria escolhida.
  const categoriaEfetiva = state.categoriaId ?? (state.linhaNova ? null : state.categoriaOriginalId);
  if (categoriaEfetiva && state.exigeDetalhe && tamanhoJustificativa(state.justificativa) < CATEGORIA_DETALHE_MIN_CHARS) {
    erros.justificativaCurta = true;
  }
  return Object.keys(erros).length ? erros : null;
}

/** Na edição só envia categoriaId quando a linha é nova ou o usuário trocou a categoria. */
export function categoriaIdParaEnvio(
  state: Pick<LinhaCategoriaState, 'modoEdicao' | 'linhaNova' | 'categoriaId' | 'categoriaOriginalId'>,
): string | undefined {
  if (!state.categoriaId) {
    return undefined;
  }
  if (!state.modoEdicao || state.linhaNova) {
    return state.categoriaId;
  }
  return state.categoriaId !== state.categoriaOriginalId ? state.categoriaId : undefined;
}

const PALETA_CATEGORIAS = [
  '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#dc2626',
  '#4f46e5', '#65a30d', '#db2777', '#0d9488', '#ca8a04', '#7c3aed', '#ea580c',
];

export interface DadosGraficoCategorias {
  labels: string[];
  data: number[];
  colors: string[];
}

/** Série para o gráfico: "Sem categoria" (codigo null) sempre em cinza neutro. */
export function montarDadosGraficoCategorias(
  totais: ReadonlyArray<CategoriaTotalAgregado> | null | undefined,
): DadosGraficoCategorias {
  const lista = totais ?? [];
  let proximaCor = 0;
  return {
    labels: lista.map(total => totalLabel(total)),
    data: lista.map(total => total.quantidadeFuncionarios),
    colors: lista.map(total => total.codigo === null
      ? SEM_CATEGORIA_COR
      : PALETA_CATEGORIAS[proximaCor++ % PALETA_CATEGORIAS.length]),
  };
}
