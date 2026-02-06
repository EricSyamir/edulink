FROM node:20-alpine

WORKDIR /app

COPY package.json /app/package.json
RUN npm install --omit=dev

COPY server.js /app/server.js

ENV NODE_ENV=production
EXPOSE 8000

CMD ["node", "server.js"]

