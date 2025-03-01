use std::{sync::Arc, time::Duration};
use crate::utils::timer::Timer;
use smallvec::SmallVec;
use tokio::sync::RwLock;
use tracing::{ debug, info, error };
use uuid::Uuid;

use crate::protos::{
    card::{ Effect, SmallCard },
    game::{
        GameTurn,
        GameTurnFeedback,
        GameTurnPlayer,
        GameTurnStatus,
        OpponentPlayerStatus,
        PlayerStatus,
    },
};

use super::{ deck::Deck, player::Player, table::Table };

const MAX_PLAYERS: usize = 4;

#[derive(Debug, Clone)]
pub struct GameInstance {
    uid: String,
    players: Arc<RwLock<SmallVec<[Player; MAX_PLAYERS]>>>,
    deck: Arc<RwLock<Deck>>,
    table: Arc<RwLock<Table>>,
    turn_index: Arc<RwLock<usize>>,
    turn_moves: Arc<RwLock<usize>>,
    init: Arc<RwLock<bool>>,
    timer: Arc<RwLock<Option<Timer>>>,
    stop_signal: Arc<RwLock<bool>>,
}

impl GameInstance {
    pub fn new() -> Self {
        Self {
            uid: Uuid::new_v4().to_string(),
            players: Arc::new(RwLock::new(SmallVec::with_capacity(MAX_PLAYERS))),
            deck: Arc::new(RwLock::new(Deck::new())),
            table: Arc::new(RwLock::new(Table::new())),
            turn_index: Arc::new(RwLock::new(0)),
            turn_moves: Arc::new(RwLock::new(0)),
            init: Arc::new(RwLock::new(false)),
            timer: Arc::new(RwLock::new(None)),
            stop_signal: Arc::new(RwLock::new(false)),
        }
    }

    pub fn get_uid(&self) -> &str {
        &self.uid
    }

    pub async fn get_players(&self) -> SmallVec<[Player; MAX_PLAYERS]> {
        self.players.read().await.clone()
    }

    pub async fn get_current_player(&self) -> Option<Player> {
        let players = self.players.read().await;
        let player = players.get(*self.turn_index.read().await);
        match player {
            Some(p) => Some(p.clone()),
            None => None,
        }
    }

    pub async fn get_next_player(&self) -> Option<Player> {
        let turn_index = *self.turn_index.read().await;
        let players = self.players.read().await;
        let player = players.get((turn_index + 1) % players.len());
        match player {
            Some(p) => Some(p.clone()),
            None => None,
        }
    }

    pub async fn init_instance(&self, callback: Box<dyn Fn() + Send + Sync>) -> Result<(), Box<dyn std::error::Error>> {
        let mut init = self.init.write().await;
        if *init {
            return Ok(());
        }

        self.init_all_cards().await?;
        self.start_timer().await?;

        let timer = self.timer.read().await;
        let timer_ref = timer.as_ref().unwrap();
        let timer_clone = timer_ref.clone();
        let stop_signal = self.stop_signal.clone();

        tokio::spawn(async move {
            loop {
                if *stop_signal.read().await {
                    break;
                }

                let timer = timer_clone.clone();
                
                if timer.expired().await {
                   callback();
                   break;
                }
            }
        });

        let mut turn_index = self.turn_index.write().await;
        *turn_index = 0;
        *init = true;

        Ok(())
    }

    async fn init_all_cards(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut deck = self.deck.write().await;
        let mut players = self.players.write().await;

        for player in players.iter_mut() {
            // Deal hand cards (3)
            for _ in 0..3 {
                if let Some(card) = deck.draw_card() {
                    player.add_hand_card(card);
                }
            }

            // Deal floor cards (3)
            for _ in 0..3 {
                if let Some(card) = deck.draw_card() {
                    player.add_floor_card(card);
                }
            }

            // Deal blind cards (3)
            for _ in 0..3 {
                if let Some(card) = deck.draw_card() {
                    player.add_blind_card(card);
                }
            }
        }

        //debug!("initialized all cards");
        Ok(())
    }

    async fn start_timer(&self) -> Result<(), Box<dyn std::error::Error>> {
        let timer = Timer::with_duration(Duration::from_millis(60070));
        let mut timer_guard = self.timer.write().await;
        *timer_guard = Some(timer);
        Ok(())
    }

    pub async fn stop_timer(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut stop = self.stop_signal.write().await;
        *stop = true;
        Ok(())
    }

    pub async fn add_player(&self, player: Player) -> Result<(), Box<dyn std::error::Error>> {
        let mut players = self.players.write().await;
        if players.len() >= MAX_PLAYERS {
            return Err("Game is full".into());
        }
        players.push(player);
        Ok(())
    }

    pub async fn play_card(&self, card_uid: String) -> bool {
        let turn_index = *self.turn_index.read().await;
        let card_played = {
            let mut players = self.players.write().await;

            let player = match players.get_mut(turn_index) {
                Some(p) => p,
                None => {
                    return false;
                }
            };

            let card = match player.get_card(&card_uid) {
                Some(c) => c,
                None => {
                    return false;
                }
            };

            let mut table = self.table.write().await;
            if !table.is_card_playable(&card, self.get_turn_moves().await).await {
                return false;
            }

            player.remove_hand_card(&card_uid);

            let last_card = table.get_top_card();
            match last_card {
                Some(last_card) => {
                    let rank = last_card.get_rank();
                    if rank == card.get_rank() {
                        self.set_turn_moves(0).await;
                    }
                }
                None => {
                    // continue...
                }
            }
            
            // TODO:: Not working properly, fix it.
            let table_cards = table.get_cards();
            if table_cards.len() >= 4 {
                let last_three = &table_cards[table_cards.len().saturating_sub(3)..];
                if
                    last_three.len() == 4 &&
                    last_three.iter().all(|c| c.get_rank() == card.get_rank())
                {
                    table.clear();
                    self.set_turn_moves(0).await;
                }
            }

            if card.get_effect() == Effect::Destroy {
                table.clear();
                self.set_turn_moves(0).await;
                true
            } else {
                table.add_card(card);
                self.set_turn_moves(self.get_turn_moves().await + 1).await;
                true
            }
        };

        card_played
    }

    pub async fn end_turn(&self) -> bool {
        let turn_index = *self.turn_index.read().await;
        let mut players = self.players.write().await;

        match players.get_mut(turn_index) {
            Some(player) => {
                self.draw_cards(player).await;

                drop(players);

                let _ = self.look_next_turn().await;
        
                self.next_turn().await;
        
                self.set_turn_moves(0).await;

                let mut timer_guard = self.timer.write().await;
                if let Some(timer) = &mut *timer_guard {
                    //debug!("resetting timer");
                    timer.reset().await;
                    //debug!("timer reset");
                }
                drop(timer_guard);

                true
            }
            None => {
                return false;
            }
        }
    }

    pub async fn pickup_turn(&self) -> Result<(), Box<dyn std::error::Error>> {
        let turn_index = *self.turn_index.read().await;
        
        let table_cards = {
            let table = self.table.read().await;
            table.get_cards().clone()
        };

        {
            let mut players = self.players.write().await;
            let player = match players.get_mut(turn_index) {
                Some(p) => p,
                None => return Ok(()),
            };

            for card in table_cards {
                player.add_hand_card(card);
            }
        }

        {
            let mut table = self.table.write().await;
            table.clear();
        }

        self.next_turn().await;

        self.set_turn_moves(0).await;

        {
            if let Ok(mut timer_guard) = self.timer.try_write() {
                if let Some(timer) = &mut *timer_guard {
                    timer.reset().await;
                }
            }
        }

        Ok(())
    }

    async fn draw_card(&self, player: &mut Player) {
        let mut deck = self.deck.write().await;
        if let Some(card) = deck.draw_card() {
            player.add_hand_card(card);
        }
    }

    async fn draw_cards(&self, player: &mut Player) {
        const TARGET_CARDS: usize = 3;
        let current_cards = player.get_hand_cards().len();
        
        if current_cards >= TARGET_CARDS {
            return;
        }
    
        let cards_to_draw = TARGET_CARDS - current_cards;
        
        for _ in 0..cards_to_draw {
            self.draw_card(player).await;
        }
    }

    async fn next_turn(&self) {
        let mut turn_index = self.turn_index.write().await;
        let players = self.players.read().await;
        *turn_index = (*turn_index + 1) % players.len();
    }

    pub async fn look_next_turn(&self) -> Result<(), Box<dyn std::error::Error>> {
        let turn_index = {
            let index = *self.turn_index.read().await;
            index
        };
        let players = self.players.read().await;
        let player = &players[turn_index];
        let needs_cards = {
            let deck = self.deck.read().await;
            player.get_hand_cards().is_empty() && deck.get_cards().is_empty()
        };

        drop(players);

        // TODO:: Not working properly, fix it.
         // If only holding 3 EFFECR::DESTROY cards and placing them on the table, draw cards after the placement
        /* 
        {
            let mut players = self.players.write().await;
            let player = players.get_mut(turn_index).unwrap();
            if player.get_hand_cards().is_empty() && self.table.read().await.get_cards().is_empty() {
                self.draw_card(player).await;
                return Ok(());
            }
        }
        */

        if needs_cards {
            let mut players = self.players.write().await;
            match players.get_mut(turn_index) {
                Some(player) => {
                    if !player.get_floor_cards().is_empty() {
                        player.pick_up_floor_cards();
                    } else if !player.get_blind_cards().is_empty() {
                        player.pick_up_blind_cards();
                    }
                }
                None => return Ok(()),
            }
        }

        Ok(())
    }

    pub async fn generate_game_turn(
        &self,
        player_uid: &str,
        feedback: GameTurnFeedback
    ) -> GameTurn {
        //info!("Generating game turn for player: {:?}", player_uid);
        let players = self.players.read().await;
        let curr_player = match players
            .iter()
            .find(|p| p.get_uid() == player_uid)
        {
            Some(p) => p,
            None => return GameTurn::default(),
        };

        let table = self.table.read().await;
        let deck = self.deck.read().await;
        let feedback_clone = feedback.clone();

        let game_turn = GameTurn {
            status: Some(self.generate_game_turn_status(player_uid).await),
            player: Some(self.generate_game_turn_player(feedback, curr_player).await),
            table: table
                .get_cards()
                .iter()
                .map(|c| SmallCard {
                    value: c.to_number() as u32,
                })
                .collect(),
            deck: deck.get_cards().len() as u32,
            is_winner: feedback_clone.has_won && self.is_win_condition(player_uid, feedback_clone.has_disconnect).await,
        };

        game_turn
    }

    async fn generate_game_turn_player(
        &self,
        feedback: GameTurnFeedback,
        curr_player: &Player
    ) -> GameTurnPlayer {
        GameTurnPlayer {
            name: curr_player.get_name().to_string(),
            is_my_turn: self.is_my_turn(curr_player.get_uid()).await,
            action: feedback.action,
            message: feedback.message,
        }
    }

    async fn generate_game_turn_status(&self, player_uid: &str) -> GameTurnStatus {
        let players = self.players.read().await;
        let player = match players
            .iter()
            .find(|p| p.get_uid() == player_uid)
        {
            Some(p) => p,
            None => return GameTurnStatus::default(),
        };

        GameTurnStatus {
            player_status: Some(self.generate_player_status(player)),
            other_players: self.generate_opponent_player_status(player).await,
        }
    }

    fn generate_player_status(&self, player: &Player) -> PlayerStatus {
        let player_cards = player.get_hand_cards();
        let hidden_cards = player.get_blind_cards();

        PlayerStatus {
            hand_cards: player_cards,
            floor_cards: player.get_small_floor_cards(),
            hidden_cards: hidden_cards.len() as u32,
        }
    }

    async fn generate_opponent_player_status(&self, player: &Player) -> Vec<OpponentPlayerStatus> {
        let players = self.players.read().await;
        players
            .iter()
            .filter(|p| p.get_uid() != player.get_uid())
            .map(|op| {
                let player_cards = op.get_hand_cards();
                let hidden_cards = op.get_blind_cards();

                OpponentPlayerStatus {
                    hand_cards: player_cards.len() as u32,
                    name: op.get_name().to_string(),
                    floor_cards: op.get_small_floor_cards(),
                    hidden_cards: hidden_cards.len() as u32,
                }
            })
            .collect()
    }

    pub async fn get_turn_moves(&self) -> usize {
        *self.turn_moves.read().await
    }

    pub async fn set_turn_moves(&self, moves: usize) {
        let mut turn_moves = self.turn_moves.write().await;
        *turn_moves = moves;
    }

    async fn can_end_turn(&self) -> bool {
        let turn_moves = *self.turn_moves.read().await;
        turn_moves > 0
    }

    pub async fn is_initialized(&self) -> bool {
        *self.init.read().await
    }

    pub async fn is_player_in_game(&self, player_uid: &str) -> bool {
        let players = self.players.read().await;
        players.iter().any(|p| p.get_uid() == player_uid)
    }

    pub async fn is_my_turn(&self, player_uid: &str) -> bool {
        let turn_index = *self.turn_index.read().await;
        let players = self.players.read().await;
        let player = match players
            .iter()
            .find(|p| p.get_uid() == player_uid)
        {
            Some(p) => p,
            None => return false,
        };
        player.get_uid() == players[turn_index].get_uid()
    }

    pub async fn is_win_condition(&self, player_uid: &str, has_disconnect: bool) -> bool {
        let players = self.players.read().await;
        let player = match players
            .iter()
            .find(|p| p.get_uid() == player_uid)
        {
            Some(p) => p,
            None => return false,
        };
        if has_disconnect {
            return true;
        }
        player.is_hand_cards_empty() &&
            player.is_floor_cards_empty() &&
            player.is_blind_cards_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_game_instance_creation() {
        let instance = GameInstance::new();
        assert!(!instance.is_initialized().await);
        assert_eq!(instance.get_turn_moves().await, 0);
    }

    #[tokio::test]
    async fn test_add_player() {
        let instance = GameInstance::new();
        let player = Player::new("test_uid".to_string(), "Test Player".to_string());

        instance.add_player(player).await.unwrap();

        let players = instance.players.read().await;
        assert_eq!(players.len(), 1);
    }

    #[tokio::test]
    async fn test_game_initialization() {
        let instance = GameInstance::new();
        let player1 = Player::new("p1".to_string(), "Player 1".to_string());
        let player2 = Player::new("p2".to_string(), "Player 2".to_string());

        instance.add_player(player1).await.unwrap();
        instance.add_player(player2).await.unwrap();

        instance.init_instance(Box::new(|| {})).await.unwrap();

        assert!(instance.is_initialized().await);

        let players = instance.players.read().await;
        for player in players.iter() {
            assert_eq!(player.get_hand_cards_count(), 3);
            assert_eq!(player.get_floor_cards_count(), 3);
            assert_eq!(player.get_blind_cards_count(), 3);
        }
    }

    #[tokio::test]
    async fn test_play_card_success() {
        let instance = GameInstance::new();
        let player1 = Player::new("p1".to_string(), "Player 1".to_string());
        let player2 = Player::new("p2".to_string(), "Player 2".to_string());
        let player1_clone = player1.clone();

        instance.add_player(player1).await.unwrap();
        instance.add_player(player2).await.unwrap();

        
        instance.init_instance(Box::new(|| {})).await.unwrap();
        assert!(instance.is_initialized().await);
        let hand_cards = player1_clone.get_hand_cards();
        let card = match hand_cards.first() {
            Some(c) => c,
            None => {
                error!("PANIC! No card found");
                return;
            },
        };

        instance.play_card(card.get_uid().to_string()).await;

        let table_cards = instance.table.read().await.get_cards();
        assert_eq!(table_cards.len(), 1);
    }

    #[tokio::test]
    async fn test_play_card_failure() {
        let instance = GameInstance::new();
        let player1 = Player::new("p1".to_string(), "Player 1".to_string());
        let player2 = Player::new("p2".to_string(), "Player 2".to_string());
    }

    #[tokio::test]
    async fn test_pickup_turn() {
        let instance = GameInstance::new();
        let player1 = Player::new("p1".to_string(), "Player 1".to_string());
        let player2 = Player::new("p2".to_string(), "Player 2".to_string());

        instance.add_player(player1).await.unwrap();
        instance.add_player(player2).await.unwrap();

        instance.init_instance(Box::new(|| {})).await.unwrap();

        assert!(instance.is_initialized().await);


    }
}
