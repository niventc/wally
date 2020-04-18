FROM node:10-alpine3.11

WORKDIR /usr/src/app

COPY ./dist .

EXPOSE 8080

CMD [ "node", "server.js" ]