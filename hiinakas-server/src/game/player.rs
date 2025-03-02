use serde::{ Deserialize, Serialize };
use smallvec::SmallVec;

use crate::protos::card::{ Card, SmallCard };

const MAX_HAND_CARDS: usize = 52;
const MAX_FLOOR_CARDS: usize = 3;
const MAX_BLIND_CARDS: usize = 3;

type HandVec = SmallVec<[Card; MAX_HAND_CARDS]>;
type FloorVec = SmallVec<[Card; MAX_FLOOR_CARDS]>;
type BlindVec = SmallVec<[Card; MAX_BLIND_CARDS]>;

#[derive(Debug, Clone)]
pub struct Player {
    uid: String,
    public_uid: String,
    name: String,
    hand_cards: HandVec,
    floor_cards: FloorVec,
    blind_cards: BlindVec,
}

impl Player {
    pub fn new(uid: String, public_uid: String, name: String) -> Self {
        Self {
            uid,
            public_uid,
            name,
            hand_cards: SmallVec::new(),
            floor_cards: SmallVec::new(),
            blind_cards: SmallVec::new(),
        }
    }

    pub fn get_uid(&self) -> &str {
        &self.uid
    }

    pub fn get_public_uid(&self) -> &str {
        &self.public_uid
    }

    pub fn get_name(&self) -> &str {
        &self.name
    }

    pub fn get_hand_cards(&self) -> Vec<Card> {
        self.hand_cards.to_vec()
    }

    pub fn get_floor_cards(&self) -> Vec<Card> {
        self.floor_cards.to_vec()
    }

    pub fn get_small_floor_cards(&self) -> Vec<SmallCard> {
        self.floor_cards
            .iter()
            .map(|c| SmallCard {
                value: c.to_number() as u32,
            })
            .collect()
    }

    pub fn get_blind_cards(&self) -> Vec<Card> {
        self.blind_cards.to_vec()
    }

    pub fn add_hand_card(&mut self, card: Card) {
        if self.hand_cards.len() < MAX_HAND_CARDS {
            self.hand_cards.push(card);
        }
    }

    pub fn add_floor_card(&mut self, card: Card) {
        if self.floor_cards.len() < MAX_FLOOR_CARDS {
            self.floor_cards.push(card);
        }
    }

    pub fn add_blind_card(&mut self, card: Card) {
        if self.blind_cards.len() < MAX_BLIND_CARDS {
            self.blind_cards.push(card);
        }
    }

    pub fn remove_hand_card(&mut self, card_uid: &str) -> Option<Card> {
        self.hand_cards
            .iter()
            .position(|c| c.get_uid() == card_uid)
            .map(|pos| self.hand_cards.remove(pos))
    }

    pub fn remove_floor_card(&mut self, card_uid: &str) -> Option<Card> {
        self.floor_cards
            .iter()
            .position(|c| c.get_uid() == card_uid)
            .map(|pos| self.floor_cards.remove(pos))
    }

    pub fn remove_blind_card(&mut self, card_uid: &str) -> Option<Card> {
        self.blind_cards
            .iter()
            .position(|c| c.get_uid() == card_uid)
            .map(|pos| self.blind_cards.remove(pos))
    }

    pub fn get_card(&mut self, card_uid: &str) -> Option<Card> {
        self.hand_cards
            .iter()
            .find(|c| c.get_uid() == card_uid)
            .cloned()
    }

    pub fn pick_up_floor_cards(&mut self) {
        self.hand_cards.extend(self.floor_cards.drain(..));
    }

    pub fn pick_up_blind_cards(&mut self) {
        self.hand_cards.extend(self.blind_cards.drain(..));
    }

    pub fn is_hand_cards_empty(&self) -> bool {
        self.hand_cards.is_empty()
    }

    pub fn is_floor_cards_empty(&self) -> bool {
        self.floor_cards.is_empty()
    }

    pub fn is_blind_cards_empty(&self) -> bool {
        self.blind_cards.is_empty()
    }

    pub fn has_cards(&self) -> bool {
        !self.is_hand_cards_empty() || !self.is_floor_cards_empty() || !self.is_blind_cards_empty()
    }

    pub fn get_cards_count(&self) -> usize {
        self.hand_cards.len() + self.floor_cards.len() + self.blind_cards.len()
    }

    pub fn get_hand_cards_count(&self) -> usize {
        self.hand_cards.len()
    }

    pub fn get_floor_cards_count(&self) -> usize {
        self.floor_cards.len()
    }

    pub fn get_blind_cards_count(&self) -> usize {
        self.blind_cards.len()
    }

    pub fn clear_cards(&mut self) -> Vec<Card> {
        let mut all_cards = Vec::with_capacity(self.get_cards_count());
        all_cards.extend(self.hand_cards.drain(..));
        all_cards.extend(self.floor_cards.drain(..));
        all_cards.extend(self.blind_cards.drain(..));
        all_cards
    }

    pub fn can_play_blind(&self) -> bool {
        self.is_hand_cards_empty() && self.is_floor_cards_empty() && !self.is_blind_cards_empty()
    }

    pub fn can_play_floor(&self) -> bool {
        self.is_hand_cards_empty() && !self.is_floor_cards_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::protos::card::{ Card, Rank, Suit };

    #[test]
    fn test_new_player() {
        let player = Player::new(
            "123".to_string(),
            "Test Player".to_string(),
            "Test Player".to_string()
        );
        assert_eq!(player.get_uid(), "123");
        assert_eq!(player.get_name(), "Test Player");
        assert_eq!(player.get_cards_count(), 0);
    }

    #[test]
    fn test_add_and_remove_hand_card() {
        let mut player = Player::new(
            "123".to_string(),
            "Test Player".to_string(),
            "Test Player".to_string()
        );
        let card = Card::new(Rank::Ace, Suit::Hearts);
        let card_uid = card.get_uid().to_string();

        player.add_hand_card(card);
        assert_eq!(player.get_hand_cards_count(), 1);

        let removed_card = player.remove_hand_card(&card_uid);
        assert!(removed_card.is_some());
        assert_eq!(player.get_hand_cards_count(), 0);
    }

    #[test]
    fn test_can_play_conditions() {
        let mut player = Player::new("123".to_string(), "public_123".to_string(), "Test Player".to_string());

        // Test blind cards
        player.add_blind_card(Card::new(Rank::Ace, Suit::Hearts));
        assert!(player.can_play_blind());

        // Test floor cards
        player.add_floor_card(Card::new(Rank::King, Suit::Hearts));
        assert!(!player.can_play_blind());
        assert!(player.can_play_floor());

        // Test hand cards
        player.add_hand_card(Card::new(Rank::Queen, Suit::Hearts));
        assert!(!player.can_play_blind());
        assert!(!player.can_play_floor());
    }

    #[test]
    fn test_clear_cards() {
        let mut player = Player::new("123".to_string(), "Test Player".to_string(), "Test Player".to_string());

        player.add_hand_card(Card::new(Rank::Ace, Suit::Hearts));
        player.add_floor_card(Card::new(Rank::King, Suit::Hearts));
        player.add_blind_card(Card::new(Rank::Queen, Suit::Hearts));

        let cleared_cards = player.clear_cards();
        assert_eq!(cleared_cards.len(), 3);
        assert_eq!(player.get_cards_count(), 0);
    }
}
