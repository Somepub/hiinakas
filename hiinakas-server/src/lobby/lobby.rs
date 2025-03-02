use std::sync::Arc;
use hashbrown::HashMap;
use serde::{ Deserialize, Serialize };
use sqlx::SqlitePool;
use tokio::sync::RwLock;
use smallvec::SmallVec;
use tracing::{ error, info };
use uuid::Uuid;

use crate::{ game::{self, game_instance::GameInstance}, protos::lobby::LobbyPlayer };

#[derive(Debug, Clone)]
pub struct SocketUser {
    pub game_uid: Option<String>,
    pub player: Option<LobbyPlayer>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(into = "u8")]
pub enum GameResult {
    DefaultWin,
    Win,
    Loss,
}

impl Into<u8> for GameResult {
    fn into(self) -> u8 {
        match self {
            GameResult::DefaultWin => 0,
            GameResult::Win => 1,
            GameResult::Loss => 2,
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
    queue: Arc<RwLock<SmallVec<[LobbyPlayer; 4]>>>,
    games: Arc<RwLock<HashMap<String, Arc<GameInstance>>>>,
    socket_users: Arc<RwLock<HashMap<String, SocketUser>>>,
    lobby_queue_uid: Arc<RwLock<String>>,
    db_pool: Arc<RwLock<SqlitePool>>,
}

pub enum GameType {
    TwoPlayer,
    ThreePlayer,
    FourPlayer,
    FivePlayer,
}

impl Lobby {
    pub fn new(db_pool: Arc<RwLock<SqlitePool>>) -> Self {
        Self {
            db_pool,
            queue: Arc::new(RwLock::new(SmallVec::new())),
            games: Arc::new(RwLock::new(HashMap::new())),
            socket_users: Arc::new(RwLock::new(HashMap::new())),
            lobby_queue_uid: Arc::new(RwLock::new(Uuid::new_v4().to_string())),
        }
    }

    pub async fn add_player_to_queue(&self, player: LobbyPlayer) {
        let mut queue = self.queue.write().await;
        if !queue.iter().any(|p| p.player_uid == player.player_uid) {
            queue.push(player);
            //debug!("Added player to queue. Current queue size: {}", queue.len());
        } else {
            //debug!("Player already in queue");
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

    pub async fn remove_player_from_queue(&self, player_uid: &str) {
        let mut queue = self.queue.write().await;
        if let Some(pos) = queue.iter().position(|p| p.player_uid == player_uid) {
            queue.remove(pos);
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

    pub async fn get_queue(&self) -> Vec<LobbyPlayer> {
        let queue = self.queue.read().await;
        queue.to_vec()
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

    pub async fn end_game_disconnection(&self, game_uid: &str, winner_player_uid: &str) {
        //debug!("Ending game by disconnection: {:?}, {:?}", game_uid, winner_player_uid);
        if let Some(game_instance) = self.get_game_instance(game_uid).await {
            match self.win_by_default(game_uid, winner_player_uid).await {
                Ok(_) => {
                    
                    info!("Game ended by disconnection: {:?}, {:?}", game_uid, winner_player_uid);
                }
                Err(e) => {
                    error!("Failed to end game: {:?}, game_uid: {:?}", e, game_uid);
                }
            }
            let _ = game_instance.stop_timer().await;
            let mut games = self.games.write().await;
            games.remove(game_uid);
        }
    }

    pub async fn end_game(&self, game_uid: &str, winner_player_uid: &str) {
        //debug!("Ending game by default: {:?}", game_uid);
        if let Some(game_instance) = self.get_game_instance(game_uid).await {
            if game_instance.get_current_player().await.unwrap().get_uid() == winner_player_uid {
                match self.win_by_default(game_uid, winner_player_uid).await {
                    Ok(_) => {
                        
                        info!("Game ended by default: {:?}", game_uid);
                    }
                    Err(e) => {
                        error!("Failed to end game: {:?}, game_uid: {:?}", e, game_uid);
                    }
                }
                let mut games = self.games.write().await;
                games.remove(game_uid);
            }
            let _ = game_instance.stop_timer().await;
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
        let mut db_pool = self.db_pool.write().await;
        let mut conn = db_pool.acquire().await?;
        let game_instance = self.get_game_instance(game_uid).await.unwrap();
        let game_type = game_instance.get_players().await.len();

        let game_type = match game_type {
            2 => GameType::TwoPlayer,
            3 => GameType::ThreePlayer,
            4 => GameType::FourPlayer,
            5 => GameType::FivePlayer,
            _ => return Err("Invalid game type".into()),
        };

        Ok(())
    }


}
