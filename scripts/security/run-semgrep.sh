#!/usr/bin/env bash

set -euo pipefail

readonly image='semgrep/semgrep:latest'
readonly -a semgrep_args=(
  semgrep
  --config=p/javascript
  --config=p/typescript
  --config=p/nodejs
  --config=p/owasp-top-ten
  --exclude=node_modules
  --exclude=dist
  --exclude=build
  --exclude=coverage
  --exclude=.angular
  --exclude=package-lock.json
  --error
)

if command -v semgrep >/dev/null 2>&1; then
  exec "${semgrep_args[@]}"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo 'ERRO: semgrep nao esta instalado e o Docker nao esta disponivel para fallback.' >&2
  exit 1
fi

exec docker run --rm \
  -v "$PWD:/src" \
  -w /src \
  "$image" \
  "${semgrep_args[@]}"
