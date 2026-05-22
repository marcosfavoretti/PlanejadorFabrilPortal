#!/usr/bin/env bash

set -euo pipefail

base_ref="${1:-HEAD~1}"
head_ref="${2:-HEAD}"

if ! git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
  base_ref="$(git rev-list --max-parents=0 "$head_ref" | tail -n 1)"
fi

mapfile -t changed_files < <(git diff --name-only "$base_ref" "$head_ref")

echo "Arquivos alterados entre ${base_ref} e ${head_ref}:"
if [[ ${#changed_files[@]} -eq 0 ]]; then
  echo "  - nenhum"
else
  printf '  - %s\n' "${changed_files[@]}"
fi

build_change=0
deploy_change=0

for file in "${changed_files[@]}"; do
  case "$file" in
    src/*|public/*|Dockerfile|nginx.conf|entrypoint.sh|package.json|package-lock.json|angular.json|tsconfig.json|tsconfig.app.json|tsconfig.spec.json|kubb.config.ts|deploy/stack-front.yml)
      build_change=1
      deploy_change=1
      ;;
    .github/workflows/*|scripts/ci/*|scripts/check-api-client.sh|scripts/security/*)
      build_change=1
      ;;
  esac
done

if [[ "$build_change" -eq 1 ]]; then
  should_build=true
else
  should_build=false
fi

if [[ "$deploy_change" -eq 1 ]]; then
  should_deploy=true
else
  should_deploy=false
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "should_build=${should_build}"
    echo "should_deploy=${should_deploy}"
  } >>"$GITHUB_OUTPUT"
fi

echo "should_build=${should_build}"
echo "should_deploy=${should_deploy}"
