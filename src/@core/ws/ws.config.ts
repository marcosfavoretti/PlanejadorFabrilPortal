export interface WsConfig {
  pbIndexUrl: string;
}

// Default configuration
export const pbWsConfig: WsConfig = {
  pbIndexUrl:  'ws://192.168.99.129:30001'
};

// Configuration factory
export function getPBWsConfig(): WsConfig {
  return {
    pbIndexUrl: pbWsConfig.pbIndexUrl
  };
}