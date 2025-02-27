use tracing_subscriber::{fmt, EnvFilter};

mod server;
mod lobby;
mod game;
pub mod protos;
pub mod utils;

#[tokio::main]
async fn main() {
    fmt::Subscriber::builder()
        .with_env_filter(EnvFilter::from_default_env())
        .with_file(true)
        .with_line_number(true)
        .pretty()
        .init();

    server::http_server::run_server().await;
}