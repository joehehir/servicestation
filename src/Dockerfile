FROM node:16.18-alpine3.16

LABEL org.opencontainers.image.source "https://github.com/joehehir/servicestation"
LABEL org.opencontainers.image.description "ServiceStation is a containerized service worker execution environment."

ARG CHROME_LOG_DIR="/var/log/servicestation/" \
    CHROME_LOG_FILE="/var/log/servicestation/chrome_debug.log" \
    PACKAGE_LIST="chromium" \
    PORT=80

ENV CHROME_LOG_FILE=${CHROME_LOG_FILE} \
    NODE_ENV=production \
    PORT=${PORT}

COPY ./package*.json /usr/src/app/
RUN apk update \
    && apk add --no-cache ${PACKAGE_LIST} \
    && npm ci --prefix /usr/src/app/ \
    && npm cache clean --force --loglevel=error \
    && rm -rf /var/cache/apk/* /tmp/* \
    && mkdir -p /var/www/ \
    && mkdir -p ${CHROME_LOG_DIR} \
    && touch ${CHROME_LOG_FILE} \
    && chown node:node ${CHROME_LOG_FILE} \
    && printf "%s\n%s\n" "#!/bin/sh" 'exec /usr/src/app/livereload.sh "${@}"' > /usr/local/bin/livereload \
    && printf "%s\n%s\n" "#!/bin/sh" 'exec /usr/src/app/servicestation.sh "${@}"' > /usr/local/bin/servicestation \
    && chmod +x \
        /usr/local/bin/livereload \
        /usr/local/bin/servicestation

COPY ./ /usr/src/app/

EXPOSE ${PORT}

USER node

CMD ["servicestation", "--no-sandbox"]
