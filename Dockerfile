FROM node:18
WORKDIR /app
COPY server ./server
RUN cd server && npm install
CMD ["node", "server/index.js"]
