import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import Qs from 'qs';
import { readDevAuthToken } from '@/app/core/auth/utils/auth-token';
import { rewriteUrlToRuntimeGateway } from '@/app/shared/config/runtime-app-config';
import { TwoFactorRequiredPayload } from '@/app/core/auth/two-factor/two-factor.types';

export type RequestConfig<TData = any> = AxiosRequestConfig<TData>;
export type ResponseErrorConfig<TError = any> = AxiosError<TError>;

export type Client<TData = any, TError = any, TVariables = any> = {
  (config: RequestConfig<TVariables>): Promise<AxiosResponse<TData>>;
  <TRes = TData, TErr = TError, TVar = TVariables>(config: RequestConfig<TVar>): Promise<AxiosResponse<TRes>>;
};

export type TwoFactorRequestConfig<TData = any> = RequestConfig<TData> & {
  skipTwoFactorHandler?: boolean;
  twoFactorRetryCount?: number;
};

type TwoFactorHandler = (
  error: AxiosError<TwoFactorRequiredPayload>,
  challenge: TwoFactorRequiredPayload,
) => Promise<AxiosResponse<unknown>>;

let twoFactorHandler: TwoFactorHandler | null = null;

export const axiosInstance = axios.create({
  withCredentials: true,
  // CONFIGURAÇÃO PARA ARRAY NA URL:
  paramsSerializer: {
    serialize: (params) => {
      // O 'indices: false' remove os colchetes []
      return Qs.stringify(params, { arrayFormat: 'repeat' });
    }
  }
});

axiosInstance.interceptors.request.use((config) => {
  if (config.url) {
    config.url = rewriteUrlToRuntimeGateway(config.url);
  }

  const token = readDevAuthToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<TwoFactorRequiredPayload>) => {
    const config = error.config as TwoFactorRequestConfig | undefined;

    if (
      !twoFactorHandler
      || !config
      || config.skipTwoFactorHandler
      || error.response?.status !== 403
      || error.response.data?.code !== 'TWO_FACTOR_REQUIRED'
    ) {
      throw error;
    }

    return twoFactorHandler(error, error.response.data);
  }
);

export function registerTwoFactorHandler(handler: TwoFactorHandler): void {
  twoFactorHandler = handler;
}

export const client: Client = async <TData = any, TError = any, TVariables = any>(
  config: RequestConfig<TVariables>
): Promise<AxiosResponse<TData>> => {
  const response = await axiosInstance.request<TData>(config);
  return response; 
};

export default client;
