import { getRuntimeAppConfig } from '@/app/shared/config/runtime-app-config';

export interface WsConfig {
  pbIndexUrl: string;
  pbIndexPath: string;
}

export function getPBWsConfig(): WsConfig {
  const runtimeConfig = getRuntimeAppConfig();
  return {
    pbIndexUrl: runtimeConfig.pbWsOrigin,
    pbIndexPath: runtimeConfig.pbWsPath,
  };
}
