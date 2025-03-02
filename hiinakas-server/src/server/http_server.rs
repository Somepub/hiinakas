use axum::routing::get;
use tower_http::cors::CorsLayer;
use tracing::info;

use crate::server::{socketio::socketio_layer, stats};

pub async fn run_server() {

    let db_pool = stats::init_database_and_return_pool().await;

    let app = axum::Router::new()
        .route("/health", get(|| async { "OK" }))
        .layer(socketio_layer(db_pool).await)
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:5000").await.unwrap();
    info!("listening on {}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.unwrap();
}
