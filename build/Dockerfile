FROM node:lts AS local_dev
RUN mkdir /home/node/app && chown node:node /home/node/app
RUN mkdir /home/node/app/node_modules && chown node:node /home/node/app/node_modules
WORKDIR  /home/node/app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --quiet
COPY --chown=node:node . .
COPY ./build/start_dev_server.sh start_dev_server.sh
RUN chmod +x /entrypoint
RUN npm install -g @angular/cli
ENTRYPOINT [ "./start_dev_server.sh" ]

FROM node:lts AS builder
WORKDIR /home/node/app
COPY package.json package-lock.json ./
RUN npm ci --quiet
RUN npm install -g @angular/cli
COPY . .
RUN ng build -c production 

FROM nginx AS serve
COPY --from=builder /home/node/app/dist/mgw-gui /usr/share/nginx/html