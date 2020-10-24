FROM node:14-slim

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

ENTRYPOINT [ "node", "app.js", "-c", "/config" ]
