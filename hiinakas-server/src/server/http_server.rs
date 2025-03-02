use std::sync::Arc;

use axum::{routing::get, Extension};
use sqlx::sqlite::SqlitePoolOptions;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tracing::debug;

use crate::server::socketio::socketio_layer;

pub async fn run_server() {
    let pool = SqlitePoolOptions::new()
    .max_connections(5)
    .connect("sqlite:game.db")
    .await
    .expect("Failed to connect to the database");

sqlx::query!(
    "
CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player JSON NOT NULL,
    win_count INTEGER DEFAULT 0, 
    loss_count INTEGER DEFAULT 0
)"
)
.execute(&pool)
.await
.expect("Failed to create game_winners table");

sqlx::query!(
    "
CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_uid TEXT NOT NULL,
    winner JSON NOT NULL,
    other_players JSON NOT NULL,
    game_duration INTEGER NOT NULL,
    game_start_time TEXT NOT NULL,
    game_type INTEGER NOT NULL
)"
)
.execute(&pool)
.await
.expect("Failed to create matches table");

let db_pool = Arc::new(RwLock::new(pool));

    let app = axum::Router::new()
        .route("/health", get(|| async { "OK" }))
        .layer(socketio_layer(db_pool).await)
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:5000").await.unwrap();
    debug!("listening on {}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.unwrap();
}
