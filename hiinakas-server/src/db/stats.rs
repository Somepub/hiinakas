use std::sync::Arc;
use sqlx::sqlite::SqlitePoolOptions;
use tokio::sync::RwLock;
use sqlx::SqlitePool;
use tracing::info;

fn is_debug() -> bool {
    cfg!(debug_assertions)
}

pub async fn init_database_and_return_pool() -> Arc<RwLock<SqlitePool>> {
    info!("Initializing database connection...");
    
    let db_path = if is_debug() {
        "sqlite:game.db"
    } else {
        "sqlite:/opt/hiinakas/game.db"
    };

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(db_path)
        .await
        .expect("Failed to connect to the database");

    // Create stats table
    sqlx::query!(
        "
    CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_uid TEXT NOT NULL,
        player_name TEXT NOT NULL,
        win_count INTEGER DEFAULT 0, 
        loss_count INTEGER DEFAULT 0
    )"
    )
    .execute(&pool)
    .await
    .expect("Failed to create stats table");

    // Create matches table
    sqlx::query!(
        "
    CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_winner_uid TEXT NOT NULL,
        game_winner_name TEXT NOT NULL,
        game_other_players JSON NOT NULL,
        game_uid TEXT NOT NULL,
        game_duration TEXT NOT NULL,
        game_start_time TEXT NOT NULL,
        game_type INTEGER NOT NULL
    )"
    )
    .execute(&pool)
    .await
    .expect("Failed to create matches table");

    info!("Database initialization complete");
    
    Arc::new(RwLock::new(pool))
} 