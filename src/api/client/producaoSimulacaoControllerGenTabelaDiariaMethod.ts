import client from '@kubb/plugin-client/clients/axios'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type {
  ProducaoSimulacaoControllerGenTabelaDiariaMethodQueryResponse,
  ProducaoSimulacaoControllerGenTabelaDiariaMethodQueryParams,
} from '../models/ProducaoSimulacaoControllerGenTabelaDiariaMethod.ts'

export function getProducaoSimulacaoControllerGenTabelaDiariaMethodUrl() {
  return `http://192.168.99.129:3000/simulacao/gen` as const
}

/**
 * @summary Gera a tabela diária de produção para a data informada
 * {@link /simulacao/gen}
 */
export async function producaoSimulacaoControllerGenTabelaDiariaMethod(
  params: ProducaoSimulacaoControllerGenTabelaDiariaMethodQueryParams,
  config: Partial<RequestConfig> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<ProducaoSimulacaoControllerGenTabelaDiariaMethodQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getProducaoSimulacaoControllerGenTabelaDiariaMethodUrl().toString(),
    params,
    ...requestConfig,
  })
  return res.data
}