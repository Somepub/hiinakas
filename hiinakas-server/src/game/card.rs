use tracing::error;
use uuid::Uuid;

use crate::protos::card::{Card, Effect, Rank, Suit};

impl Card {
    pub fn new(rank: Rank, suit: Suit) -> Self {
        let uid = Uuid::new_v4().to_string();

        let effect = match rank {
            Rank::Two => Effect::AceKiller,
            Rank::Seven => Effect::Constraint,
            Rank::Eight => Effect::Transparent,
            Rank::Ten => Effect::Destroy,
            _ => Effect::NoEffect,
        };
        
        Card {
            uid,
            rank: rank.into(),
            suit: suit.into(),
            effect: effect.into(),
        }
    }

    pub fn get_uid(&self) -> &str {
        &self.uid
    }
    pub fn get_rank(&self) -> Rank {
        match Rank::from_i32(self.rank as i32) {
            Some(rank) => rank,
            None => {
                error!("PANIC! Invalid rank: {}", self.rank);
                return Rank::Two
            },
        }
    }

    pub fn get_suit(&self) -> Suit {
        match Suit::from_i32(self.suit as i32) {
            Some(suit) => suit,
            None => {
                error!("PANIC! Invalid suit: {}", self.suit);
                return Suit::Hearts
            },
        }
    }

    pub fn get_effect(&self) -> Effect {
        match Effect::from_i32(self.effect as i32) {
            Some(effect) => effect,
            None => {
                error!("PANIC! Invalid effect: {}", self.effect);
                return Effect::NoEffect
            },
        }
    }

    pub fn to_number(&self) -> i32 {
        // rank: 1-13, suit: 1-4
        (self.rank as i32 + 1) + ((self.suit as i32) * 13) as i32
    }

    pub fn from_number(num: i32) -> Self {
        let suit = match Suit::from_i32(((num - 1) / 13) as i32) {
            Some(suit) => suit,
            None => {
                error!("PANIC! Invalid suit from_number: {}", num);
                return Card::new(Rank::Two, Suit::Hearts)
            },
        };
        let rank = match Rank::from_i32(((num - 1) % 13) as i32) {
            Some(rank) => rank,
            None => {
                error!("PANIC! Invalid rank from_number: {}", num);
                return Card::new(Rank::Two, Suit::Hearts)
            },
        };
        
        Card {
            uid: uuid::Uuid::new_v4().to_string(),
            rank: rank.into(),
            suit: suit.into(),
            effect: Effect::NoEffect.into(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_card_creation() {
        let card = Card::new(Rank::Ace, Suit::Spades);
        assert_eq!(card.get_rank(), Rank::Ace);
        assert_eq!(card.get_suit(), Suit::Spades);
    }

    #[test]
    fn test_from_number_success() {
        let card = Card::from_number(0);
        assert_eq!(card.get_rank(), Rank::Two);
        assert_eq!(card.get_suit(), Suit::Hearts);
    }

    #[test]
    fn test_from_number_failure() {
        let card = Card::from_number(1000);
        assert_eq!(card.get_rank(), Rank::Two);
        assert_eq!(card.get_suit(), Suit::Hearts);
    }

    #[test]
    fn test_card_number_conversion() {
        for suit in 0..4 {
            for rank in 0..13 {
                let card_number = rank + 1 + (suit * 13);
                let card = Card::from_number(card_number);
                
                assert_eq!(card.to_number(), card_number, 
                    "Failed for number {}: suit={}, rank={}", 
                    card_number, suit, rank);
                
                assert_eq!(card.get_rank() as i32, rank, 
                    "Wrong rank for number {}", card_number);
                assert_eq!(card.get_suit() as i32, suit, 
                    "Wrong suit for number {}", card_number);
            }
        }
    }

    #[test]
    fn test_specific_cards() {
        let test_cases = vec![
            (1, Rank::Two, Suit::Hearts),
            (13, Rank::Ace, Suit::Hearts),
            (14, Rank::Two, Suit::Diamonds),
            (26, Rank::Ace, Suit::Diamonds),
            (27, Rank::Two, Suit::Clubs),
            (39, Rank::Ace, Suit::Clubs),
            (40, Rank::Two, Suit::Spades),
            (52, Rank::Ace, Suit::Spades),
        ];

        for (number, expected_rank, expected_suit) in test_cases {
            let card = Card::from_number(number);
            assert_eq!(card.get_rank(), expected_rank, 
                "Wrong rank for card number {}", number);
            assert_eq!(card.get_suit(), expected_suit, 
                "Wrong suit for card number {}", number);
            assert_eq!(card.to_number(), number, 
                "Wrong number conversion for card number {}", number);
        }
    }

    #[test]
    fn test_edge_cases() {
        let edge_cases = vec![
            -1,
            -1000,
            53,
            100,
            1000,
        ];

        for number in edge_cases {
            let card = Card::from_number(number);
            assert!(card.get_rank() as i32 >= 0 && card.get_rank() as i32 <= 12,
                "Invalid rank for number {}", number);
            assert!(card.get_suit() as i32 >= 0 && card.get_suit() as i32 <= 3,
                "Invalid suit for number {}", number);
        }
    }
}
