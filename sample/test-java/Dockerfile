# Non-optimal Java Dockerfile
FROM maven:3.9.6-eclipse-temurin-21

RUN apt-get update && apt-get install -y curl wget git unzip zip

WORKDIR /app
COPY Main.java .

RUN javac Main.java

EXPOSE 8000
CMD ["java", "Main"]
