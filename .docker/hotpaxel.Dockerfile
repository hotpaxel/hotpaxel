FROM makye/texlive-node:latest-24.13.0-ko
WORKDIR /app
USER root
RUN apt-get update && apt-get install -y nginx gettext-base && rm -rf /var/lib/apt/lists/*
RUN groupadd -r paxel && useradd -r -g paxel -m paxel

# 미리 빌드된 바이너리를 복사합니다.
ARG TARGETARCH
COPY artifacts/${TARGETARCH}/paxel ./paxel
RUN chmod +x ./paxel

# 미리 빌드된 프런트엔드 에셋을 복사합니다.
COPY frontend-dist /var/www/html
COPY apps/tiptex-web/nginx.conf /etc/nginx/sites-available/default.template

RUN echo '#!/bin/sh\n\
    export PAXEL_HOST=localhost\n\
    envsubst "\$PAXEL_HOST" < /etc/nginx/sites-available/default.template > /etc/nginx/sites-enabled/default\n\
    nginx -g "daemon off;" & \n\
    ./paxel' > /app/start.sh && chmod +x /app/start.sh

ENV PORT=8888
EXPOSE 80 8888
CMD ["/app/start.sh"]
