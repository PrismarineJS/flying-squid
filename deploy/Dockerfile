FROM node:14-slim

WORKDIR /app
COPY package.json ./
RUN npm install
RUN npm run prepare
COPY . .

ENTRYPOINT [ "node", "app.js", "-c", "/config" ]
