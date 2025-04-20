use std::sync::Arc;

use hashbrown::HashMap;
use serde::{ Deserialize, Serialize };
use sqlx::SqlitePool;
use tokio::sync::RwLock;
use smallvec::SmallVec;
use tracing::{ debug, error, info, trace };
use uuid::Uuid;

use crate::{ game::game_instance::GameInstance, protos::lobby::{GameType, LobbyPlayer} };

#[derive(Debug, Clone)]
pub struct SocketUser {
    pub game_uid: Option<String>,
    pub player: Option<LobbyPlayer>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(into = "i32", from = "i32")]
pub enum GameResult {
    Disconnect = 0,
    Default = 1,
    Timeout = 2,
}

impl From<GameResult> for i32 {
    fn from(result: GameResult) -> Self {
        match result {
            GameResult::Disconnect => 0,
            GameResult::Default => 1,
            GameResult::Timeout => 2,
        }
    }
}

impl From<i32> for GameResult {
    fn from(value: i32) -> Self {
        match value {
            0 => GameResult::Disconnect,
            1 => GameResult::Default,
            2 => GameResult::Timeout,
            _ => GameResult::Disconnect,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionRequest {
    uid: String,
    name: String,
    game_uid: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionResponse {
    connection_uid: String,
    game_start_time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameWinnerRequest {
    uid: String,
    name: String,
    connection_uid: String,
    game_uid: String,
    game_start_time: String,
    game_win_result: GameResult,
    game_name: String,
}

#[derive(Debug, Clone)]
pub struct Lobby {
    queue: Arc<RwLock<HashMap<GameType, SmallVec<[LobbyPlayer; GameType::FivePlayer as usize]>>>>,
    games: Arc<RwLock<HashMap<String, Arc<GameInstance>>>>,
    socket_users: Arc<RwLock<HashMap<String, SocketUser>>>,
    lobby_queue_uid: Arc<RwLock<String>>,
    connection_map: Arc<RwLock<HashMap<String, ConnectionResponse>>>,
    db_pool: Arc<RwLock<SqlitePool>>,
}

fn is_debug() -> bool {
    cfg!(debug_assertions)
}

impl Lobby {
    pub fn new(db_pool: Arc<RwLock<SqlitePool>>) -> Self {
        Self {
            queue: Arc::new(RwLock::new(HashMap::new())),
            games: Arc::new(RwLock::new(HashMap::new())),
            socket_users: Arc::new(RwLock::new(HashMap::new())),
            lobby_queue_uid: Arc::new(RwLock::new(Uuid::new_v4().to_string())),
            connection_map: Arc::new(RwLock::new(HashMap::new())),
            db_pool: db_pool,
        }
    }

    pub async fn add_player_to_queue(&self, player: LobbyPlayer, game_type: GameType) {
        let mut queue = self.queue.write().await;
        let queue_entry = queue.entry(game_type).or_insert_with(|| SmallVec::new());
        if !queue_entry.iter().any(|p| p.player_uid == player.player_uid) {
            queue_entry.push(player);
        }
    }

    pub async fn add_game(&self, game: Arc<GameInstance>) {
        let mut games = self.games.write().await;
        games.insert(game.get_uid().to_string(), game);
    }

    pub async fn add_socket_user(&self, socket_uid: String) {
        let mut socket_users = self.socket_users.write().await;
        socket_users.insert(socket_uid, SocketUser {
            game_uid: None,
            player: None,
        });
    }

    pub async fn is_player_in_queue(&self, player_uid: &str) -> bool {
        let queue = self.queue.read().await;
        queue.iter().any(|(_, players)| players.iter()
            .any(|p| p.player_uid == player_uid))
    }

    pub async fn remove_player_from_all_queues(&self, player_uid: &str) {
        if self.is_player_in_queue(player_uid).await {
            self.remove_player_from_queue(player_uid).await;
        }

        debug!("Removed player {} from all queues", player_uid);
    }

    pub async fn remove_player_from_queue(&self, player_uid: &str) {
        let mut queue = self.queue.write().await;
        for (_game_type, players) in queue.iter_mut() {
            if let Some(pos) = players.iter().position(|p| p.player_uid == player_uid) {
                players.remove(pos);
            }
        }
    }

    pub async fn remove_socket_user(&self, socket_uid: &str) {
        let mut socket_users = self.socket_users.write().await;
        socket_users.remove(socket_uid);
    }

    pub async fn get_game_instance(&self, uid: &str) -> Option<Arc<GameInstance>> {
        let games = self.games.read().await;
        games.get(uid).cloned()
    }

    pub async fn get_queue(&self, game_type: GameType) -> Vec<LobbyPlayer> {
        self.queue.read().await.get(&game_type).cloned().unwrap_or_default().to_vec()
    }

    pub async fn get_game_instances(&self) -> Vec<Arc<GameInstance>> {
        let games = self.games.read().await;
        games.values().cloned().collect()
    }

    pub async fn get_socket_users(&self) -> Arc<RwLock<HashMap<String, SocketUser>>> {
        self.socket_users.clone()
    }

    pub async fn get_socket_user(&self, socket_uid: &str) -> Option<SocketUser> {
        let socket_users = self.socket_users.read().await;
        socket_users.get(socket_uid).cloned()
    }

    pub async fn get_lobby_queue_uid(&self) -> String {
        self.lobby_queue_uid.read().await.clone()
    }

    pub async fn has_socket_user(&self, socket_uid: &str) -> bool {
        let socket_users = self.socket_users.read().await;
        let socket_user = socket_users.get(socket_uid);
        if let Some(user) = socket_user {
            user.player.is_some()
        } else {
            false
        }
    }

    pub async fn end_game(&self, game_uid: &str, winner_player_uid: &str, game_result: GameResult) {
        debug!("Ending game: {:?}", game_uid);
        if let Some(game_instance) = self.get_game_instance(game_uid).await {
                match game_result {
                    GameResult::Default => {
                        if game_instance.get_current_player().await.unwrap().get_uid() == winner_player_uid {
                            match self.win_by_default(game_uid, winner_player_uid).await {
                                Ok(_) => {
                                    info!("Game ended by default: {:?}", game_uid);
                                }
                                Err(e) => {
                                    error!(
                                        "Failed to end game by default: {:?}, game_uid: {:?}",
                                        e,
                                        game_uid
                                    );
                                }
                            }
                        }
                    }
                    GameResult::Disconnect => {
                        match self.win_by_disconnection(game_uid, winner_player_uid).await {
                            Ok(_) => {
                                info!("Game ended by disconnection: {:?}", game_uid);
                            }
                            Err(e) => {
                                error!(
                                    "Failed to end game by disconnection: {:?}, game_uid: {:?}",
                                    e,
                                    game_uid
                                );
                            }
                        }
                    }
                    GameResult::Timeout => {
                        match self.win_by_timeout(game_uid, winner_player_uid).await {
                            Ok(_) => {
                                info!("Game ended by timeout: {:?}", game_uid);
                            }
                            Err(e) => {
                                error!(
                                    "Failed to end game by timeout: {:?}, game_uid: {:?}",
                                    e,
                                    game_uid
                                );
                            }
                        }
                    }
                }
                let _ = game_instance.clean().await;
                let mut games = self.games.write().await;
                games.remove(game_uid);
                debug!("Game removed from lobby: {:?}", game_uid);
        }
    }

    pub async fn set_socket_user_player(&self, socket_uid: &str, player: LobbyPlayer) {
        let mut socket_users = self.socket_users.write().await;
        let socket_user = match socket_users.get_mut(socket_uid) {
            Some(user) => user,
            None => {
                return;
            }
        };
        socket_user.player = Some(player);
    }

    pub async fn set_socket_user_game_uid(&self, socket_uid: &str, game_uid: &str) {
        let mut socket_users = self.socket_users.write().await;
        if let Some(user) = socket_users.get_mut(socket_uid) {
            user.game_uid = Some(game_uid.to_string());
            //debug!("Socket user game uid set: {:?}, {:?}", socket_uid, game_uid);
        }
    }

    pub async fn set_new_lobby_queue_uid(&self) {
        let mut lobby_queue_uid = self.lobby_queue_uid.write().await;
        *lobby_queue_uid = Uuid::new_v4().to_string();
    }

    pub async fn clear_queue(&self) {
        let mut queue = self.queue.write().await;
        queue.clear();
    }

    pub async fn win_by_default(
        &self,
        game_uid: &str,
        winner_player_uid: &str
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.save_game_result(game_uid, winner_player_uid, GameResult::Default).await?;
        Ok(())
    }

    pub async fn win_by_disconnection(
        &self,
        game_uid: &str,
        winner_player_uid: &str
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.save_game_result(game_uid, winner_player_uid, GameResult::Disconnect).await?;
        Ok(())
    }

    pub async fn win_by_timeout(
        &self,
        game_uid: &str,
        winner_player_uid: &str
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.save_game_result(game_uid, winner_player_uid, GameResult::Timeout).await?;
        Ok(())
    }

    pub async fn save_game_result(&self, game_uid: &str, winner_player_uid: &str, game_result: GameResult) -> Result<(), Box<dyn std::error::Error>>  {
        let db_pool = self.db_pool.read().await;
        let game_instance = self.get_game_instance(game_uid).await.unwrap();

        let players = game_instance.get_players().await;
        let winner = players
            .iter()
            .find(|p| p.get_uid() == winner_player_uid)
            .ok_or("Winner player not found")?;

        let other_players: Vec<_> = players
            .iter()
            .filter(|p| p.get_uid() != winner_player_uid)
            .collect();

        let game_start_time = game_instance.get_start_time().await;
        let game_duration = (chrono::Utc::now() - game_start_time).num_seconds();
        let game_type = match players.len() {
            2 => GameType::TwoPlayer,
            3 => GameType::ThreePlayer,
            4 => GameType::FourPlayer,
            5 => GameType::FivePlayer,
            _ => {
                return Err("Invalid number of players".into());
            }
        };

        for player in &players {
            let player_uid = player.get_public_uid();
            let player_name = player.get_name();
            
            
            let player_exists = sqlx::query!(
                r#"SELECT COUNT(*) as count FROM stats WHERE player_uid = ?"#,
                player_uid
            )
            .fetch_one(&*db_pool)
            .await?
            .count > 0;
            
            if player_exists {
                let is_winner = player.get_uid() == winner_player_uid;
                if is_winner {
                    sqlx::query!(
                        r#"UPDATE stats SET win_count = win_count + 1 WHERE player_uid = ?"#,
                        player_uid
                    )
                    .execute(&*db_pool)
                    .await?;
                } else {
                    sqlx::query!(
                        r#"UPDATE stats SET loss_count = loss_count + 1 WHERE player_uid = ?"#,
                        player_uid
                    )
                    .execute(&*db_pool)
                    .await?;
                }
            } else {
                let is_winner = player.get_uid() == winner_player_uid;

                let win_count = if is_winner { 1 } else { 0 };
                let loss_count = if is_winner { 0 } else { 1 };

                sqlx::query!(
                    r#"INSERT INTO stats (player_uid, player_name, win_count, loss_count) 
                       VALUES (?, ?, ?, ?)"#,
                    player_uid,
                    player_name,
                    win_count,
                    loss_count
                )
                .execute(&*db_pool)
                .await?;
            }
        }

        let other_players_json = serde_json::to_string(
            &other_players
                .iter()
                .map(|p| {
                    serde_json::json!({
                    "player_uid": p.get_public_uid(),
                    "player_name": p.get_name()
                })
                })
                .collect::<Vec<_>>()
        )?;

        let winner_clone = winner.clone();
        let winner_public_uid = winner_clone.get_public_uid();
        let winner_name = winner_clone.get_name();
        let game_duration_str = game_duration.to_string();
        let game_start_time_str = game_start_time.to_rfc3339();
        let game_type_int = i32::from(game_type);

        sqlx::query!(
            r#"
            INSERT INTO matches (
                game_winner_uid, game_winner_name, game_other_players, game_uid, game_duration, game_start_time, 
                game_type
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
                winner_public_uid,
                winner_name,
                other_players_json,
                game_uid,
                game_duration_str,
                game_start_time_str,
                game_type_int
            )
            .execute(&*db_pool).await?;

        Ok(())
    }

    pub async fn get_connection_uid_by_player_uid(&self, player_uid: &str) -> Option<String> {
        let socket_users = self.socket_users.read().await;
        
        for (connection_id, socket_user) in socket_users.iter() {
            if let Some(player) = &socket_user.player {
                if player.player_uid == player_uid {
                    return Some(connection_id.clone());
                }
            }
        }
        
        None
    }
}
