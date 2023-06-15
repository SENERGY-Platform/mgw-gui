FROM node:lts AS builder
WORKDIR /home/node/app
COPY package.json package-lock.json ./
RUN npm ci --quiet
RUN npm install -g @angular/cli
COPY . .
RUN ng build -c production 

FROM nginx AS serve
COPY --from=builder /home/node/app/dist/mgw-gui /usr/share/nginx/html