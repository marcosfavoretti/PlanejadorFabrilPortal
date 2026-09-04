#!/usr/bin/env bash

set -euo pipefail

target="${1:-all}"
shift || true

case "${target,,}" in
  all)
    export KUBB_API='all'
    ;;
  auth|audit|app-routes|routes|certificados|planejador|relogio|wifi|buffer|pbindex|pb|portaria|prod-laser|estrutura)
    if [[ "${target,,}" == 'routes' || "${target,,}" == 'app-routes' ]]; then
      export KUBB_API='app-routes-api'
    elif [[ "${target,,}" == 'pb' ]]; then
      export KUBB_API='pbindex-api'
    else
      export KUBB_API="${target,,}-api"
    fi
    ;;
  *)
    echo "API inválida: ${target}" >&2
    echo "Use 'all' ou uma destas APIs: auth, audit, routes, certificados, planejador, relogio, wifi, buffer, pbindex, portaria, prod-laser, estrutura." >&2
    exit 1
    ;;
esac

exec npx kubb generate --clean --debug --config kubb.config.ts "$@"
