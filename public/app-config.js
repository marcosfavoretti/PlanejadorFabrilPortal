window.__APP_CONFIG__ = Object.assign(
  {
    httpGatewayOrigin: window.location.origin,
    pbWsOrigin: '',
    pbWsPath: '/ws/pb',
    homeExternalUrl: 'https://www.ethos.ind.br/',
    debugEnabled: false,
    enableRoutePermissionMock: false,
    enableDevAuthToken: false,
    allowedResourceOrigins: ['https://app.powerbi.com', 'https://www.ethos.ind.br'],
  },
  window.__APP_CONFIG__ || {}
);
