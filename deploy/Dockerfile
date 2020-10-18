FROM node:14-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm run prepare
COPY . .

ENTRYPOINT [ "node", "app.js", "-c", "/config" ]
