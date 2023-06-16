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
RUN ng build -c production 

FROM nginx AS serve
COPY build/conf /etc/nginx/conf.d/default.conf
COPY --from=builder /home/node/app/dist/mgw-gui /usr/share/nginx/html