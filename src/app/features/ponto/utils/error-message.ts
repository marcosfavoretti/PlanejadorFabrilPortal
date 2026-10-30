/** Extrai o status HTTP de erros do Axios (`response.status`) ou de erros já normalizados (`status`). */
export function extractErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  const maybeHttpError = error as { status?: number; response?: { status?: number } };
  return maybeHttpError.response?.status ?? maybeHttpError.status;
}

/** Extrai a mensagem do backend (string ou string[]); cai na mensagem genérica do cliente HTTP. */
export function extractErrorMessage(error: unknown): string {
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
