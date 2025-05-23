use prost::Message;
use tracing::{ debug, error, info, trace };
use std::sync::Arc;
use sqlx::Row;

use crate::lobby::lobby::{GameResult, Lobby};

use crate::protos::card::Effect;
use crate::protos::game::{
    GameInstanceAction, GameInstanceMessage, GameInstanceMessageAction, GameTurnFeedback, GameTurnRequest, GameTurnResponse
};
use crate::protos::lobby::{LobbyStatistics, MatchHistory, PlayerStats};
use crate::protos::ws::EventType;
use crate::server::ws_server::WebSocketServer;

use super::game_instance::GameInstance;

#[derive(Debug, Clone)]
pub struct GameHandler {
    lobby: Arc<Lobby>,
    ws_server: Arc<WebSocketServer>,
}

impl GameHandler {
    pub fn new(lobby: Arc<Lobby>, ws_server: Arc<WebSocketServer>) -> Self {
        Self {
            lobby,
            ws_server,
        }
    }

    pub async fn handle_game_turn(
        &self,
        request: GameTurnRequest
    ) -> Result<(), Box<dyn std::error::Error>> {
        if request.uid.is_empty() || request.player.is_none() || Some(request.action) == None {
            error!("Message is invalid: {:?}", request);
            return Ok(());
        }

        let game = self.lobby.get_game_instance(&request.uid).await;
        match game {
            Some(game) => {
                let player = match request.player.as_ref() {
                    Some(p) => p,
                    None => return Ok(()),
                };
                trace!("Game instance found: {:?}", game.get_uid());
                let player_uid = player.player_uid.clone();
                match game.get_players().await.iter().find(|p| p.get_uid() == player_uid) {
                    Some(player) => {
                        if !game.is_my_turn(&player_uid).await {
                            error!("It's not your turn: {:?}", player_uid);
                            let feedback = GameTurnFeedback {
                                action: request.action,
                                message: Some(GameInstanceMessage { 
                                    r#type: GameInstanceMessageAction::Error.into(),
                                    message: "It's not your turn".to_string(),
                                }),
                                has_won: false,
                                has_disconnect: false,
                            };
                            self.generate_player_game_turn(game, player.get_uid().to_string(), feedback).await;
                            return Ok(());
                        }
                
                        let request_clone = request.clone();
                        match request.action() {
                            GameInstanceAction::PlayCard => {
                                self.play_card(request_clone, game).await;
                            }
                            GameInstanceAction::EndTurn => {
                                self.end_turn(request_clone, game).await;
                            }
                            GameInstanceAction::PickUp => {
                                self.pickup_turn(request_clone, game).await;
                            }
                            GameInstanceAction::Init => {
                               // debug!("Game initialized");
                            },
                            _ => {
                                error!("Invalid action: {:?}", request.action);
                            }
                        }
                
                        Ok(())
                    },
                    None => {
                        error!("Player not found: {:?}", player_uid);
                        return Ok(());
                    }
                }
            },
            None => {
                error!("Game instance not found: {:?}", request.uid);
                return Ok(());
            }
        }
    }

    async fn play_card(&self, msg: GameTurnRequest, game: Arc<GameInstance>) {
        if msg.card_id.is_empty() || msg.player.is_none() || Some(msg.action) == None {
            return;
        }

        let game_instance_clone = game.clone();
        let mut player = game.get_current_player().await.unwrap();
        trace!("Playing card: {:?}, Player hand is: {:?}", msg.card_id, player.get_hand_cards());
        let card_rank = match player.get_card(&msg.card_id) {
            Some(card) => card.to_number(),
            None => {
                error!("CARD NOT FOUND FROM HAND??? THIS IS A LIKELY A BUG, BAD BAD BAD! -> Card not found: {:?}", msg.card_id);
                return;
            },
        };

        let play_card_feedback = game.play_card(msg.card_id.to_string()).await;
        if !play_card_feedback.is_played {
            trace!("Failed to play card: {:?}", msg.card_id);
            let feedback = GameTurnFeedback {
                action: GameInstanceAction::PlayCard.into(),
                message: Some(GameInstanceMessage {
                    r#type: GameInstanceMessageAction::Error.into(),
                    message: "Failed to play card".to_string(),
                }),
                has_won: false,
                has_disconnect: false,
            };
            let player_uid = match msg.player.as_ref() {
                Some(p) => p.player_uid.clone(),
                None => return,
            };
            self.generate_player_game_turn(game, player_uid, feedback).await;
            return;
        }
        
        let feedback = GameTurnFeedback {
            action: GameInstanceAction::PlayCard.into(),
            message: Some(GameInstanceMessage {
                r#type: GameInstanceMessageAction::Info.into(),
                message: format!("Card played:{}:{}", play_card_feedback.effect.as_str_name(), card_rank),
            }),
            has_won: false,
            has_disconnect: false,
        };

        if play_card_feedback.effect == Effect::Destroy {
            game_instance_clone.draw_cards(&mut player).await;
        }

        let _ = game_instance_clone.look_next_turn().await;
        let _ = self.generate_players_game_turn(game, feedback).await;
        trace!("Card played: {:?}", msg.card_id);
    }

    async fn end_turn(&self, msg: GameTurnRequest, game: Arc<GameInstance>) {
        let player_uid = match msg.player.as_ref() {
            Some(p) => p.player_uid.clone(),
            None => return,
        };
        let game_instance_clone = game.clone();
        let game_instance_uid = game_instance_clone.get_uid().to_string();

        if game.is_win_condition(&player_uid, false).await {
            let feedback = GameTurnFeedback {
                action: GameInstanceAction::Win.into(),
                message: Some(GameInstanceMessage {
                    r#type: GameInstanceMessageAction::Info.into(),
                    message: format!("Game over:{}", msg.player.unwrap().name),
                }),
                has_won: true,
                has_disconnect: false,
            };
            self.generate_players_game_turn(game, feedback).await;
            self.lobby.end_game(&game_instance_uid, &player_uid, GameResult::Default).await;
            let _ = self.send_statistics().await;
            trace!("Game ended: {:?}", game_instance_uid);
            return; 
        }

        if game.get_turn_moves().await <= 0 {
            let feedback = GameTurnFeedback {
                action: GameInstanceAction::EndTurn.into(),
                message: Some(GameInstanceMessage {
                    r#type: GameInstanceMessageAction::Error.into(),
                    message: "Failed to end turn".to_string(),
                }),
                has_won: false,
                has_disconnect: false,
            };
            self.generate_player_game_turn(game_instance_clone, player_uid, feedback).await;
            return;
        }

        let feedback = GameTurnFeedback {
            action: GameInstanceAction::EndTurn.into(),
            message: Some(GameInstanceMessage {
                r#type: GameInstanceMessageAction::Info.into(),
                message: "Turn ended".to_string(),
            }),
            has_won: false,
            has_disconnect: false,
        };
        match game.end_turn().await {
            true => {
                self.generate_players_game_turn(game, feedback).await;
            }
            false => {
                error!("Failed to end turn: {:?}", player_uid);
                let feedback = GameTurnFeedback {
                    action: GameInstanceAction::EndTurn.into(),
                    message: Some(GameInstanceMessage {
                        r#type: GameInstanceMessageAction::Error.into(),
                        message: "Failed to end turn".to_string(),
                    }),
                    has_won: false,
                    has_disconnect: false,
                };
                self.generate_player_game_turn(game_instance_clone, player_uid, feedback).await;
            }
        }
    }

    async fn pickup_turn(&self, msg: GameTurnRequest, game: Arc<GameInstance>) {
        let player_uid = match msg.player.as_ref() {
            Some(p) => p.player_uid.clone(),
            None => return,
        };
        let player_uid_clone = player_uid.clone();
        if game.pickup_turn().await.is_ok() {
            let feedback = GameTurnFeedback {
                action: GameInstanceAction::PickUp.into(),
                message: Some(GameInstanceMessage {
                    r#type: GameInstanceMessageAction::Info.into(),
                    message: format!("Turn picked up: {}", msg.player.unwrap().name),
                }),
                has_won: false,
                has_disconnect: false,
            };
            self.generate_players_game_turn(game, feedback).await;
        } else {
            let feedback = GameTurnFeedback {
                action: GameInstanceAction::PickUp.into(),
                message: Some(GameInstanceMessage {
                    r#type: GameInstanceMessageAction::Error.into(),
                    message: "Failed to pickup turn".to_string(),
                }),
                has_won: false,
                has_disconnect: false,
            };
            self.generate_player_game_turn(game, player_uid, feedback).await;
        }
        trace!("Turn picked up: {:?}", player_uid_clone);
    }

    async fn generate_players_game_turn(
        &self,
        game_instance: Arc<GameInstance>,
        feedback: GameTurnFeedback
    ) {
        for player in game_instance.get_players().await {
            let game_turn = game_instance.generate_game_turn(&player.get_uid().to_string(), feedback.clone()).await;
            let response = GameTurnResponse {
                uid: game_instance.get_uid().to_string(),
                game_turn: Some(game_turn),
            };
            match self.ws_server.to(player.get_connection_id().to_string()).emit(EventType::GameTurn, response.encode_to_vec()).await {
                Ok(_) => {
                    trace!("Game turn sent to player {:?}", player.get_uid());
                }
                Err(_e) => {
                    error!("Failed to send game turn to player {:?}: {:?}", player.get_uid(), _e);
                }
            }
        }
    }

    async fn generate_player_game_turn(
        &self,
        game_instance: Arc<GameInstance>,
        player_uid: String,
        feedback: GameTurnFeedback
    ) {
        let player_uid_clone = player_uid.clone();
        let game_turn = game_instance.generate_game_turn(&player_uid_clone, feedback).await;
        let response = GameTurnResponse {
            uid: game_instance.get_uid().to_string(),
            game_turn: Some(game_turn),
        };

        let connection_id = game_instance.get_player_connection_id(&player_uid_clone).await;
        match self.ws_server.to(connection_id).emit(EventType::GameTurn, response.encode_to_vec()).await {
            Ok(_) => {
                trace!("Game turn sent to player {:?}", player_uid_clone);
            }
            Err(_e) => {
                error!("Failed to send game turn to player {:?}: {:?}", player_uid_clone, _e);
            }
        }
    }

    async fn send_statistics(
        &self,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let socket_users = self.lobby.get_socket_users().await;

        let db_pool = self.lobby.get_pool();
        let db_pool = db_pool.read().await;
        let player_stats_records = sqlx
            ::query("SELECT player_uid, player_name, win_count, loss_count FROM stats ORDER BY win_count DESC LIMIT 10")
            .fetch_all(&*db_pool).await?;

        let match_history_records = sqlx
            ::query(
                "SELECT game_winner_uid, game_winner_name, game_other_players, game_uid, game_duration, game_start_time, game_type FROM matches"
            )
            .fetch_all(&*db_pool).await?;
        let statistics = LobbyStatistics {
            player_count: socket_users.read().await.len() as u32,
            game_count: self.lobby.get_game_instances().await.len() as u32,
            player_stats: player_stats_records
                .iter()
                .map(|row| PlayerStats {
                    uid: row.get::<String, _>("player_uid"),
                    name: row.get::<String, _>("player_name"),
                    wins: row.get::<i64, _>("win_count") as u32,
                    losses: row.get::<i64, _>("loss_count") as u32,
                })
                .collect(),
            match_history: match_history_records
                .iter()
                .map(|row| MatchHistory {
                    game_uid: row.get::<String, _>("game_uid"),
                    winner_uid: row.get::<String, _>("game_winner_uid"),
                    winner_name: row.get::<String, _>("game_winner_name"),
                    duration: row.get::<String, _>("game_duration").parse::<u32>().unwrap(),
                    game_type: row.get::<i64, _>("game_type") as u32,
                    other_players: row.get::<String, _>("game_other_players")
                        .split(',')
                        .map(|s| s.to_string())
                        .collect(),
                })
                .collect(),
        };

        match self.ws_server.emit(EventType::LobbyStatistics, statistics.encode_to_vec()).await {
            Ok(_) => {
                trace!("Statistics sent");
            }
            Err(_e) => {
                error!("Failed to send statistics: {:?}", _e);
            }
        }
        Ok(())
    }

}
