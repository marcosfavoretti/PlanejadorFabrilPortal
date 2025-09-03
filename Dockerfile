# Etapa 1: Build da aplicação Angular
FROM node:22 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build --prod

# Etapa 2: Servir com Nginx
FROM nginx:alpine

# Remove o conteúdo padrão do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

# Expor a porta padrão do Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
