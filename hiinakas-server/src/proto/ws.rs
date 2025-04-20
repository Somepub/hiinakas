#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct WsEvent {
    #[prost(enumeration = "EventType", tag = "1")]
    pub event: i32,
    #[prost(bytes = "vec", tag = "2")]
    pub data: ::prost::alloc::vec::Vec<u8>,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum EventType {
    Connect = 0,
    LobbyQueue = 1,
    LobbyStatistics = 2,
    GameTurn = 3,
    Disconnect = 4,
    Ping = 5,
    Pong = 6,
    Unknown = 7,
}
impl EventType {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            EventType::Connect => "CONNECT",
            EventType::LobbyQueue => "LOBBY_QUEUE",
            EventType::LobbyStatistics => "LOBBY_STATISTICS",
            EventType::GameTurn => "GAME_TURN",
            EventType::Disconnect => "DISCONNECT",
            EventType::Ping => "PING",
            EventType::Pong => "PONG",
            EventType::Unknown => "UNKNOWN",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "CONNECT" => Some(Self::Connect),
            "LOBBY_QUEUE" => Some(Self::LobbyQueue),
            "LOBBY_STATISTICS" => Some(Self::LobbyStatistics),
            "GAME_TURN" => Some(Self::GameTurn),
            "DISCONNECT" => Some(Self::Disconnect),
            "PING" => Some(Self::Ping),
            "PONG" => Some(Self::Pong),
            "UNKNOWN" => Some(Self::Unknown),
            _ => None,
        }
    }
}
