use std::collections::VecDeque;
use crate::protos::card::{Card, Effect, Rank};

#[derive(Debug, Clone)]
pub struct Table {
    cards: VecDeque<Card>,
}

impl Table {
    pub fn new() -> Self {
        Table {
            cards: VecDeque::new(),
        }
    }

    pub fn get_cards(&self) -> Vec<Card> {
        self.cards.iter().cloned().collect()
    }

    pub fn get_top_card(&self) -> Option<&Card> {
        self.cards.back()
    }

    pub fn add_card(&mut self, card: Card) {
        self.cards.push_back(card);
    }

    pub fn clear(&mut self) -> Vec<Card> {
        let cards: Vec<Card> = self.cards.drain(..).collect();
        cards
    }

    pub fn is_empty(&self) -> bool {
        self.cards.is_empty()
    }

    pub async fn is_card_playable(&self, card: &Card, turn_moves: usize) -> bool {
        let last_card = self.get_top_card();

        // Equal rank cards can stack
        if let Some(last) = last_card {
            if last.get_rank() == card.get_rank() {
                return true;
            }
        }

        // If the player has already played a card this turn, 
        // they cannot play another card unless its same rank
        if turn_moves > 0 {
            return false;
        }

        // If there are no cards on the table or player has placed a destroy card
        if last_card.is_none() || card.get_effect() == Effect::Destroy {
            return true;
        }

        let last_card = match last_card {
            Some(l) => l,
            None => return false,
        };
        let last_card_effect = last_card.get_effect();
        let current_card_effect = card.get_effect();

        match (current_card_effect, last_card_effect) {
            // Both cards are normal cards
            (Effect::NoEffect, Effect::NoEffect) => {
                card.get_rank() as u8 >= last_card.get_rank() as u8
            }

            // Current card is special, last card is normal
            (effect, Effect::NoEffect) if effect != Effect::NoEffect => {
                match effect {
                    Effect::AceKiller => last_card.get_rank() == Rank::Ace,
                    Effect::Transparent | Effect::Constraint => true,
                    _ => false,
                }
            }

            // Current card is normal, last card is special
            (Effect::NoEffect, effect) if effect != Effect::NoEffect => {
                match effect {
                    Effect::AceKiller => true,
                    Effect::Transparent => {
                        let beneath_card = self.find_card_beneath_transparent();
                        match beneath_card {
                            Some(beneath) => match beneath.get_effect() {
                                Effect::AceKiller => true,
                                Effect::Constraint => {
                                    card.get_rank() as u8 <= beneath.get_rank() as u8
                                }
                                Effect::NoEffect => {
                                    card.get_rank() as u8 >= beneath.get_rank() as u8
                                }
                                _ => true,
                            },
                            None => true,
                        }
                    }
                    Effect::Constraint => {
                        card.get_rank() as u8 <= last_card.get_rank() as u8
                    }
                    _ => false,
                }
            }

            // Both cards have special effects
            (current_effect, last_effect) 
            if current_effect != Effect::NoEffect && last_effect != Effect::NoEffect => {
                match last_effect {
                    Effect::Transparent => {
                        let beneath_card = self.find_card_beneath_transparent();
                        
                        if beneath_card.is_none() {
                            return true;
                        }
                        else {
                            let beneath = beneath_card.unwrap();
                            match beneath.get_effect() {
                                Effect::Constraint => {
                                    card.get_rank() as u8 <= beneath.get_rank() as u8
                                }
                                Effect::NoEffect => {
                                    card.get_rank() as u8 >= beneath.get_rank() as u8
                                }
                                _ => true,
                            }
                        }

                    }
                    Effect::AceKiller | Effect::Constraint => true,
                    _ => false,
                }
            }

            _ => false,
        }
    }

    pub fn get_last_cards(&self, count: usize) -> Vec<Card> {
        self.cards
            .iter()
            .rev()
            .take(count)
            .cloned()
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect()
    }

    pub fn get_cards_count(&self) -> usize {
        self.cards.len()
    }

    fn find_card_beneath_transparent(&self) -> Option<&Card> {
        let cards: Vec<&Card> = self.cards
            .iter()
            .filter(|card| card.get_effect() != Effect::Transparent)
            .collect();
        
        cards.last().copied()
    }
}

#[cfg(test)]
mod tests {
    use std::sync::{Arc, RwLock};

    use crate::{game::game_instance::GameInstance, protos::card::Suit};

    use super::*;
    #[test]
    fn test_empty_table() {
        let instance = Arc::new(RwLock::new(GameInstance::new()));
        let table = Table::new();
        assert!(table.is_empty());
        assert_eq!(table.get_cards_count(), 0);
    }

    #[test]
    fn test_add_card() {
        let instance = Arc::new(RwLock::new(GameInstance::new()));
        let mut table = Table::new();
        let card = Card::new(Rank::Ace, Suit::Hearts);
        table.add_card(card);
        assert!(!table.is_empty());
        assert_eq!(table.get_cards_count(), 1);
    }

    #[tokio::test]
    async fn test_can_play_card_on_empty() {
        let table = Table::new();
        let card = Card::new(Rank::Two, Suit::Hearts);
        assert!(table.is_card_playable(&card, 0).await);
    }

    #[tokio::test]
    async fn test_can_play_card_normal() {
        let mut table = Table::new();
        let lower_card = Card::new(Rank::Seven, Suit::Hearts);
        let higher_card = Card::new(Rank::King, Suit::Clubs);
        
        table.add_card(lower_card);
        assert!(table.is_card_playable(&higher_card, 0).await);
    }

    #[tokio::test]
    async fn test_constraint_effect() {
        let mut table = Table::new();
        let constraint_card = Card::new(Rank::Seven, Suit::Hearts);
        let same_rank = Card::new(Rank::Seven, Suit::Diamonds);
        let different_rank = Card::new(Rank::Eight, Suit::Hearts);
        
        table.add_card(constraint_card);
        assert!(table.is_card_playable(&same_rank, 0).await);
        assert!(!table.is_card_playable(&different_rank, 0).await);
    }

    #[tokio::test]
    async fn test_transparent_effect() {
        let mut table = Table::new();
        let base_card = Card::new(Rank::Six, Suit::Hearts);
        let transparent_card = Card::new(Rank::Eight, Suit::Diamonds);
        let next_card = Card::new(Rank::Seven, Suit::Clubs);
        
        table.add_card(base_card);
        table.add_card(transparent_card);
        assert!(table.is_card_playable(&next_card, 0).await);
    }

    #[tokio::test]
    async fn test_ace_killer_effect() {
        let mut table = Table::new();
        let ace_card = Card::new(Rank::Ace, Suit::Hearts);
        let ace_killer_card = Card::new(Rank::Two, Suit::Diamonds);
        table.add_card(ace_card);
        assert!(table.is_card_playable(&ace_killer_card, 0).await);
    }

    #[tokio::test]
    async fn test_clear_table() {
        let mut table = Table::new();
        table.add_card(Card::new(Rank::Ace, Suit::Hearts));
        table.add_card(Card::new(Rank::King, Suit::Diamonds));
        
        let cleared_cards = table.clear();
        assert!(table.is_empty());
        assert_eq!(cleared_cards.len(), 2);
    }
   
}