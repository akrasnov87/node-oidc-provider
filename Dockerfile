FROM node:20

LABEL author="Aleksandr Krasnov"
LABEL desc="Образ OIDC провайдера для RPC-сервиса на NodeJS"

ARG DOCKER_ENV=development

ARG APP_DIR=app

ENV APP_ENV=dev
ENV NODE_ENV=${DOCKER_ENV}

RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}

COPY package.json .
RUN npm install

COPY . .

CMD node /app/example/express.js conf=./$APP_ENV.conf