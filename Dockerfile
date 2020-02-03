FROM node:13.5.0
WORKDIR /usr/src/app
COPY package.json .
RUN ["npm", "install"]
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait
RUN ["sudo", "apt", "update"]
RUN ["sudo", "apt", "install", "ffmpeg"]

ADD . /usr/src/app
RUN ["npm", "run", "build"]
ENTRYPOINT [ "npm", "start" ]
EXPOSE 7001
