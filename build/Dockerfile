FROM node:20-alpine AS builder
WORKDIR /home/node/app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci --quiet
RUN npm install -g @angular/cli

# Build
#COPY src .
#COPY angular.json .
#COPY tsconfig.json .
#COPY tsconfig.app.json .
COPY . .

FROM builder as prod_builder
RUN ng build -c production --base-href="/core/web-ui/"

FROM builder as dev_builder
RUN ng build -c debug --base-href="/core/web-ui/"

FROM nginx:1.27.2-alpine-slim as serve
ARG VERSION="missing-version"
ENV VERSION=${VERSION}
COPY --from=dev_builder /home/node/app/dist/mgw-gui/browser /usr/share/nginx/html
RUN echo ${VERSION}
RUN touch /usr/share/nginx/html/version.txt
RUN echo $VERSION > /usr/share/nginx/html/version.txt


FROM serve AS serve_prod
COPY --from=prod_builder /home/node/app/dist/mgw-gui/browser /usr/share/nginx/html
COPY build/conf /etc/nginx/conf.d/default.conf

FROM serve as serve_dev
COPY build/conf /etc/nginx/conf.d/default.conf
