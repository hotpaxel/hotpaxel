FROM makye/texlive-node:latest-24.13.0-ko
LABEL org.opencontainers.image.source=https://github.com/hotpaxel/hotpaxel
WORKDIR /app
RUN groupadd -r paxel && useradd -r -g paxel -m paxel && \
    mkdir -p /home/paxel/.cache/fontconfig && \
    chown -R paxel:paxel /app /home/paxel/.cache
# 아키텍처별 바이너리 복사
ARG TARGETARCH
COPY --chown=paxel:paxel artifacts/${TARGETARCH}/paxel ./paxel
RUN chmod +x ./paxel
USER paxel
ENV PORT=8888
ENV NODE_ENV=production
EXPOSE 8888
CMD ["./paxel"]
