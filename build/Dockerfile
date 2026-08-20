FROM node:24-alpine AS builder
WORKDIR /home/node/app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci --quiet

# Build
#COPY src .
#COPY angular.json .
#COPY tsconfig.json .
#COPY tsconfig.app.json .
COPY . .

FROM builder AS prod_builder
RUN npx ng build -c production --base-href="/core/web-ui/"

FROM builder AS dev_builder
RUN npx ng build -c debug --base-href="/core/web-ui/"

FROM nginx:1.27.2-alpine-slim AS serve
ARG VERSION="missing-version"
ENV VERSION=${VERSION}
COPY --from=dev_builder /home/node/app/dist/mgw-gui/browser /usr/share/nginx/html
RUN echo ${VERSION}
RUN touch /usr/share/nginx/html/version.txt
RUN echo $VERSION > /usr/share/nginx/html/version.txt


FROM serve AS serve_prod
COPY --from=prod_builder /home/node/app/dist/mgw-gui/browser /usr/share/nginx/html
COPY build/conf /etc/nginx/conf.d/default.conf

FROM serve AS serve_dev
COPY build/conf /etc/nginx/conf.d/default.conf
