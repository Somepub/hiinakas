FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY hiinakas-web/package.json ./hiinakas-web/
COPY hiinakas-server/package.json ./hiinakas-server/

RUN npm install

EXPOSE 3000
EXPOSE 8087

CMD [ "npm", "run", "dev" ]
