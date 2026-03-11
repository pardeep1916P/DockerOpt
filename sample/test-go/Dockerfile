# Non-optimal Go Dockerfile
FROM golang:1.21

RUN apt-get update && apt-get install -y git curl wget

WORKDIR /app

COPY . .

RUN go build -o server main.go

EXPOSE 8080

CMD ["./server"]
