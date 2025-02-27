use axum::routing::get;
use tower_http::cors::CorsLayer;
use tracing::debug;

use crate::server::socketio::socketio_layer;

pub async fn run_server() {

    let app = axum::Router::new()
        .route("/health", get(|| async { "OK" }))
        .layer(socketio_layer().await)
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:5000")
    .await
    .unwrap();
    debug!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}