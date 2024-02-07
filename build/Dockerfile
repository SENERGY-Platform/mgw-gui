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

FROM builder as dev_builder
RUN ng build -c development 

FROM nginx as serve
ARG VERSION="missing-version"
ENV VERSION=${VERSION}
COPY --from=dev_builder /home/node/app/dist/mgw-gui /usr/share/nginx/html
RUN echo ${VERSION}
RUN find '/usr/share/nginx/html' -name '*.js' -exec sed -i -e "s/UI-VERSION/"${VERSION}"/g" {} +

FROM serve AS serve_prod
COPY --from=prod_builder /home/node/app/dist/mgw-gui /usr/share/nginx/html
COPY build/conf /etc/nginx/conf.d/default.conf

FROM serve as serve_dev 
COPY build/conf /etc/nginx/conf.d/default.conf
