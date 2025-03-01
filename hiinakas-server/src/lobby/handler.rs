use std::{ any::Any, sync::Arc };
use prost::Message;
use socketioxide::{ extract::SocketRef, SocketIo };
use tracing::{ debug, error, info };

use crate::{
    game::{ game_instance::GameInstance, player::Player },
    protos::{
        game::{
            GameInstanceAction,
            GameInstanceMessage,
            GameInstanceMessageAction,
            GameTurnFeedback,
            GameTurnResponse,
        },
        lobby::{ LobbyQueueAction, LobbyQueueRequest, LobbyQueueResponse, LobbyStatistics },
    },
};

use super::lobby::Lobby;

#[derive(Debug, Clone)]
pub struct LobbyHandler {
    lobby: Arc<Lobby>,
    io: SocketIo,
}

impl LobbyHandler {
    pub fn new(lobby: Arc<Lobby>, io: SocketIo) -> Self {
        Self {
            lobby,
            io,
        }
    }

    pub async fn connect(&self, socket: &SocketRef) -> Result<(), Box<dyn std::error::Error>> {
        self.lobby.add_socket_user(socket.id.to_string()).await;
        let _ = self.send_statistics().await;
        info!("Client connected {:?}", socket.id);
        //debug!("Socket users: {:?}", self.lobby.get_socket_users().await.read().await);
        Ok(())
    }

    pub async fn disconnect(&self, socket: SocketRef) -> Result<(), Box<dyn std::error::Error>> {
        let socket_users = self.lobby.get_socket_users().await;
        if let Some(user) = socket_users.read().await.get(&socket.id.to_string()) {
            match user.player.as_ref() {
                Some(player) => {
                    let game_instances = self.lobby.get_game_instances().await;
                    let player_clone = player.clone();

                    for game_instance in game_instances {
                        let game_instance_clone = game_instance.clone();

                        if game_instance.is_player_in_game(&player_clone.player_uid).await {
                            let players = game_instance.get_players().await;
                            if
                                let Some(winner) = players
                                    .iter()
                                    .find(|p| p.get_uid() != player_clone.player_uid)
                            {
                                let feedback = GameTurnFeedback {
                                    action: GameInstanceAction::Win.into(),
                                    message: Some(GameInstanceMessage {
                                        r#type: GameInstanceMessageAction::Info.into(),
                                        message: "Game ended!".to_string(),
                                    }),
                                    has_won: true,
                                    has_disconnect: true,
                                };
                                let _ = self.generate_players_game_turn(
                                    game_instance,
                                    feedback
                                ).await;

                                self.lobby.end_game_disconnection(
                                    &game_instance_clone.get_uid().to_string(),
                                    winner.get_uid()
                                ).await;
                            }
                        }
                    }

                    self.lobby.remove_player_from_queue(&player_clone.player_uid).await;
                }
                None => {
                    //error!("Player is none");
                }
            }
        }

        let socket_users = self.lobby.get_socket_users().await;
        socket_users.write().await.remove(&socket.id.to_string());

        let _ = self.send_statistics().await;
        info!("Client disconnected {:?}", socket.id);
        Ok(())
    }

    pub async fn handle_lobby_queue(
        &self,
        socket: &SocketRef,
        message: LobbyQueueRequest
    ) -> Result<(), Box<dyn std::error::Error>> {
        if message.player.is_none() {
            error!("Player is none");
            return Ok(());
        }

        let socket_user = self.lobby.get_socket_user(&socket.id.to_string()).await;
        //debug!("Socket user: {:?}", socket_user);

        if socket_user.is_none() {
            error!("Socket user is none");
            return Ok(());
        }

        let player_uid = match message.player.as_ref() {
            Some(p) => p.player_uid.clone(),
            None => {
                return Ok(());
            }
        };
        let player_uid_clone = player_uid.clone();

        if message.leave {
            let player_clone = match message.player.as_ref() {
                Some(p) => p.clone(),
                None => {
                    return Ok(());
                }
            };
            self.lobby.remove_player_from_queue(&player_clone.player_uid).await;

            socket.leave(self.lobby.get_lobby_queue_uid().await)?;
            socket.leave(player_clone.player_uid)?;

            self.lobby.remove_socket_user(&socket.id.to_string()).await;
            //debug!("Player left queue");
            return Ok(());
        }

        //debug!("{:?}", self.lobby.type_id());
        let player_clone = match message.player.as_ref() {
            Some(p) => p.clone(),
            None => {
                return Ok(());
            }
        };
        self.lobby.add_player_to_queue(player_clone).await;
        socket.join(self.lobby.get_lobby_queue_uid().await)?;
        socket.join(player_uid)?;

        //info!("Player joined queue {:?}", player_uid_clone);

        //debug!("has_socket_user: {:?}", self.lobby.has_socket_user(&socket.id.to_string()).await);
        if !self.lobby.has_socket_user(&socket.id.to_string()).await {
            let player_clone = match message.player.as_ref() {
                Some(p) => p.clone(),
                None => {
                    error!("Player is none???");
                    return Ok(());
                }
            };
            self.lobby.set_socket_user_player(&socket.id.to_string(), player_clone).await;
            let player_uid_clone = player_uid_clone.clone();
            //debug!("Socket user set {:?}", player_uid_clone);
        }

        //debug!("Queue length: {:?}", self.lobby.get_queue().await.len());
        if self.lobby.get_queue().await.len() < message.max_players as usize {
            //debug!("Queue is less than 2");
            let mut response = LobbyQueueResponse::default();
            response.set_action(LobbyQueueAction::Wait.into());
            socket.emit("lobby/queue", vec![response.encode_to_vec()])?;
            return Ok(());
        }

        //debug!("Creating game instance");
        let game_instance = GameInstance::new();
        let game_instance = Arc::new(game_instance);
        let game_uid = game_instance.get_uid().to_string();
        let game_uid_clone = game_uid.clone();

        let queue_players = self.lobby.get_queue().await;
        for queue_player in queue_players {
            game_instance.add_player(
                Player::new(queue_player.player_uid.clone(), queue_player.name.clone())
            ).await?;
        }

        let init_game_uid_clone = game_uid.clone();
        let lobby_clone = self.lobby.clone();
        let game_instance_clone = game_instance.clone();
        let self_clone = self.clone();
        game_instance.init_instance(
            Box::new(move || {
                let lobby_clone = lobby_clone.clone();
                let game_uid_clone = init_game_uid_clone.clone();
                let game_instance_clone = game_instance_clone.clone();
                let game_instance_clone2 = game_instance_clone.clone();
                let handler_clone = self_clone.clone();

                tokio::spawn(async move {
                    let current_player = game_instance_clone.get_current_player().await;
                    let current_player_clone = current_player.clone();
                    let player_uid_clone = current_player.unwrap().get_uid().to_string();
                    let feedback = GameTurnFeedback {
                        action: GameInstanceAction::Win.into(),
                        message: Some(GameInstanceMessage {
                            r#type: GameInstanceMessageAction::Info.into(),
                            message: "Game ended!".to_string(),
                        }),
                        has_won: false,
                        has_disconnect: false,
                    };

                    handler_clone.generate_player_game_turn(
                        game_instance_clone,
                        player_uid_clone,
                        feedback
                    ).await;
                    let player_uid_clone = current_player_clone.unwrap().get_uid().to_string();

                    let next_player = game_instance_clone2.get_next_player().await;
                    let next_player_uid_clone = next_player.unwrap().get_uid().to_string();
                    let feedback = GameTurnFeedback {
                        action: GameInstanceAction::Win.into(),
                        message: Some(GameInstanceMessage {
                            r#type: GameInstanceMessageAction::Info.into(),
                            message: "Game ended!".to_string(),
                        }),
                        has_won: true,
                        has_disconnect: true,
                    };
                    handler_clone.generate_player_game_turn(
                        game_instance_clone2,
                        next_player_uid_clone,
                        feedback
                    ).await;

                    debug!("ENDING GAME TIMER: {:?}, {:?}", game_uid_clone, player_uid_clone);
                    lobby_clone.end_game(&game_uid_clone, &player_uid_clone).await;
                    let _ = handler_clone.send_statistics().await;
                });
            })
        ).await?;
        let lobby_clone = self.lobby.clone();
        //debug!("Game instance initialized {:?}", game_instance.get_uid());

        self.lobby.add_game(game_instance.clone()).await;
        socket.join(game_uid)?;
        //debug!("Game instance added to lobby");

        self.lobby.clear_queue().await;
        let _ = self.send_statistics().await;
        //debug!("Statistics sent");

        let queue_response = LobbyQueueResponse {
            game_uid: game_uid_clone.clone(),
            action: LobbyQueueAction::Start.into(),
        };

        self.io
            .within(self.lobby.get_lobby_queue_uid().await)
            .emit("lobby/queue", vec![queue_response.encode_to_vec()])?;

        //debug!("Queue response sent");

        let feedback: GameTurnFeedback = GameTurnFeedback {
            action: GameInstanceAction::Init.into(),
            message: Some(GameInstanceMessage {
                r#type: GameInstanceMessageAction::Info.into(),
                message: "Game started!".to_string(),
            }),
            has_won: false,
            has_disconnect: false,
        };

        let player_uids: Vec<String> = {
            let players = game_instance.get_players().await;
            players
                .iter()
                .map(|p| p.get_uid().to_string())
                .collect()
        };

        for player_uid in player_uids {
            let player_uid_clone = player_uid.clone();
            self.lobby.set_socket_user_game_uid(&player_uid_clone, &game_uid_clone).await;
            let game_turn = game_instance.generate_game_turn(&player_uid, feedback.clone()).await;
            let response = GameTurnResponse {
                uid: game_instance.get_uid().to_string(),
                game_turn: Some(game_turn),
            };
            let _ = self.io.to(player_uid).emit("game/turn", vec![response.encode_to_vec()]);
            //let _ = lobby_clone.connect_game_to_winner_api(&game_uid_clone, &player_uid_clone).await;
        }
        //debug!("Game turn feedback generated");

        self.lobby.set_new_lobby_queue_uid().await;
        //debug!("New lobby queue uid set");

        // TODO: Connect players to game server

        Ok(())
    }

    pub async fn handle_lobby_statistics(&self) -> Result<(), Box<dyn std::error::Error>> {
        let _ = self.send_statistics().await;
        Ok(())
    }

    async fn send_statistics(&self) -> Result<(), Box<dyn std::error::Error>> {
        let socket_users = self.lobby.get_socket_users().await;
        let statistics = LobbyStatistics {
            player_count: socket_users.read().await.len() as u32,
            game_count: self.lobby.get_game_instances().await.len() as u32,
        };

        self.io.emit("lobby/statistics", vec![statistics.encode_to_vec()])?;
        Ok(())
    }

    pub async fn generate_players_game_turn(
        &self,
        game_instance: Arc<GameInstance>,
        feedback: GameTurnFeedback
    ) {
        let player_uids: Vec<String> = {
            let players = game_instance.get_players().await;
            players
                .iter()
                .map(|p| p.get_uid().to_string())
                .collect()
        };

        for player_uid in player_uids {
            let game_turn = game_instance.generate_game_turn(&player_uid, feedback.clone()).await;
            let response = GameTurnResponse {
                uid: game_instance.get_uid().to_string(),
                game_turn: Some(game_turn),
            };
            let _ = self.io.to(player_uid).emit("game/turn", vec![response.encode_to_vec()]);
        }
    }

    pub async fn generate_player_game_turn(
        &self,
        game_instance: Arc<GameInstance>,
        player_uid: String,
        feedback: GameTurnFeedback
    ) {
        let game_turn = game_instance.generate_game_turn(&player_uid, feedback.clone()).await;
        let response = GameTurnResponse {
            uid: game_instance.get_uid().to_string(),
            game_turn: Some(game_turn),
        };
        let _ = self.io.to(player_uid).emit("game/turn", vec![response.encode_to_vec()]);
    }
}
