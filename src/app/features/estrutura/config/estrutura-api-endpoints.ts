const ESTRUTURA_API_BASE_PATH = '/api/estrutura';

function resolveEstruturaApiUrl(path = ''): string {
  if (typeof window === 'undefined') {
    return `${ESTRUTURA_API_BASE_PATH}${path}`;
  }

  return new URL(`${ESTRUTURA_API_BASE_PATH}${path}`, window.location.origin).toString();
}

export const estruturaApiEndpoints = {
  basePath: ESTRUTURA_API_BASE_PATH,
  resolveUrl: resolveEstruturaApiUrl,
  image: () => resolveEstruturaApiUrl('/image'),
  chatbotMessage: () => resolveEstruturaApiUrl('/chatbot/message'),
  chatbotCancel: () => resolveEstruturaApiUrl('/chatbot/cancel'),
};
