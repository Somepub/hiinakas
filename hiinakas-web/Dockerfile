FROM node:20-alpine as builder
WORKDIR /app
COPY . .
COPY ../curak-types ../

RUN apk add --no-cache protobuf
RUN npm install
RUN npm run generate-proto
RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist .

COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /etc/letsencrypt

COPY ssl-setup.sh /
RUN chmod +x /ssl-setup.sh

CMD ["/ssl-setup.sh"]