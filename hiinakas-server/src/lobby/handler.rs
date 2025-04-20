use prost::Message;
use std::sync::Arc;
use tracing::{debug, error, info, trace};

use crate::{
    game::{game_instance::GameInstance, player::Player},
    lobby::lobby::GameResult,
    protos::{
        game::{
            GameInstanceAction, GameInstanceMessage, GameInstanceMessageAction, GameTurnFeedback,
            GameTurnResponse,
        },
        lobby::{
            GameType, LobbyQueueAction, LobbyQueueRequest, LobbyQueueResponse, LobbyStatistics,
        },
        ws::EventType,
    },
    server::ws_server::WebSocketServer,
};

use super::lobby::Lobby;

#[derive(Debug, Clone)]
pub struct LobbyHandler {
    lobby: Arc<Lobby>,
    ws_server: Arc<WebSocketServer>,
}

impl LobbyHandler {
    pub fn new(lobby: Arc<Lobby>, ws_server: Arc<WebSocketServer>) -> Self {
        Self { lobby, ws_server }
    }

    pub async fn connect(&self, connection_id: String) -> Result<(), Box<dyn std::error::Error>> {
        //debug!("Connecting client {:?}", socket.id);
        //debug!("Socket users: {:?}", self.lobby.get_socket_users().await.read().await);
        self.lobby.add_socket_user(connection_id.clone()).await;
        let _ = self.send_statistics().await;
        info!("Client connected {:?}", connection_id);

        Ok(())
    }

    pub async fn disconnect(
        &self,
        connection_id: String,
    ) -> Result<(), Box<dyn std::error::Error>> {
        debug!("Disconnecting client {:?}", connection_id);
        let socket_users = self.lobby.get_socket_users().await;
        if let Some(user) = socket_users.read().await.get(&connection_id) {
            debug!("User {:?} found in socket users", connection_id);
            match user.player.as_ref() {
                Some(player) => {
                    debug!("Player {:?} found in socket user", player.player_uid);
                    let game_instances = self.lobby.get_game_instances().await;
                    let player_clone = player.clone();

                    for game_instance in game_instances {
                        let game_instance_clone = game_instance.clone();

                        if game_instance
                            .is_player_in_game(&player_clone.player_uid)
                            .await
                        {
                            let players = game_instance.get_players().await;
                            if let Some(winner) = players
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
                                let _ = self
                                    .generate_player_game_turn(
                                        game_instance,
                                        winner.get_uid().to_string(),
                                        feedback,
                                    )
                                    .await;

                                self.lobby
                                    .end_game(
                                        &game_instance_clone.get_uid().to_string(),
                                        winner.get_uid(),
                                        GameResult::Disconnect,
                                    )
                                    .await;
                            }
                        }
                    }

                    self.lobby
                        .remove_player_from_all_queues(&player_clone.player_uid)
                        .await;
                }
                None => {}
            }
        }

        let socket_users = self.lobby.get_socket_users().await;
        socket_users.write().await.remove(&connection_id);

        let _ = self.send_statistics().await;
        info!("Client disconnected {:?}", connection_id);
        Ok(())
    }

    pub async fn handle_lobby_queue(
        &self,
        connection_id: String,
        message: LobbyQueueRequest,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if message.player.is_none() {
            error!("Player is none");
            return Ok(());
        }

        debug!("Lobby queue event processed for {:?}", connection_id);

        let socket_user = self.lobby.get_socket_user(&connection_id).await;
        let player_ref = message.player.as_ref();
        info!(
            "Socket user {:?} with name of : {:?}",
            connection_id,
            player_ref.clone().unwrap().name
        );

        if socket_user.is_none() {
            error!(
                "Socket user is none, THIS SHOULD NOT HAPPEN! [Unless....] {:?} {:?}",
                connection_id, message
            );
            return Ok(());
        }

        let player_uid = match player_ref {
            Some(p) => p.player_uid.clone(),
            None => {
                return Ok(());
            }
        };

        if message.leave {
            let player_clone = match message.player.as_ref() {
                Some(p) => p.clone(),
                None => {
                    return Ok(());
                }
            };
            self.lobby
                .remove_player_from_queue(&player_clone.player_uid)
                .await;

            debug!("Player left queue {:?}", player_uid);
            return Ok(());
        }

        debug!(
            "Socket {:?}: is trying to join queue =: {:?}",
            connection_id,
            message.player.as_ref().unwrap().name
        );
        let player_clone = match message.player.as_ref() {
            Some(p) => p.clone(),
            None => {
                return Ok(());
            }
        };

        let game_type = match GameType::from_i32(message.game_type) {
            Some(game_type) => game_type,
            None => {
                error!("Invalid game type: {:?}", message.game_type);
                return Ok(());
            }
        };

        self.lobby
            .add_player_to_queue(player_clone, game_type)
            .await;

        trace!("Player joined queue {:?}", player_uid);

        trace!(
            "has_socket_user: {:?}",
            self.lobby.has_socket_user(&connection_id).await
        );
        if !self.lobby.has_socket_user(&connection_id).await {
            let player_clone = match message.player.as_ref() {
                Some(p) => p.clone(),
                None => {
                    error!("Player is none???, THIS SHOULD NOT HAPPEN!");
                    return Ok(());
                }
            };
            self.lobby
                .set_socket_user_player(&connection_id, player_clone)
                .await;
            trace!("Socket user set {:?}", player_uid);
        }

        let queue_game_type_max_players = match game_type {
            GameType::TwoPlayer => 2,
            GameType::ThreePlayer => 3,
            GameType::FourPlayer => 4,
            GameType::FivePlayer => 5,
        };

        debug!(
            "Queue length: {:?}, GameType: {:?}, Queue Max players: {:?}, Game on {:?}",
            self.lobby.get_queue(game_type).await.len(),
            game_type,
            queue_game_type_max_players,
            !self.lobby.get_queue(game_type).await.len() < queue_game_type_max_players
        );
        if self.lobby.get_queue(game_type).await.len() < queue_game_type_max_players {
            debug!(
                "Player {:?}: is waiting for more players ",
                message.player.as_ref().unwrap().name
            );

            let mut response = LobbyQueueResponse::default();
            response.set_action(LobbyQueueAction::Wait.into());
            match self
                .ws_server
                .to(connection_id.clone())
                .emit(EventType::LobbyQueue, response.encode_to_vec())
                .await
            {
                Ok(_) => {
                    trace!("Queue response sent");
                }
                Err(_e) => {
                    error!("Failed to send queue response: {:?}", _e);
                }
            }
            return Ok(());
        }

        debug!(
            "Player {:?}: Creating game instance",
            message.player.as_ref().unwrap().name
        );
        let game_instance = GameInstance::new();
        let game_instance = Arc::new(game_instance);
        let game_uid = game_instance.get_uid().to_string();
        let game_uid_clone = game_uid.clone();

        let queue_players = self.lobby.get_queue(game_type).await;
        trace!("Queue players: {:?}", queue_players);
        for queue_player in queue_players {
            let inner_connection_id = match self
                .lobby
                .get_connection_uid_by_player_uid(&queue_player.player_uid)
                .await
            {
                Some(conn_id) => conn_id,
                None => {
                    error!(
                        "Could not find connection ID for player {}",
                        queue_player.player_uid
                    );
                    continue;
                }
            };
            trace!("inner conn: {:?}", inner_connection_id);
            game_instance
                .add_player(Player::new(
                    queue_player.player_uid.clone(),
                    queue_player.public_uid.clone(),
                    inner_connection_id.clone(),
                    queue_player.name.clone(),
                ))
                .await?;
            trace!("Done adding player");
        }
        trace!("Queue players done.");

        let init_game_uid_clone = game_uid.clone();
        let lobby_clone = self.lobby.clone();
        let lobby_clone2 = self.lobby.clone();
        let game_instance_clone = game_instance.clone();
        let self_clone = self.clone();
        trace!("Initalizing game timeout");
        game_instance
            .init_instance(Box::new(move || {
                let lobby_clone = lobby_clone.clone();
                let game_uid_clone = init_game_uid_clone.clone();
                let game_instance_clone = game_instance_clone.clone();
                let game_instance_clone2 = game_instance_clone.clone();
                let handler_clone = self_clone.clone();

                tokio::spawn(async move {
                    let current_player = game_instance_clone.get_current_player().await;
                    let next_player = game_instance_clone2.get_next_player().await.clone();
                    let next_player_clone = game_instance_clone2.get_next_player().await.clone();
                    let current_player_clone = current_player.clone();
                    let player_uid_clone = current_player.unwrap().get_uid().to_string();
                    let feedback = GameTurnFeedback {
                        action: GameInstanceAction::Win.into(),
                        message: Some(GameInstanceMessage {
                            r#type: GameInstanceMessageAction::Info.into(),
                            message: format!("Game over:{}", next_player_clone.unwrap().get_name()),
                        }),
                        has_won: false,
                        has_disconnect: true,
                    };

                    handler_clone
                        .generate_player_game_turn(game_instance_clone, player_uid_clone, feedback)
                        .await;
                    let player_uid_clone = current_player_clone.unwrap().get_uid().to_string();

                    let next_player_uid_clone = next_player.unwrap().get_uid().to_string();
                    let next_player_uid_clone2 = next_player_uid_clone.clone();
                    let feedback = GameTurnFeedback {
                        action: GameInstanceAction::Win.into(),
                        message: Some(GameInstanceMessage {
                            r#type: GameInstanceMessageAction::Info.into(),
                            message: "Game ended!".to_string(),
                        }),
                        has_won: true,
                        has_disconnect: true,
                    };
                    handler_clone
                        .generate_player_game_turn(
                            game_instance_clone2,
                            next_player_uid_clone,
                            feedback,
                        )
                        .await;

                    trace!(
                        "ENDING GAME TIMER: {:?}, {:?}",
                        game_uid_clone,
                        player_uid_clone
                    );
                    lobby_clone
                        .end_game(
                            &game_uid_clone,
                            &next_player_uid_clone2,
                            GameResult::Timeout,
                        )
                        .await;
                    let _ = handler_clone.send_statistics().await;
                });
            }))
            .await?;
        trace!("Game instance initialized {:?}", game_instance.get_uid());

        self.lobby.add_game(game_instance.clone()).await;
        trace!("Game instance added to lobby");

        self.lobby.clear_queue(game_type).await;
        let _ = self.send_statistics().await;
        trace!("Statistics sent");

        let feedback: GameTurnFeedback = GameTurnFeedback {
            action: GameInstanceAction::Init.into(),
            message: Some(GameInstanceMessage {
                r#type: GameInstanceMessageAction::Info.into(),
                message: "Game started!".to_string(),
            }),
            has_won: false,
            has_disconnect: false,
        };

        let players = game_instance.get_players().await;

        let player_uids: Vec<String> =
            { players.iter().map(|p| p.get_uid().to_string()).collect() };

        let connection_ids: Vec<String> = {
            players
                .iter()
                .map(|p| p.get_connection_id().to_string())
                .collect()
        };

        for connection_id in connection_ids {
            let queue_response = LobbyQueueResponse {
                game_uid: game_uid_clone.clone(),
                action: LobbyQueueAction::Start.into(),
            };

            match self
                .ws_server
                .to(connection_id)
                .emit(EventType::LobbyQueue, queue_response.encode_to_vec())
                .await
            {
                Ok(_) => {
                    debug!("Queue response sent");
                }
                Err(e) => {
                    error!("Failed to send queue response: {:?}", e);
                }
            }
        }

        for player_uid in player_uids {
            let player_uid_clone = player_uid.clone();
            self.lobby
                .set_socket_user_game_uid(&player_uid_clone, &game_uid_clone)
                .await;
            let game_turn = game_instance
                .generate_game_turn(&player_uid, feedback.clone())
                .await;
            let response = GameTurnResponse {
                uid: game_instance.get_uid().to_string(),
                game_turn: Some(game_turn),
            };
            let connection_id = game_instance.get_player_connection_id(&player_uid).await;
            match self
                .ws_server
                .to(connection_id)
                .emit(EventType::GameTurn, response.encode_to_vec())
                .await
            {
                Ok(_) => {
                    debug!("Game turn sent to player ");
                }
                Err(e) => {
                    error!("Failed to send game turn to player {:?}", e);
                }
            }
        }
        trace!("Game turn feedback generated");

        self.lobby.set_new_lobby_queue_uid().await;
        trace!("New lobby queue uid set");

        info!(
            "Player {:?}: Created a game and it has started",
            message.player.as_ref().unwrap().name
        );
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

        match self
            .ws_server
            .emit(EventType::LobbyStatistics, statistics.encode_to_vec())
            .await
        {
            Ok(_) => {
                debug!("Statistics sent");
            }
            Err(e) => {
                error!("Failed to send statistics: {:?}", e);
            }
        }
        Ok(())
    }

    pub async fn generate_players_game_turn(
        &self,
        game_instance: Arc<GameInstance>,
        feedback: GameTurnFeedback,
    ) {
        let connection_ids: Vec<String> = {
            let players = game_instance.get_players().await;
            players
                .iter()
                .map(|p| p.get_connection_id().to_string())
                .collect()
        };

        for connection_id in connection_ids {
            let game_turn = game_instance
                .generate_game_turn(&connection_id, feedback.clone())
                .await;
            let response = GameTurnResponse {
                uid: game_instance.get_uid().to_string(),
                game_turn: Some(game_turn),
            };
            match self
                .ws_server
                .to(connection_id)
                .emit(EventType::GameTurn, response.encode_to_vec())
                .await
            {
                Ok(_) => {
                    //debug!("Game turn sent to player {:?}", player_uid);
                }
                Err(_e) => {
                    //error!("Failed to send game turn to player {:?}: {:?}", player_uid, _e);
                }
            }
        }
    }

    pub async fn generate_player_game_turn(
        &self,
        game_instance: Arc<GameInstance>,
        player_uid: String,
        feedback: GameTurnFeedback,
    ) {
        let game_turn = game_instance
            .generate_game_turn(&player_uid, feedback.clone())
            .await;
        let response = GameTurnResponse {
            uid: game_instance.get_uid().to_string(),
            game_turn: Some(game_turn),
        };
        let connection_id = game_instance.get_player_connection_id(&player_uid).await;
        match self
            .ws_server
            .to(connection_id)
            .emit(EventType::GameTurn, response.encode_to_vec())
            .await
        {
            Ok(_) => {
                //debug!("Game turn sent to player {:?}", player_uid);
            }
            Err(_e) => {
                //error!("Failed to send game turn to player {:?}: {:?}", player_uid, _e);
            }
        }
    }
}
