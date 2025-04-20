FROM rust:1.75-slim as server-builder
WORKDIR /usr/src/hiinakas-server
COPY . .
COPY ../hiinakas-types ../
RUN apt-get update && \
    apt-get install -y protobuf-compiler && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /usr/local/bin
COPY --from=server-builder /usr/src/hiinakas-server/target/release/hiinakas-server .

CMD ["./hiinakas-server"]