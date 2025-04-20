use std::sync::Arc;

use prost::Message;
use tracing::error;
use crate::db::stats;

use crate::{game::handler::GameHandler, lobby::{handler::LobbyHandler, lobby::Lobby}, protos::{game::GameTurnRequest, lobby::LobbyQueueRequest, ws::EventType}, server::ws_server::WebSocketServer};

pub async fn handle_ws_events() {
    let server = WebSocketServer::new();
    let db_pool = stats::init_database_and_return_pool().await;
    let lobby = Arc::new(Lobby::new(db_pool.clone()));
    let game_handler = Arc::new(GameHandler::new(lobby.clone(), server.clone()));
    let lobby_handler = Arc::new(LobbyHandler::new(lobby.clone(), server.clone()));

    let lobby_handler_connect = lobby_handler.clone();
    server.on(EventType::Connect, move |connection_id, _data| {
        let lobby_handler = lobby_handler_connect.clone();
        async move {
            let _ = lobby_handler.connect(connection_id.clone()).await;
        }
    }).await;

    let lobby_handler_queue = lobby_handler.clone();
    server.on(EventType::LobbyQueue, move |connection_id, data| {
        let lobby_handler = lobby_handler_queue.clone();
        async move {
            match LobbyQueueRequest::decode(data.as_slice()) {
                Ok(request) => {
                    let _ = lobby_handler.handle_lobby_queue(connection_id.clone(), request).await;
                }
                Err(e) => {
                    error!("Failed to decode lobby queue request: {:?}", e);
                }
            }
        }
    }).await;

    let lobby_handler_stats = lobby_handler.clone();
    server.on(EventType::LobbyStatistics, move |_connection_id, _data| {
        let lobby_handler = lobby_handler_stats.clone();
        async move {
            let _ = lobby_handler.handle_lobby_statistics().await;
        }
    }).await;

    let game_handler_turn = game_handler.clone();
    server.on(EventType::GameTurn, move |_connection_id, data| {
        let game_handler = game_handler_turn.clone();
        async move {
            match GameTurnRequest::decode(data.as_slice()) {
                Ok(request) => {
                    let _ = game_handler.handle_game_turn(request).await;
                }
                Err(e) => {
                    error!("Failed to decode game turn request: {:?}", e);
                }
            }
        }
    }).await;

    let lobby_handler_disconnect = lobby_handler.clone();
    server.on(EventType::Disconnect, move |connection_id, _data| {
        let lobby_handler = lobby_handler_disconnect.clone();
        async move {
            let _ = lobby_handler.disconnect(connection_id.clone()).await;
        }
    }).await;

    server.clone().start().await;
}