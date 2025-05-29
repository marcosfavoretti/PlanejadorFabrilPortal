import type { GetTabelaProducaoDiarioDTO } from './GetTabelaProducaoDiarioDTO.ts'

export type ProducaoSimulacaoControllerGenTabelaDiariaMethodQueryParams = {
  /**
   * @description Data no formato dd/MM/yyyy
   * @type string
   */
  data: string
}

/**
 * @description Tabela de produção gerada com sucesso
 */
export type ProducaoSimulacaoControllerGenTabelaDiariaMethod200 = GetTabelaProducaoDiarioDTO

export type ProducaoSimulacaoControllerGenTabelaDiariaMethodQueryResponse = ProducaoSimulacaoControllerGenTabelaDiariaMethod200

export type ProducaoSimulacaoControllerGenTabelaDiariaMethodQuery = {
  Response: ProducaoSimulacaoControllerGenTabelaDiariaMethod200
  QueryParams: ProducaoSimulacaoControllerGenTabelaDiariaMethodQueryParams
  Errors: any
}