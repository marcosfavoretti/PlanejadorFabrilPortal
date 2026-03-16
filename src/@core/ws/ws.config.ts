export interface WsConfig {
  pbIndexUrl: string;
}

// Default configuration
export const pbWsConfig: WsConfig = {
  pbIndexUrl: 'ws://app.ethos.ind.br'
};

// Configuration factory
export function getPBWsConfig(): WsConfig {
  return {
    pbIndexUrl: pbWsConfig.pbIndexUrl
  };
}