#!/bin/sh
# Este script apenas inicia o Nginx, pois a build já foi feita no CI/CD.

# Encerra o script se qualquer comando falhar
set -e

# Diretório onde o Nginx espera os arquivos HTML
NGINX_ROOT=/usr/share/nginx/html
APP_CONFIG_FILE="$NGINX_ROOT/app-config.js"

quote_js_string() {
  printf '%s' "$1" | sed "s/'/'\\\\''/g"
}

normalize_csv_to_js_array() {
  if [ -z "$1" ]; then
    printf ''
    return
  fi

  printf '%s' "$1" | tr ',' '\n' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' | sed '/^$/d' | while IFS= read -r item; do
    escaped_item=$(quote_js_string "$item")
    printf "'%s'," "$escaped_item"
  done | sed 's/,$//'
}

echo ">>> Verificando integridade da aplicação..."
if [ ! -f "$NGINX_ROOT/index.html" ]; then
  echo "ERROR: index.html não encontrado em $NGINX_ROOT. O build falhou ou os arquivos não foram copiados corretamente."
  exit 1
fi

HTTP_GATEWAY_ORIGIN=${APP_HTTP_GATEWAY_ORIGIN:-}
PB_WS_ORIGIN=${APP_PB_WS_ORIGIN:-}
PB_WS_PATH=${APP_PB_WS_PATH:-/ws/pb}
HOME_EXTERNAL_URL=${APP_HOME_EXTERNAL_URL:-https://www.ethos.ind.br/}
DEBUG_ENABLED=${APP_DEBUG_ENABLED:-false}
ENABLE_ROUTE_PERMISSION_MOCK=${APP_ENABLE_ROUTE_PERMISSION_MOCK:-false}
ENABLE_DEV_AUTH_TOKEN=${APP_ENABLE_DEV_AUTH_TOKEN:-false}
ALLOWED_RESOURCE_ORIGINS=$(normalize_csv_to_js_array "${APP_ALLOWED_RESOURCE_ORIGINS:-https://app.powerbi.com,https://www.ethos.ind.br}")

echo ">>> Gerando runtime config em $APP_CONFIG_FILE..."
cat > "$APP_CONFIG_FILE" <<EOF
window.__APP_CONFIG__ = {
  httpGatewayOrigin: '$(quote_js_string "$HTTP_GATEWAY_ORIGIN")',
  pbWsOrigin: '$(quote_js_string "$PB_WS_ORIGIN")',
  pbWsPath: '$(quote_js_string "$PB_WS_PATH")',
  homeExternalUrl: '$(quote_js_string "$HOME_EXTERNAL_URL")',
  debugEnabled: $DEBUG_ENABLED,
  enableRoutePermissionMock: $ENABLE_ROUTE_PERMISSION_MOCK,
  enableDevAuthToken: $ENABLE_DEV_AUTH_TOKEN,
  allowedResourceOrigins: [${ALLOWED_RESOURCE_ORIGINS}]
};
EOF

echo ">>> Aplicação pronta. Iniciando servidor Nginx..."
exec nginx -g 'daemon off;'
