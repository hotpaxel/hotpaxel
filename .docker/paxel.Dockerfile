FROM makye/texlive-node:latest-24.13.0-ko
WORKDIR /app
RUN groupadd -r paxel && useradd -r -g paxel -m paxel && \
    mkdir -p /home/paxel/.cache/fontconfig && \
    chown -R paxel:paxel /app /home/paxel/.cache
USER paxel
# 빌드 컨텍스트 루트에 'paxel' 바이너리가 있다고 가정
COPY paxel ./paxel
RUN chmod +x ./paxel
ENV PORT=8888
ENV NODE_ENV=production
EXPOSE 8888
CMD ["./paxel"]
