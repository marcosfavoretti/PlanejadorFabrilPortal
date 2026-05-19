# Estágio 1: Build da aplicação
FROM node:22.12.0-alpine AS builder

WORKDIR /app

# Argumentos de build para as URLs de API e Swagger
ARG API_URL_AUTH
ARG API_SWAGGER_AUTH
ARG API_URL_ROUTES
ARG API_SWAGGER_ROUTES
ARG API_URL_CERTIFICADOS
ARG API_SWAGGER_CERTIFICADOS
ARG API_URL_PLANEJADOR
ARG API_SWAGGER_PLANEJADOR
ARG API_URL_RELOGIO
ARG API_SWAGGER_RELOGIO
ARG API_URL_WIFI
ARG API_SWAGGER_WIFI
ARG API_URL_BUFFER
ARG API_SWAGGER_BUFFER
ARG API_URL_PBINDEX
ARG API_SWAGGER_PBINDEX
ARG API_URL_PORTARIA
ARG API_SWAGGER_PORTARIA
ARG API_URL_ESTRUTURA
ARG API_SWAGGER_ESTRUTURA

# Definição das variáveis de ambiente para o build
ENV API_URL_AUTH=$API_URL_AUTH
ENV API_SWAGGER_AUTH=$API_SWAGGER_AUTH
ENV API_URL_ROUTES=$API_URL_ROUTES
ENV API_SWAGGER_ROUTES=$API_SWAGGER_ROUTES
ENV API_URL_CERTIFICADOS=$API_URL_CERTIFICADOS
ENV API_SWAGGER_CERTIFICADOS=$API_SWAGGER_CERTIFICADOS
ENV API_URL_PLANEJADOR=$API_URL_PLANEJADOR
ENV API_SWAGGER_PLANEJADOR=$API_SWAGGER_PLANEJADOR
ENV API_URL_RELOGIO=$API_URL_RELOGIO
ENV API_SWAGGER_RELOGIO=$API_SWAGGER_RELOGIO
ENV API_URL_WIFI=$API_URL_WIFI
ENV API_SWAGGER_WIFI=$API_SWAGGER_WIFI
ENV API_URL_BUFFER=$API_URL_BUFFER
ENV API_SWAGGER_BUFFER=$API_SWAGGER_BUFFER
ENV API_URL_PBINDEX=$API_URL_PBINDEX
ENV API_SWAGGER_PBINDEX=$API_SWAGGER_PBINDEX
ENV API_URL_PORTARIA=$API_URL_PORTARIA
ENV API_SWAGGER_PORTARIA=$API_SWAGGER_PORTARIA
ENV API_URL_ESTRUTURA=$API_URL_ESTRUTURA
ENV API_SWAGGER_ESTRUTURA=$API_SWAGGER_ESTRUTURA

COPY package*.json ./
RUN npm ci

COPY . .

# Gera o cliente da API e builda o projeto
RUN npm run generate
RUN npm run build

# Estágio 2: Imagem final de Produção (Nginx)
FROM nginx:alpine

# Instala o curl para healthchecks
RUN apk add --no-cache curl

# Define o diretório de trabalho do Nginx
WORKDIR /usr/share/nginx/html

# Copia os arquivos compilados do estágio anterior
# Nota: O caminho dist/planejamento-ethos-portal/browser pode variar dependendo da versão do Angular
COPY --from=builder /app/dist/planejamento-ethos-portal/browser /usr/share/nginx/html

# Copia a configuração do Nginx e o script de inicialização
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Dá permissão de execução para o script
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expõe a porta configurada no nginx.conf
EXPOSE 8085

# Define o script como o ponto de entrada
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
