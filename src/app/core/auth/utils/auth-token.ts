import { isDevMode } from '@angular/core';
import { getRuntimeAppConfig } from '@/app/shared/config/runtime-app-config';

export const AUTH_TOKEN_STORAGE_KEY = 'token';

function canUseStoredAuthToken(): boolean {
  return isDevMode() && getRuntimeAppConfig().enableDevAuthToken;
}

export function readStoredAuthToken(): string | null {
  if (!canUseStoredAuthToken() || typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function storeAuthToken(token: string): void {
  if (!canUseStoredAuthToken() || typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function shouldAttachDevAuthToken(): boolean {
  return canUseStoredAuthToken();
}

export function readDevAuthToken(): string | null {
  if (!shouldAttachDevAuthToken()) {
    return null;
  }

  return readStoredAuthToken();
}
