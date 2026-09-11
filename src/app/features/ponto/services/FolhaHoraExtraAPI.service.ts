import { Injectable } from '@angular/core';
import {
  CriarFolhaHoraExtraDTO,
  EditarFolhaHoraExtraDTO,
  FolhaHoraExtraControllerHistoricoQueryParams,
  FolhaHoraExtraControllerHistoricoQueryParamsStatusEnum,
  FolhaHoraExtraControllerListarQueryParams,
  FolhaHoraExtraControllerListarQueryParamsStatusEnum,
  ItemFuncionarioHEDTO,
  ItemFuncionarioHEDTORefeicaoEnum,
  ItemFuncionarioHEDTOTransporteEnum,
  PaginatedResFolhaHoraExtraDTODto,
  ResExtratoCustoHoraExtraDTO,
  ResKpiCumprimentoFolhaHoraExtraDTO,
  ResLiderCentroCustoDTO,
  VincularLiderCentroCustoDTO,
  folhaHoraExtraControllerAprovar,
  folhaHoraExtraControllerConsultarKpiCumprimento,
  folhaHoraExtraControllerCriar,
  folhaHoraExtraControllerDesativarLiderCentroCusto,
  folhaHoraExtraControllerDetalhes,
  folhaHoraExtraControllerEditar,
  folhaHoraExtraControllerHistorico,
  folhaHoraExtraControllerListar,
  folhaHoraExtraControllerListarLiderCentroCusto,
  folhaHoraExtraControllerRejeitar,
  folhaHoraExtraControllerSubmeter,
  folhaHoraExtraControllerVincularLiderCentroCusto,
} from '@/api/relogio';
import client from '@/client';
import { from, Observable } from 'rxjs';

export type FolhaHoraExtraStatus =
  | 'RASCUNHO'
  | 'AGUARDANDO_COORDENACAO'
  | 'AGUARDANDO_DIRETORIA'
  | 'APROVADO'
  | 'REJEITADO_COORDENACAO'
  | 'REJEITADO_DIRETORIA';

export type FolhaHoraExtraTurno = 'NORMAL' | 'NOTURNO';
export type FolhaHoraExtraPercentual = 50 | 100;
export type FolhaHoraExtraTransporte = ItemFuncionarioHEDTOTransporteEnum;
export type FolhaHoraExtraRefeicao = ItemFuncionarioHEDTORefeicaoEnum;

export type FolhaHoraExtraFuncionarioPayload = ItemFuncionarioHEDTO;

export interface FolhaHoraExtraCusto {
  descricao: string;
  valor: number;
  observacao?: string;
}

export type FolhaHoraExtraPayload = CriarFolhaHoraExtraDTO | EditarFolhaHoraExtraDTO;

export interface FolhaHoraExtraResumo {
  id: string;
  dataContexto: string;
  setor: string;
  centroCustoCodigo: number;
  centroCustoDescricao: string;
  percentualCusto: FolhaHoraExtraPercentual;
  turno: FolhaHoraExtraTurno;
  status: FolhaHoraExtraStatus;
  totalFuncionarios: number;
  autorNome: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface FolhaHoraExtraDetalhe extends FolhaHoraExtraResumo {
  possuiUber?: boolean;
  funcionarios: Array<{
    matricula: string;
    nome: string;
    precisaUber?: boolean;
    transporte?: FolhaHoraExtraTransporte;
    inicioHE: string;
    fimHE: string;
    totalHE?: string;
    marmitex?: boolean;
    lanche?: boolean;
    refeicao?: FolhaHoraExtraRefeicao;
    justificativa?: string;
  }>;
  justificativas?: Record<string, string>;
  resumoCustos?: FolhaHoraExtraCusto[];
  extratoCusto?: ResExtratoCustoHoraExtraDTO;
  observacao?: string;
  historico: Array<{
    usuarioId: string;
    usuarioNome: string;
    cargo: string;
    acao: 'APROVADO' | 'REJEITADO';
    motivo?: string;
    dataHora: string;
  }>;
  autorId: string;
}

export interface FolhaHoraExtraFilters {
  dataInicio?: string;
  dataFim?: string;
  centroCustoCodigo?: number;
  status?: FolhaHoraExtraStatus | FolhaHoraExtraStatus[];
  page?: number;
  limit?: number;
}

export interface FolhaHoraExtraListResponse {
  data: FolhaHoraExtraResumo[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export type FolhaHoraExtraRefeicaoTipo = 'MARMITEX' | 'LANCHE' | 'N/A';

export interface FolhaHoraExtraRefeicaoResumo {
  folhaId: string;
  dataContexto: string;
  centroCustoCodigo: number;
  centroCustoDescricao: string;
  setor: string;
  matricula: string;
  nome: string;
  refeicao: FolhaHoraExtraRefeicaoTipo;
  inicioHE: string;
  fimHE: string;
  justificativa: string;
  status: FolhaHoraExtraStatus;
  autorNome: string;
  observacao?: string;
}

export interface FolhaHoraExtraRefeicaoFilters {
  page?: number;
  limit?: number;
  dataInicio?: string;
  dataFim?: string;
  centroCustoCodigo?: number;
  matricula?: string;
  nome?: string;
  refeicao?: FolhaHoraExtraRefeicaoTipo;
  status?: FolhaHoraExtraStatus[];
}

export interface FolhaHoraExtraRefeicaoListResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: FolhaHoraExtraRefeicaoResumo[];
}

export type LiderCentroCustoVinculo = ResLiderCentroCustoDTO;

@Injectable({ providedIn: 'root' })
export class FolhaHoraExtraAPIService {
  constructor() {}

  getFolhas(filters: FolhaHoraExtraFilters): Observable<FolhaHoraExtraListResponse> {
    return from(folhaHoraExtraControllerListar(this.toListarParams(filters)) as unknown as Promise<FolhaHoraExtraListResponse>);
  }

  getFolhaById(id: string): Observable<FolhaHoraExtraDetalhe> {
    return from(folhaHoraExtraControllerDetalhes(id) as unknown as Promise<FolhaHoraExtraDetalhe>);
  }

  createFolha(dto: FolhaHoraExtraPayload): Observable<FolhaHoraExtraDetalhe> {
    return from(folhaHoraExtraControllerCriar(dto as never) as unknown as Promise<FolhaHoraExtraDetalhe>);
  }

  updateFolha(id: string, dto: FolhaHoraExtraPayload): Observable<FolhaHoraExtraDetalhe> {
    return from(folhaHoraExtraControllerEditar(id, dto as never) as unknown as Promise<FolhaHoraExtraDetalhe>);
  }

  submitFolha(id: string): Observable<FolhaHoraExtraDetalhe> {
    return from(folhaHoraExtraControllerSubmeter(id) as unknown as Promise<FolhaHoraExtraDetalhe>);
  }

  approveFolha(id: string): Observable<FolhaHoraExtraDetalhe> {
    return from(folhaHoraExtraControllerAprovar(id) as unknown as Promise<FolhaHoraExtraDetalhe>);
  }

  rejectFolha(id: string, motivo: string): Observable<FolhaHoraExtraDetalhe> {
    return from(folhaHoraExtraControllerRejeitar(id, { folhaId: id, motivo }) as unknown as Promise<FolhaHoraExtraDetalhe>);
  }

  createLiderCentroCusto(dto: VincularLiderCentroCustoDTO): Observable<ResLiderCentroCustoDTO> {
    return from(folhaHoraExtraControllerVincularLiderCentroCusto(dto));
  }

  getLiderCentroCusto(usuarioId: string): Observable<ResLiderCentroCustoDTO[]> {
    return from(folhaHoraExtraControllerListarLiderCentroCusto(usuarioId));
  }

  deleteLiderCentroCusto(
    usuarioId: string,
    centroCustoCodigo: number,
  ): Observable<ResLiderCentroCustoDTO> {
    return from(folhaHoraExtraControllerDesativarLiderCentroCusto(usuarioId, centroCustoCodigo));
  }

  getHistorico(filters: FolhaHoraExtraFilters): Observable<PaginatedResFolhaHoraExtraDTODto> {
    return from(folhaHoraExtraControllerHistorico(this.toHistoricoParams(filters)));
  }

  getKpiCumprimento(id: string): Observable<ResKpiCumprimentoFolhaHoraExtraDTO> {
    return from(folhaHoraExtraControllerConsultarKpiCumprimento(id));
  }

  getRefeicoes(
    filters: FolhaHoraExtraRefeicaoFilters,
  ): Observable<FolhaHoraExtraRefeicaoListResponse> {
    return from(
      client<FolhaHoraExtraRefeicaoListResponse>({
        method: 'GET',
        url: 'https://dev.ethos.ind.br/api/ponto/folha-he/refeicoes',
        params: filters,
      }).then(response => response.data),
    );
  }

  private toListarParams(filters: FolhaHoraExtraFilters): FolhaHoraExtraControllerListarQueryParams {
    return {
      ...filters,
      status: this.toArray(filters.status) as FolhaHoraExtraControllerListarQueryParamsStatusEnum[] | undefined,
    };
  }

  private toHistoricoParams(filters: FolhaHoraExtraFilters): FolhaHoraExtraControllerHistoricoQueryParams {
    return {
      ...filters,
      status: this.toArray(filters.status)
        ?.filter(status => status !== 'RASCUNHO') as FolhaHoraExtraControllerHistoricoQueryParamsStatusEnum[] | undefined,
    };
  }

  private toArray(status?: FolhaHoraExtraStatus | FolhaHoraExtraStatus[]): FolhaHoraExtraStatus[] | undefined {
    if (!status) {
      return undefined;
    }
    return Array.isArray(status) ? status : [status];
  }
}

export function normalizeFolhasResponse(response: FolhaHoraExtraListResponse | FolhaHoraExtraResumo[]): FolhaHoraExtraResumo[] {
  return Array.isArray(response) ? response : response.data;
}

export function mapFolhaHoraExtraError(error: unknown): string {
  const rawMessage = extractErrorMessage(error);
  const normalized = rawMessage
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized.includes('lider nao possui vinculo ativo')) {
    return 'Voce nao tem permissao para criar folha neste centro de custo.';
  }
  if (normalized.includes('funcionarios fora do centro de custo')) {
    return 'Existem funcionarios fora do centro de custo informado. Remova os funcionarios invalidos.';
  }
  if (normalized.includes('funcionarios demitidos')) {
    return 'Funcionarios demitidos nao podem entrar na folha. Remova ou corrija as matriculas destacadas.';
  }
  if (normalized.includes('nao pode ser editada')) {
    return 'Esta folha nao pode ser editada enquanto esta em aprovacao.';
  }
  if (normalized.includes('motivo') && normalized.includes('obrigatorio')) {
    return 'Informe o motivo da rejeicao.';
  }

  return rawMessage || 'Nao foi possivel concluir a operacao.';
}

function extractErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return '';
  }

  const maybeHttpError = error as {
    error?: unknown;
    message?: string;
    response?: { data?: unknown };
  };

  // Axios stores the API payload in `response.data`, while some callers wrap
  // it in `error`. Prioritize those payloads over Axios' generic message.
  for (const candidate of [maybeHttpError.response?.data, maybeHttpError.error]) {
    const message = extractPayloadMessage(candidate);
    if (message) {
      return message;
    }
  }

  return maybeHttpError.message ?? '';
}

function extractPayloadMessage(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const body = payload as { message?: unknown; error?: unknown };
  if (Array.isArray(body.message)) {
    return body.message.join(', ');
  }
  if (typeof body.message === 'string') {
    return body.message;
  }
  if (typeof body.error === 'string') {
    return body.error;
  }

  return '';
}
