FROM ubuntu:latest

RUN apt-get update
RUN apt-get install -y curl wget git build-essential
RUN apt-get install -y nodejs npm

WORKDIR /app
COPY . .
RUN npm install

ENV NODE_ENV=development
ENV SECRET_KEY=mysecretkey123

EXPOSE 3000
CMD ["npm", "start"]
