# Estágio de build
FROM node:18-alpine as build

WORKDIR /app

# Copiar os arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências com cache
RUN npm ci

# Copiar o restante do código
COPY . .

# Construir a aplicação para produção
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copiar a build compilada para o diretório de servir do nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copiar configuração personalizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor a porta 80
EXPOSE 80

# Iniciar o nginx em foreground
CMD ["nginx", "-g", "daemon off;"] 