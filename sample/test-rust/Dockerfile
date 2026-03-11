# Non-optimal Rust Dockerfile
FROM rust:1.77.0

RUN apt-get update && apt-get install -y curl wget git build-essential cmake

WORKDIR /app
COPY . .

RUN cargo build --release

EXPOSE 8080
CMD ["./target/release/test-rust"]
