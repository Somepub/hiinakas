use std::sync::Arc;

use prost::Message;
use socketioxide::extract::{ Data, SocketRef };
use socketioxide::layer::SocketIoLayer;
use socketioxide::SocketIo;
use sqlx::SqlitePool;
use tokio::sync::RwLock;
use tracing::{error, info};

use crate::game::handler::GameHandler;
use crate::lobby::handler::LobbyHandler;
use crate::lobby::lobby::Lobby;
use crate::protos::game::GameTurnRequest;
use crate::protos::lobby::LobbyQueueRequest;

pub async fn socketio_layer(db_pool: Arc<RwLock<SqlitePool>>) -> SocketIoLayer {
    let (layer, io) = SocketIo::new_layer();

    let lobby = Arc::new(Lobby::new(db_pool.clone()));
    let game_handler = Arc::new(GameHandler::new(lobby.clone(), io.clone()));
    let lobby_handler = Arc::new(LobbyHandler::new(lobby.clone(), io.clone()));

    io.ns("/", {
        let lobby_handler = lobby_handler.clone();
        let game_handler = game_handler.clone();

        move |socket: SocketRef| async move {
            let _ = lobby_handler.connect(&socket).await;
            
            socket.on("lobby/queue", {
                let lobby_handler = lobby_handler.clone();
                move |socket_ref: SocketRef, Data::<Vec<u8>>(data)| async move {
                    match LobbyQueueRequest::decode(data.as_slice()) {
                        Ok(request) => {
                            let _ = lobby_handler.handle_lobby_queue(&socket_ref, request).await;
                        }
                        Err(e) => {
                            error!("Failed to decode lobby queue request: {:?}", e);
                        }
                    }
                }
            });

            socket.on("lobby/statistics", {
                let lobby_handler = lobby_handler.clone();
                move |_socket_ref: SocketRef| async move {
                    let _ = lobby_handler.handle_lobby_statistics().await;
                }
            });

            socket.on("game/turn", {
                let game_handler = game_handler.clone();
                move |_socket_ref: SocketRef, Data::<Vec<u8>>(data)| async move {
                    match GameTurnRequest::decode(data.as_slice()) {
                        Ok(request) => {
                            let _ = game_handler.handle_game_turn(request).await;
                        }
                        Err(e) => {
                            error!("Failed to decode game turn request: {:?}", e);
                        }
                    }
                }
            });

            socket.on_disconnect({
                let lobby_handler = lobby_handler.clone();
                move |socket_ref: SocketRef| async move {
                    let _ = lobby_handler.disconnect(socket_ref).await;
                }
            });
        }
    });

    layer
}
