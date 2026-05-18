const DEFAULT_HOME_EXTERNAL_URL = 'https://www.ethos.ind.br/';
const DEFAULT_PB_WS_PATH = '/ws/pb';
const DEFAULT_ALLOWED_RESOURCE_ORIGINS = ['https://app.powerbi.com'];

export interface RuntimeAppConfig {
  httpGatewayOrigin: string;
  pbWsOrigin: string;
  pbWsPath: string;
  homeExternalUrl: string;
  debugEnabled: boolean;
  enableRoutePermissionMock: boolean;
  enableDevAuthToken: boolean;
  allowedResourceOrigins: string[];
}

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<RuntimeAppConfig>;
  }
}

function getBrowserOrigin(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.location.origin;
}

function isLocalRuntimeHost(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

function normalizeOrigin(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  try {
    return new URL(value).origin;
  } catch {
    return fallback;
  }
}

function normalizeWsOrigin(value: unknown, fallbackHttpOrigin: string): string {
  const fallbackProtocol = fallbackHttpOrigin.startsWith('https://') ? 'wss:' : 'ws:';

  try {
    const raw = typeof value === 'string' && value.trim() ? value : fallbackHttpOrigin;
    const normalized = new URL(raw);
    if (normalized.protocol === 'http:' || normalized.protocol === 'https:') {
      normalized.protocol = normalized.protocol === 'https:' ? 'wss:' : 'ws:';
    }
    if (normalized.protocol !== 'ws:' && normalized.protocol !== 'wss:') {
      throw new Error('Invalid websocket protocol');
    }
    normalized.pathname = '';
    normalized.search = '';
    normalized.hash = '';
    return normalized.toString().replace(/\/$/, '');
  } catch {
    const fallback = new URL(fallbackHttpOrigin);
    fallback.protocol = fallbackProtocol;
    fallback.pathname = '';
    fallback.search = '';
    fallback.hash = '';
    return fallback.toString().replace(/\/$/, '');
  }
}

function normalizePath(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  const path = value.startsWith('/') ? value : `/${value}`;
  return path.replace(/\/{2,}/g, '/');
}

function normalizeUrl(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  try {
    return new URL(value).toString();
  } catch {
    return fallback;
  }
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return fallback;
}

function normalizeAllowedOrigins(value: unknown, fallback: string[]): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  const normalized = values
    .map((item) => normalizeOrigin(item, ''))
    .filter(Boolean);

  const merged = [...fallback, ...normalized];
  return Array.from(new Set(merged));
}

export function getRuntimeAppConfig(): RuntimeAppConfig {
  const browserOrigin = getBrowserOrigin() ?? 'http://127.0.0.1';
  const rawConfig = typeof window === 'undefined' ? undefined : window.__APP_CONFIG__;
  const httpGatewayOrigin = normalizeOrigin(rawConfig?.httpGatewayOrigin, browserOrigin);
  const homeExternalUrl = normalizeUrl(rawConfig?.homeExternalUrl, DEFAULT_HOME_EXTERNAL_URL);

  return {
    httpGatewayOrigin,
    pbWsOrigin: normalizeWsOrigin(rawConfig?.pbWsOrigin, httpGatewayOrigin),
    pbWsPath: normalizePath(rawConfig?.pbWsPath, DEFAULT_PB_WS_PATH),
    homeExternalUrl,
    debugEnabled: normalizeBoolean(rawConfig?.debugEnabled, isLocalRuntimeHost()),
    enableRoutePermissionMock: normalizeBoolean(rawConfig?.enableRoutePermissionMock, false),
    enableDevAuthToken: normalizeBoolean(rawConfig?.enableDevAuthToken, isLocalRuntimeHost()),
    allowedResourceOrigins: normalizeAllowedOrigins(rawConfig?.allowedResourceOrigins, [
      DEFAULT_ALLOWED_RESOURCE_ORIGINS[0],
      normalizeOrigin(homeExternalUrl, ''),
      httpGatewayOrigin,
    ].filter(Boolean)),
  };
}

export function resolveRuntimeUrl(pathOrUrl: string, baseOrigin = getRuntimeAppConfig().httpGatewayOrigin): string {
  return new URL(pathOrUrl, baseOrigin).toString();
}

export function rewriteUrlToRuntimeGateway(url: string): string {
  try {
    const parsed = new URL(url, getRuntimeAppConfig().httpGatewayOrigin);
    return resolveRuntimeUrl(`${parsed.pathname}${parsed.search}${parsed.hash}`);
  } catch {
    return url;
  }
}
