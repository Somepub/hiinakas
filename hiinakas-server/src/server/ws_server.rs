use crate::protos::ws::{EventType, WsEvent};
use futures_util::{SinkExt, StreamExt};
use hashbrown::HashMap;
use prost::Message;
use std::fmt;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use tokio_tungstenite::tungstenite::Error as WsError;
use tokio_tungstenite::tungstenite::Message as WsMessage;
use tracing::trace;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

type EventHandler =
    Arc<dyn (Fn(String, Vec<u8>) -> futures_util::future::BoxFuture<'static, ()>) + Send + Sync>;

#[derive(Clone)]
pub struct WebSocketServer {
    connections: Arc<RwLock<HashMap<String, WebSocketConnection>>>,
    event_handlers: Arc<RwLock<HashMap<EventType, EventHandler>>>,
}

#[derive(Debug, Clone)]
struct WebSocketConnection {
    sender: mpsc::Sender<WsMessage>,
}

impl fmt::Debug for WebSocketServer {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("WebSocketServer")
            .field("connections", &self.connections)
            .field("event_handlers", &"<event_handlers>") // Skip detailed debug for handlers
            .finish()
    }
}

impl WebSocketServer {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            connections: Arc::new(RwLock::new(HashMap::new())),
            event_handlers: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    pub fn to(&self, connection_id: String) -> ConnectionEmitter {
        ConnectionEmitter {
            connection_id,
            server: Arc::new(self.clone()),
        }
    }

    pub async fn on<F, Fut>(&self, event: EventType, handler: F)
    where
        F: Fn(String, Vec<u8>) -> Fut + Send + Sync + 'static,
        Fut: futures_util::Future<Output = ()> + Send + 'static,
    {
        let handler = Arc::new(
            move |connection_id, data| -> futures_util::future::BoxFuture<'static, ()> {
                Box::pin(handler(connection_id, data))
            },
        );
        self.event_handlers.write().await.insert(event, handler);
    }

    pub async fn emit(
        &self,
        event: EventType,
        data: Vec<u8>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let msg = WsEvent {
            event: event.into(),
            data,
        };

        let ws_message = WsMessage::Binary(msg.encode_to_vec().into());

        for conn in self.connections.read().await.values() {
            let _ = conn.sender.try_send(ws_message.clone());
        }
        Ok(())
    }

    pub async fn start(self: Arc<Self>) {
        let listener = tokio::net::TcpListener::bind("0.0.0.0:5000").await.unwrap();
        info!("Websocket server started on port 5000");

        while let Ok((stream, addr)) = listener.accept().await {
            debug!("New connection from: {}", addr);

            let server = self.clone();
            tokio::spawn(async move {
                match tokio_tungstenite::accept_async(stream).await {
                    Ok(ws_stream) => {
                        let (ws_sender, mut ws_receiver) = ws_stream.split();
                        let (tx, mut rx) = mpsc::channel(16);
                        let connection_id = Uuid::new_v4().to_string();
                        let connection_id_clone = connection_id.clone();
                        trace!("Connection established - ID: {}", connection_id);

                        server.connections.write().await.insert(
                            connection_id.clone(),
                            WebSocketConnection { sender: tx.clone() },
                        );

                        let mut ws_sender = ws_sender;
                        tokio::spawn(async move {
                            //trace!("Starting sender task for {}", connection_id);
                            while let Some(message) = rx.recv().await {
                                let message_clone = message.clone();
                                //trace!("Received message to send for {}", connection_id);
                                match ws_sender.send(message).await {
                                    Ok(_) => {
                                        //trace!("Message sent successfully to {}", connection_id);
                                    }
                                    Err(e) => {
                                        if let WsMessage::Binary(data) = message_clone {
                                            let message_proto = WsEvent::decode(&data[..]).unwrap();
                                            error!(
                                                "Failed to send message to {}: {:?}, message: {:?}",
                                                connection_id, e, message_proto
                                            );
                                        }
                                        break;
                                    }
                                }
                            }
                            trace!("Sender task ended for connection {}", connection_id);
                        });

                        let server_clone = server.clone();
                        tokio::spawn(async move {
                            while let Some(msg_result) = ws_receiver.next().await {
                                match msg_result {
                                    Ok(msg) => {
                                        if let WsMessage::Binary(data) = msg {
                                            server_clone
                                                .handle_event(&connection_id_clone, data.to_vec())
                                                .await;
                                        }
                                    }
                                    Err(e) => {
                                        error!("Error receiving message: {:?}", e);
                                        break;
                                    }
                                }
                            }
                            server_clone.handle_disconnect(&connection_id_clone).await;
                        });
                    }
                    Err(e) => {
                        warn!("Failed to establish WebSocket connection: {:?}", e);
                        match e {
                            WsError::Protocol(p) => error!("Protocol error: {:?}", p),
                            WsError::Io(io) => error!("IO error: {:?}", io),
                            _ => error!("Other WebSocket error: {:?}", e),
                        }
                    }
                }
            });
        }
    }

    async fn handle_event(&self, connection_id: &str, data: Vec<u8>) {
        match WsEvent::decode(&data[..]) {
            Ok(event) => {
                let event_type = EventType::from_i32(event.event).unwrap_or(EventType::Unknown);

                if event_type == EventType::Unknown {
                    error!(
                        "Unknown event type: {:?}, with data: {:?}",
                        event.event(),
                        event.data
                    );
                    return;
                }

                if event_type == EventType::Ping {
                    if let Some(conn) = self.connections.read().await.get(connection_id) {
                        let pong = WsEvent {
                            event: EventType::Pong as i32,
                            data: Vec::new(),
                        };
                        let ws_message = WsMessage::Binary(pong.encode_to_vec().into());
                        let _ = conn.sender.send(ws_message).await;
                        //trace!("Pong sent to {}", connection_id);
                        return;
                    }
                }

                trace!("Handling event: {:?} for {}", event_type, connection_id);
                if let Some(handler) = self.event_handlers.read().await.get(&event_type) {
                    handler(connection_id.to_string(), event.data).await;
                }
            }
            Err(e) => error!("Failed to decode event: {:?}", e),
        }
    }

    async fn handle_disconnect(&self, connection_id: &str) {
        if let Some(handler) = self.event_handlers.read().await.get(&EventType::Disconnect) {
            handler(connection_id.to_string(), Vec::new()).await;
        }

        let mut connections = self.connections.write().await;
        connections.remove(connection_id);
        trace!(
            "Disconnected connection {} from all rooms and connections",
            connection_id
        );
    }
}

#[derive(Clone)]
pub struct ConnectionEmitter {
    connection_id: String,
    server: Arc<WebSocketServer>,
}

impl ConnectionEmitter {
    pub async fn emit(
        &self,
        event: EventType,
        data: Vec<u8>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let msg = WsEvent {
            event: event.into(),
            data,
        };
        let encoded = msg.encode_to_vec();
        let ws_message = WsMessage::Binary(encoded.into());

        if let Some(conn) = self
            .server
            .connections
            .read()
            .await
            .get(&self.connection_id)
        {
            conn.sender.send(ws_message).await?;
        }
        Ok(())
    }
}
