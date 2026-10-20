import {
  ApiKeyDto,
  CreateApiKeyDto,
  CreatedApiKeyDto,
  ListApiKeysDto,
  apiKeyControllerCreate,
  apiKeyControllerFindAll,
  apiKeyControllerFindOne,
  apiKeyControllerRevoke,
  apiKeyControllerRotate,
} from '@/api/auth';
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiKeyApiService {
  list(): Observable<ListApiKeysDto> {
    return from(apiKeyControllerFindAll());
  }

  findOne(id: string): Observable<ApiKeyDto> {
    return from(apiKeyControllerFindOne(id));
  }

  // A resposta traz `apiKey` em claro: não deve ser persistida nem cacheada.
  create(dto: CreateApiKeyDto): Observable<CreatedApiKeyDto> {
    return from(apiKeyControllerCreate(dto));
  }

  rotate(id: string): Observable<CreatedApiKeyDto> {
    return from(apiKeyControllerRotate(id));
  }

  revoke(id: string): Observable<void> {
    return from(apiKeyControllerRevoke(id));
  }
}

export function mapApiKeyError(err: any, fallbackMessage: string): string {
  const status: number | undefined = err?.response?.status;
  const backendMessage = err?.response?.data?.message;
  const detail = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;

  switch (status) {
    case 400:
      return detail || 'Dados inválidos. Verifique o nome, os cargos e se a validade é uma data futura.';
    case 403:
      return detail || 'Operação não permitida. Apenas ADMIN gerencia API keys e o cargo ADMIN não pode ser atribuído a uma chave.';
    case 404:
      return 'API key não encontrada.';
    case 409:
      return detail || 'Conflito: já existe uma chave ativa com esse nome ou a chave já foi revogada.';
    case 429:
      return 'Muitas requisições em sequência. Aguarde alguns instantes e tente novamente.';
    default:
      return detail || fallbackMessage;
  }
}
