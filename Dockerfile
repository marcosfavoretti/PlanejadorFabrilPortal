# Etapa 1: Preparação do ambiente
# Esta etapa instala as dependências e copia o código-fonte
FROM node:22.12.0-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Etapa 2: Imagem final de Produção
# Usamos uma imagem Node para ter as ferramentas (npm) e instalamos o Nginx nela
FROM node:22.12.0-alpine

WORKDIR /app

# Instala o Nginx e o curl
RUN apk add --no-cache nginx curl

# Copia as dependências e o código-fonte da etapa de preparação
COPY --from=builder /app /app

# Copia a configuração do Nginx e o novo script de inicialização
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh .

# Dá permissão de execução para o script
RUN chmod +x ./entrypoint.sh

# Expõe a porta do Nginx
EXPOSE 8085

# Define o script como o ponto de entrada do contêiner
ENTRYPOINT ["./entrypoint.sh"]
