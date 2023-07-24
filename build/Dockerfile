FROM node:lts AS builder
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
RUN ng build -c production 

FROM nginx AS serve
COPY --from=prod_builder /home/node/app/dist/mgw-gui /usr/share/nginx/html
COPY build/conf /etc/nginx/conf.d/default.conf

FROM builder as dev_builder
RUN ng build -c development 

FROM nginx as serve_dev
COPY build/conf /etc/nginx/conf.d/default.conf
COPY --from=dev_builder /home/node/app/dist/mgw-gui /usr/share/nginx/html