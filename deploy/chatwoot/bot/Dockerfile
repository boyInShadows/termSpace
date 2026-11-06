FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY server.mjs ./
COPY queue.mjs ./
COPY knowledge ./knowledge
RUN mkdir /app/data && chown node:node /app/data && chmod 700 /app/data

USER node
EXPOSE 8787

CMD ["node", "server.mjs"]
