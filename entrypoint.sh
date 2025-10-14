#!/bin/sh
# Este script garante que a build do frontend ocorra apenas uma vez,
# depois que a API já estiver pronta.

# Encerra o script se qualquer comando falhar
set -e

# Diretório onde o Nginx espera os arquivos HTML
NGINX_ROOT=/usr/share/nginx/html

# Verifica se a build inicial já foi feita procurando por um arquivo de marcação.
if [ ! -f "$NGINX_ROOT/build_completo.flag" ]; then
  echo ">>> Primeira inicialização: Preparando para buildar o projeto..."

  # =================== TESTE DE CONECTIVIDADE ===================
  # Seu script 'generate' PRECISA usar o endereço 'http://api:3000' para se conectar,
  # pois 'api' é o nome do serviço no docker-compose.
  # O endpoint de healthcheck é /api/health conforme seu docker-compose.
  # A porta padrão é 3000, se for outra, ajuste a variável ${PORT} no seu .env.
  
  echo ">>> Gerando cliente da API com 'npm run generate'..."
  npm run generate

  echo ">>> Buildando a aplicação Angular com 'npm run build --prod'..."
  npm run build --prod

  echo ">>> Copiando arquivos para o diretório do Nginx..."
  rm -rf $NGINX_ROOT/*
  cp -r /app/dist/* $NGINX_ROOT/

  # Cria um arquivo "flag" para que este bloco não execute novamente
  touch "$NGINX_ROOT/build_completo.flag"

  echo ">>> Setup inicial finalizado."
else
  echo ">>> Aplicação já buildada. Iniciando Nginx diretamente."
fi

# Inicia o Nginx em primeiro plano para manter o contêiner ativo
echo ">>> Iniciando servidor Nginx..."
exec nginx -g 'daemon off;'

