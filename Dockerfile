# Estágio 1: Build da aplicação
FROM node:22.12.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Consome o client versionado em src/api e builda o projeto
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
