FROM node:16-slim

WORKDIR /app
COPY package.json ./
RUN npm config set bin-links false
RUN npm install
COPY . .

ENTRYPOINT [ "node", "app.js", "-c", "/config" ]
