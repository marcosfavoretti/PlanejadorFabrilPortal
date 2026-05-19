#!/usr/bin/env bash

set -euo pipefail

readonly allowed_host='https://app.ethos.ind.br'

mapfile -d '' tracked_files < <(git ls-files -z src/api)

if [[ ${#tracked_files[@]} -eq 0 ]]; then
  echo 'ERRO: nenhum arquivo versionado foi encontrado em src/api.' >&2
  exit 1
fi

if [[ ! -d src/api ]]; then
  echo 'ERRO: src/api nao existe. O client versionado deve estar presente no repositorio.' >&2
  exit 1
fi

failures=0

if rg -n -H \
  -e 'dev\.ethos\.ind\.br' \
  -e '\blocalhost\b' \
  -e '\b127(?:\.\d{1,3}){3}\b' \
  -e '\b0\.0\.0\.0\b' \
  -e '\b10(?:\.\d{1,3}){3}\b' \
  -e '\b192\.168(?:\.\d{1,3}){2}\b' \
  -e '\b172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}\b' \
  -- "${tracked_files[@]}"; then
  echo 'ERRO: arquivos versionados em src/api contem host de dev/local/interno.' >&2
  failures=1
fi

client_files=()
for file in "${tracked_files[@]}"; do
  if [[ "$file" == *'/client/'* && "$file" == *.ts ]]; then
    client_files+=("$file")
  fi
done

if [[ ${#client_files[@]} -eq 0 ]]; then
  echo 'ERRO: nenhum client TypeScript versionado foi encontrado em src/api.' >&2
  exit 1
fi

if rg -n -H -P 'url:\s*`https?://(?!app\.ethos\.ind\.br)[^`]+' -- "${client_files[@]}"; then
  echo "ERRO: endpoints absolutos fora de ${allowed_host} foram encontrados no client versionado." >&2
  failures=1
fi

if [[ $failures -ne 0 ]]; then
  exit 1
fi

echo "OK: ${#tracked_files[@]} arquivos versionados em src/api validados com host ${allowed_host}."
