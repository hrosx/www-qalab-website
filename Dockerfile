## STAGE 1: RUN
FROM nginx:latest AS ngi
COPY www/ /usr/share/nginx/html/
COPY nginx.conf  /etc/nginx/conf.d/default.conf

EXPOSE 80
