#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LobbyPlayer {
    #[prost(string, tag = "1")]
    pub player_uid: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub name: ::prost::alloc::string::String,
    #[prost(string, tag = "3")]
    pub public_uid: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LobbyStatistics {
    #[prost(uint32, tag = "1")]
    pub player_count: u32,
    #[prost(uint32, tag = "2")]
    pub game_count: u32,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LobbyQueueRequest {
    #[prost(message, optional, tag = "1")]
    pub player: ::core::option::Option<LobbyPlayer>,
    #[prost(bool, tag = "2")]
    pub leave: bool,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct LobbyQueueResponse {
    #[prost(string, tag = "1")]
    pub game_uid: ::prost::alloc::string::String,
    #[prost(enumeration = "LobbyQueueAction", tag = "2")]
    pub action: i32,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PublicLobbyPlayer {
    #[prost(string, tag = "1")]
    pub public_uid: ::prost::alloc::string::String,
    #[prost(string, tag = "2")]
    pub name: ::prost::alloc::string::String,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum LobbyQueueAction {
    Start = 0,
    Wait = 1,
}
impl LobbyQueueAction {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            LobbyQueueAction::Start => "START",
            LobbyQueueAction::Wait => "WAIT",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "START" => Some(Self::Start),
            "WAIT" => Some(Self::Wait),
            _ => None,
        }
    }
}
