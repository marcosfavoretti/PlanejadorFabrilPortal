export interface WsConfig {
  pbIndexUrl: string;
}

const getProtocol = (): string => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return 'wss';
  }
  return 'ws';
};

const host = 'app.ethos.ind.br';

// Default configuration
export const pbWsConfig: WsConfig = {
  pbIndexUrl: `${getProtocol()}://${host}`
};

// Configuration factory
export function getPBWsConfig(): WsConfig {
  return {
    pbIndexUrl: pbWsConfig.pbIndexUrl
  };
}