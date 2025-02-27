#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GameTurnRequest {
    #[prost(string, tag = "1")]
    pub uid: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "2")]
    pub player: ::core::option::Option<super::lobby::LobbyPlayer>,
    #[prost(enumeration = "GameInstanceAction", tag = "3")]
    pub action: i32,
    #[prost(string, tag = "4")]
    pub card_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GameTurnResponse {
    #[prost(string, tag = "1")]
    pub uid: ::prost::alloc::string::String,
    #[prost(message, optional, tag = "2")]
    pub game_turn: ::core::option::Option<GameTurn>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GameTurn {
    #[prost(message, optional, tag = "1")]
    pub status: ::core::option::Option<GameTurnStatus>,
    #[prost(message, optional, tag = "2")]
    pub player: ::core::option::Option<GameTurnPlayer>,
    #[prost(message, repeated, tag = "3")]
    pub table: ::prost::alloc::vec::Vec<super::card::SmallCard>,
    #[prost(uint32, tag = "4")]
    pub deck: u32,
    #[prost(bool, tag = "5")]
    pub is_winner: bool,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GameTurnPlayer {
    #[prost(string, tag = "1")]
    pub name: ::prost::alloc::string::String,
    #[prost(bool, tag = "2")]
    pub is_my_turn: bool,
    #[prost(enumeration = "GameInstanceAction", tag = "3")]
    pub action: i32,
    #[prost(message, optional, tag = "4")]
    pub message: ::core::option::Option<GameInstanceMessage>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GameInstanceMessage {
    #[prost(enumeration = "GameInstanceMessageAction", tag = "1")]
    pub r#type: i32,
    #[prost(string, tag = "2")]
    pub message: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GameTurnStatus {
    #[prost(message, optional, tag = "1")]
    pub player_status: ::core::option::Option<PlayerStatus>,
    #[prost(message, repeated, tag = "2")]
    pub other_players: ::prost::alloc::vec::Vec<OpponentPlayerStatus>,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct PlayerStatus {
    #[prost(message, repeated, tag = "1")]
    pub hand_cards: ::prost::alloc::vec::Vec<super::card::Card>,
    #[prost(message, repeated, tag = "2")]
    pub floor_cards: ::prost::alloc::vec::Vec<super::card::SmallCard>,
    #[prost(uint32, tag = "3")]
    pub hidden_cards: u32,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct OpponentPlayerStatus {
    #[prost(string, tag = "1")]
    pub name: ::prost::alloc::string::String,
    #[prost(uint32, tag = "2")]
    pub hand_cards: u32,
    #[prost(message, repeated, tag = "3")]
    pub floor_cards: ::prost::alloc::vec::Vec<super::card::SmallCard>,
    #[prost(uint32, tag = "4")]
    pub hidden_cards: u32,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GameTurnFeedback {
    #[prost(enumeration = "GameInstanceAction", tag = "1")]
    pub action: i32,
    #[prost(message, optional, tag = "2")]
    pub message: ::core::option::Option<GameInstanceMessage>,
    #[prost(bool, tag = "3")]
    pub has_won: bool,
    #[prost(bool, tag = "4")]
    pub has_disconnect: bool,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum GameInstanceMessageAction {
    Info = 0,
    Error = 1,
}
impl GameInstanceMessageAction {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            GameInstanceMessageAction::Info => "INFO",
            GameInstanceMessageAction::Error => "ERROR",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "INFO" => Some(Self::Info),
            "ERROR" => Some(Self::Error),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum GameInstanceAction {
    Init = 0,
    PlayCard = 1,
    EndTurn = 2,
    PickUp = 3,
    Win = 4,
}
impl GameInstanceAction {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            GameInstanceAction::Init => "INIT",
            GameInstanceAction::PlayCard => "PLAY_CARD",
            GameInstanceAction::EndTurn => "END_TURN",
            GameInstanceAction::PickUp => "PICK_UP",
            GameInstanceAction::Win => "WIN",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "INIT" => Some(Self::Init),
            "PLAY_CARD" => Some(Self::PlayCard),
            "END_TURN" => Some(Self::EndTurn),
            "PICK_UP" => Some(Self::PickUp),
            "WIN" => Some(Self::Win),
            _ => None,
        }
    }
}
