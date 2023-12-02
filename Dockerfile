FROM node:slim as builder

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

FROM nginxinc/nginx-unprivileged:latest

COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html/
COPY --chown=nginx:nginx ./nginx/nginx.conf /etc/nginx/conf.d/chat.conf
RUN mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.disabled

