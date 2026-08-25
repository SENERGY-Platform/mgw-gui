FROM node:24-alpine AS builder
WORKDIR /home/node/app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci --quiet

# Build
COPY . .

# The environments ship 'UI-VERSION' as a placeholder so a source build has
# something to compile. Substituting it here, before ng build, is what makes
# the shell's version display and Sentry's release tag say the version this
# image actually is; without it both report the placeholder. Kept out of the
# builder stage so the two build stages do not share a cache entry keyed on it.
FROM builder AS prod_builder
ARG VERSION="missing-version"
RUN sed -i "s/'UI-VERSION'/'${VERSION}'/" src/environments/*.ts
RUN npx ng build -c production --base-href="/core/web-ui/"

FROM builder AS dev_builder
ARG VERSION="missing-version"
RUN sed -i "s/'UI-VERSION'/'${VERSION}'/" src/environments/*.ts
RUN npx ng build -c debug --base-href="/core/web-ui/"

# Carries the server configuration and nothing else. The build output is
# copied per serve target rather than here: a shared stage holding one build
# leaves its files behind in the other, because a later COPY overwrites by
# name and everything that does not collide simply stays. That is how the
# production image came to ship the debug build's source maps.
FROM nginx:1.27.2-alpine-slim AS serve_base
COPY build/conf /etc/nginx/conf.d/default.conf

FROM serve_base AS serve_prod
ARG VERSION="missing-version"
COPY --from=prod_builder /home/node/app/dist/mgw-gui/browser /usr/share/nginx/html
RUN echo "$VERSION" > /usr/share/nginx/html/version.txt

FROM serve_base AS serve_dev
ARG VERSION="missing-version"
COPY --from=dev_builder /home/node/app/dist/mgw-gui/browser /usr/share/nginx/html
RUN echo "$VERSION" > /usr/share/nginx/html/version.txt

# deployment/docker-compose.yml builds this name; it is the unminified image.
FROM serve_dev AS serve
