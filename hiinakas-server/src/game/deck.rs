use rand::seq::SliceRandom;
use smallvec::SmallVec;
use crate::protos::card::{Card, Rank, Suit};

const DECK_SIZE: usize = 52;
type DeckVec = SmallVec<[Card; DECK_SIZE]>;

#[derive(Debug)]
pub struct Deck {
    cards: DeckVec,
}

impl Deck {
    pub fn new() -> Self {
        let mut cards = Self::generate_deck();
        let mut rng = rand::thread_rng();
        cards.shuffle(&mut rng);

        Self {
            cards,
        }
    }

    pub fn is_deck_empty(&self) -> bool {
        self.cards.len() <= 0
    }

    pub fn get_cards(&self) -> SmallVec<[Card; DECK_SIZE]> {
      self.cards.clone()
    }

    pub fn cards_left(&self) -> usize {
        self.cards.len()
    }

    pub fn draw_card(&mut self) -> Option<Card> {
        if self.is_deck_empty() {
            None
        } else {
           Some(self.cards.remove(0))
        }
    }

    fn generate_deck() -> DeckVec {
        const RANKS: [Rank; 13] = [
            Rank::Two, Rank::Three, Rank::Four, Rank::Five,
            Rank::Six, Rank::Seven, Rank::Eight, Rank::Nine,
            Rank::Ten, Rank::Jack, Rank::Queen, Rank::King,
            Rank::Ace
        ];

        const SUITS: [Suit; 4] = [
            Suit::Hearts, Suit::Diamonds,
            Suit::Clubs, Suit::Spades
        ];

        let mut cards = SmallVec::with_capacity(DECK_SIZE);
        for rank in RANKS.iter() {
            for suit in SUITS.iter() {
                cards.push(Card::new(*rank, *suit));
            }
        }
        cards
    }

    pub fn clear(&mut self) {
        self.cards.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deck_size() {
        let deck = Deck::new();
        assert_eq!(deck.cards_left(), DECK_SIZE);
    }

    #[test]
    fn test_draw_all_cards() {
        let mut deck = Deck::new();
        let mut drawn_cards = SmallVec::<[Card; DECK_SIZE]>::new();

        while let Some(card) = deck.draw_card() {
            drawn_cards.push(card);
        }

        assert_eq!(drawn_cards.len(), DECK_SIZE);
        assert!(deck.is_deck_empty());
    }

    #[test]
    fn test_unique_cards() {
        let mut deck = Deck::new();
        let mut seen_cards = std::collections::HashSet::new();

        while let Some(card) = deck.draw_card() {
            let card_id = (card.get_rank() as u8, card.get_suit() as u8);
            assert!(!seen_cards.contains(&card_id), "Duplicate card found");
            seen_cards.insert(card_id);
        }

        assert_eq!(seen_cards.len(), DECK_SIZE);
    }
}