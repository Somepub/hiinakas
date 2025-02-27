#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct Card {
    #[prost(string, tag = "1")]
    pub uid: ::prost::alloc::string::String,
    #[prost(enumeration = "Rank", tag = "2")]
    pub rank: i32,
    #[prost(enumeration = "Suit", tag = "3")]
    pub suit: i32,
    #[prost(enumeration = "Effect", tag = "4")]
    pub effect: i32,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct SmallCard {
    #[prost(uint32, tag = "1")]
    pub value: u32,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum Rank {
    Two = 0,
    Three = 1,
    Four = 2,
    Five = 3,
    Six = 4,
    Seven = 5,
    Eight = 6,
    Nine = 7,
    Ten = 8,
    Jack = 9,
    Queen = 10,
    King = 11,
    Ace = 12,
}
impl Rank {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            Rank::Two => "TWO",
            Rank::Three => "THREE",
            Rank::Four => "FOUR",
            Rank::Five => "FIVE",
            Rank::Six => "SIX",
            Rank::Seven => "SEVEN",
            Rank::Eight => "EIGHT",
            Rank::Nine => "NINE",
            Rank::Ten => "TEN",
            Rank::Jack => "JACK",
            Rank::Queen => "QUEEN",
            Rank::King => "KING",
            Rank::Ace => "ACE",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "TWO" => Some(Self::Two),
            "THREE" => Some(Self::Three),
            "FOUR" => Some(Self::Four),
            "FIVE" => Some(Self::Five),
            "SIX" => Some(Self::Six),
            "SEVEN" => Some(Self::Seven),
            "EIGHT" => Some(Self::Eight),
            "NINE" => Some(Self::Nine),
            "TEN" => Some(Self::Ten),
            "JACK" => Some(Self::Jack),
            "QUEEN" => Some(Self::Queen),
            "KING" => Some(Self::King),
            "ACE" => Some(Self::Ace),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum Suit {
    Hearts = 0,
    Diamonds = 1,
    Clubs = 2,
    Spades = 3,
}
impl Suit {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            Suit::Hearts => "HEARTS",
            Suit::Diamonds => "DIAMONDS",
            Suit::Clubs => "CLUBS",
            Suit::Spades => "SPADES",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "HEARTS" => Some(Self::Hearts),
            "DIAMONDS" => Some(Self::Diamonds),
            "CLUBS" => Some(Self::Clubs),
            "SPADES" => Some(Self::Spades),
            _ => None,
        }
    }
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, ::prost::Enumeration)]
#[repr(i32)]
pub enum Effect {
    NoEffect = 0,
    Transparent = 1,
    Constraint = 2,
    AceKiller = 3,
    Destroy = 4,
}
impl Effect {
    /// String value of the enum field names used in the ProtoBuf definition.
    ///
    /// The values are not transformed in any way and thus are considered stable
    /// (if the ProtoBuf definition does not change) and safe for programmatic use.
    pub fn as_str_name(&self) -> &'static str {
        match self {
            Effect::NoEffect => "NO_EFFECT",
            Effect::Transparent => "TRANSPARENT",
            Effect::Constraint => "CONSTRAINT",
            Effect::AceKiller => "ACE_KILLER",
            Effect::Destroy => "DESTROY",
        }
    }
    /// Creates an enum from field names used in the ProtoBuf definition.
    pub fn from_str_name(value: &str) -> ::core::option::Option<Self> {
        match value {
            "NO_EFFECT" => Some(Self::NoEffect),
            "TRANSPARENT" => Some(Self::Transparent),
            "CONSTRAINT" => Some(Self::Constraint),
            "ACE_KILLER" => Some(Self::AceKiller),
            "DESTROY" => Some(Self::Destroy),
            _ => None,
        }
    }
}
