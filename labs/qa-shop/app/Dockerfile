# Build context is labs/qa-shop (see docker-compose.yml), so both app/ and db/ are visible.
FROM node:24-alpine

WORKDIR /srv/app
COPY app/package.json app/package-lock.json ./
RUN npm ci --omit=dev

COPY app/src ./src
COPY db /srv/db

ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/server.js"]
