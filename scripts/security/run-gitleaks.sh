#!/usr/bin/env bash

set -euo pipefail

readonly image='ghcr.io/gitleaks/gitleaks:latest'
readonly config_file='.gitleaks.toml'

if [[ ! -f "$config_file" ]]; then
  echo "ERRO: arquivo ${config_file} nao encontrado." >&2
  exit 1
fi

if command -v gitleaks >/dev/null 2>&1; then
  exec gitleaks detect --source . --config "$config_file" --redact --verbose
fi

if ! command -v docker >/dev/null 2>&1; then
  echo 'ERRO: gitleaks nao esta instalado e o Docker nao esta disponivel para fallback.' >&2
  exit 1
fi

exec docker run --rm \
  -v "$PWD:/work" \
  -w /work \
  "$image" \
  detect --source . --config "$config_file" --redact --verbose
