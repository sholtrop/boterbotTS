FROM node:13.5.0-alpine
WORKDIR /usr/src/app

RUN apk add --no-cache --virtual .gyp \
  python \
  make \
  g++
RUN ["apk", "add", "--no-cache", "git"]
RUN ["apk", "add", "--no-cache", "ffmpeg"]
COPY package.json .
RUN ["npm", "install"]
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait
ADD . /usr/src/app
RUN ["npm", "run", "build"]
ENTRYPOINT [ "npm", "start" ]
EXPOSE 7001
