FROM nginx:stable-alpine
# 빌드 컨텍스트 루트에서 실행된다고 가정
COPY dist /usr/share/nginx/html
COPY apps/tiptex-web/nginx.conf /etc/nginx/templates/default.conf.template
ENV PAXEL_HOST=paxel
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
