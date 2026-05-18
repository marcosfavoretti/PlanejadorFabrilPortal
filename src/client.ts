import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import Qs from 'qs';
import { readDevAuthToken } from '@/app/core/auth/utils/auth-token';
import { rewriteUrlToRuntimeGateway } from '@/app/shared/config/runtime-app-config';

export type RequestConfig<TData = any> = AxiosRequestConfig<TData>;
export type ResponseErrorConfig<TError = any> = AxiosError<TError>;

export type Client<TData = any, TError = any, TVariables = any> = {
  (config: RequestConfig<TVariables>): Promise<AxiosResponse<TData>>;
  <TRes = TData, TErr = TError, TVar = TVariables>(config: RequestConfig<TVar>): Promise<AxiosResponse<TRes>>;
};

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

export const client: Client = async <TData = any, TError = any, TVariables = any>(
  config: RequestConfig<TVariables>
): Promise<AxiosResponse<TData>> => {
  const response = await axiosInstance.request<TData>(config);
  return response; 
};

export default client;
