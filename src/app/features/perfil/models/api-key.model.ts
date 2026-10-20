import { ApiKeyDto } from '@/api/auth';

export type ApiKeyStatus = 'ativa' | 'expirada' | 'revogada';

export type ApiKeyRow = ApiKeyDto & {
  status: ApiKeyStatus;
};

export const API_KEY_NAME_MAX_LENGTH = 100;

export const API_KEY_STATUS_LABEL: Record<ApiKeyStatus, string> = {
  ativa: 'Ativa',
  expirada: 'Expirada',
  revogada: 'Revogada',
};

export const API_KEY_STATUS_SEVERITY: Record<ApiKeyStatus, 'success' | 'warn' | 'danger'> = {
  ativa: 'success',
  expirada: 'warn',
  revogada: 'danger',
};

// O tipo gerado declara Date, mas o JSON chega como string ISO.
export function getApiKeyStatus(apiKey: ApiKeyDto, now = new Date()): ApiKeyStatus {
  if (apiKey.revokedAt) {
    return 'revogada';
  }

  if (apiKey.expiresAt && new Date(apiKey.expiresAt).getTime() <= now.getTime()) {
    return 'expirada';
  }

  return 'ativa';
}

export function toApiKeyRows(apiKeys: ApiKeyDto[], now = new Date()): ApiKeyRow[] {
  return apiKeys
    .map(apiKey => ({ ...apiKey, status: getApiKeyStatus(apiKey, now) }))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}
