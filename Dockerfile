FROM node:20-alpine
WORKDIR /app

COPY . .

RUN mkdir -p /app/data /app/public/uploads

EXPOSE 3000
CMD ["node", "server.js"]FROM node:20-alpine
WORKDIR /app

COPY . .

RUN mkdir -p /app/data /app/public/uploads

EXPOSE 3000
CMD ["node", "server.js"]