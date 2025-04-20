use crate::utils::timer::Timer;
use chrono::{DateTime, Utc};
use smallvec::SmallVec;
use std::{sync::Arc, time::Duration};
use tokio::sync::{RwLock, Mutex};
use tracing::{debug, error, info, trace};
use uuid::Uuid;
use tokio::sync::mpsc;

use crate::protos::{
    card::{Effect, SmallCard},
    game::{
        GameTurn, GameTurnFeedback, GameTurnPlayer, GameTurnStatus, OpponentPlayerStatus,
        PlayerStatus,
    },
};

use super::{deck::Deck, player::Player, table::Table};

const MAX_PLAYERS: usize = 5;
const TIMER_DURATION: u64 = 120070;

#[derive(Clone)]
pub enum TimerCommand {
    Reset,
    Stop,
}

#[derive(Debug, Clone)]
pub struct GameInstance {
    uid: String,
    players: Arc<RwLock<SmallVec<[Player; MAX_PLAYERS]>>>,
    deck: Arc<RwLock<Deck>>,
    table: Arc<RwLock<Table>>,
    turn_index: Arc<RwLock<usize>>,
    turn_moves: Arc<RwLock<usize>>,
    init: Arc<RwLock<bool>>,
    timer_tx: Arc<Mutex<mpsc::Sender<TimerCommand>>>,
    timer_rx: Arc<Mutex<mpsc::Receiver<TimerCommand>>>,
    created_at: Arc<RwLock<DateTime<Utc>>>,
}

#[derive(Debug, Clone)]
pub struct PlayCardFeedback {
    pub is_played: bool,
    pub effect: Effect,
}

impl GameInstance {
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel(1);
        Self {
            uid: Uuid::new_v4().to_string(),
            players: Arc::new(RwLock::new(SmallVec::with_capacity(MAX_PLAYERS))),
            deck: Arc::new(RwLock::new(Deck::new())),
            table: Arc::new(RwLock::new(Table::new())),
            turn_index: Arc::new(RwLock::new(0)),
            turn_moves: Arc::new(RwLock::new(0)),
            init: Arc::new(RwLock::new(false)),
            timer_tx: Arc::new(Mutex::new(tx)),
            timer_rx: Arc::new(Mutex::new(rx)),
            created_at: Arc::new(RwLock::new(Utc::now())),
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
        trace!("player length: {:?}", players.len());
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

    pub async fn get_player_connection_id(&self, player_uid: &str) -> String {
        let players = self.players.read().await;
        let player = players.iter().find(|p| p.get_uid() == player_uid);
        match player {
            Some(p) => p.get_connection_id().to_string(),
            None => "".to_string(),
        }
    }

    pub async fn init_instance(
        &self,
        callback: Box<dyn Fn() + Send + Sync>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut init = self.init.write().await;
        if *init {
            return Ok(());
        }

        self.init_all_cards().await?;

        self.start_timer(callback);

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
                    trace!(
                        "Dealing hand card: {:?} to player: {:?}",
                        card,
                        player.get_name()
                    );
                    player.add_hand_card(card);
                }
            }

            // Deal floor cards (3)
            for _ in 0..3 {
                if let Some(card) = deck.draw_card() {
                    trace!(
                        "Dealing floor card: {:?} to player: {:?}",
                        card,
                        player.get_name()
                    );
                    player.add_floor_card(card);
                }
            }

            // Deal blind cards (3)
            for _ in 0..3 {
                if let Some(card) = deck.draw_card() {
                    trace!(
                        "Dealing blind card: {:?} to player: {:?}",
                        card,
                        player.get_name()
                    );
                    player.add_blind_card(card);
                }
            }
        }

        //debug!("initialized all cards");
        Ok(())
    }

    pub fn start_timer(&self, callback: impl FnOnce() + Send + 'static) {
        let mut timer = Timer::new(Duration::from_millis(TIMER_DURATION));
        let self_clone = self.clone();
        
        tokio::spawn(async move {
            let mut timer_rx = self_clone.timer_rx.as_ref().lock().await;
            loop {
                tokio::select! {
                    _ = async { timer.wait_until_expired().await } => {
                        println!("Timer expired!");
                        callback();
                        break;
                    }
                    Some(cmd) = timer_rx.recv() => {
                        trace!("Received timer command:");
                        match cmd {
                            TimerCommand::Reset => timer.reset(),
                            TimerCommand::Stop => break,
                        }
                    }
                }
            }
        });
    }

    pub async fn stop_timer(&self) -> Result<(), Box<dyn std::error::Error>> {
        let timer_tx = self.timer_tx.as_ref().lock().await;
        timer_tx.send(TimerCommand::Stop).await?;
        Ok(())
    }

    pub async fn clean(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut players = self.players.write().await;
        players.clear();

        let mut deck = self.deck.write().await;
        deck.clear();

        let mut table = self.table.write().await;
        table.clear();

        let _ = self.stop_timer().await;
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

    pub async fn remove_player(&self, player_uid: &str) -> Result<(), Box<dyn std::error::Error>> {
        let mut players = self.players.write().await;
        let player_index = match players.iter().position(|p| p.get_uid() == player_uid) {
            Some(index) => index,
            None => return Err("Player not found".into()),
        };
        players.remove(player_index);
        Ok(())
    }

    pub async fn play_card(&self, card_uid: String) -> PlayCardFeedback {
        let turn_index = *self.turn_index.read().await;

        let mut players = self.players.write().await;

        let player = match players.get_mut(turn_index) {
            Some(p) => p,
            None => {
                trace!("Player not found, returning no effect");
                return PlayCardFeedback {
                    is_played: false,
                    effect: Effect::NoEffect,
                };
            }
        };

        let card = match player.get_card(&card_uid) {
            Some(c) => c,
            None => {
                trace!("Card not found, returning no effect");
                return PlayCardFeedback {
                    is_played: false,
                    effect: Effect::NoEffect,
                };
            }
        };

        let mut table = self.table.write().await;
        if !table
            .is_card_playable(&card, self.get_turn_moves().await)
            .await
        {
            trace!("Card is not playable");
            return PlayCardFeedback {
                is_played: false,
                effect: Effect::NoEffect,
            };
        }

        player.remove_hand_card(&card_uid);

        let last_card = table.get_top_card();
        if let Some(last_card) = last_card {
            let rank = last_card.get_rank();
            if rank == card.get_rank() {
                trace!("Card is the same rank, resetting turn moves");
                self.set_turn_moves(0).await;
            }
        }

        // If 4 cards
        let table_cards = table.get_cards();
        if table_cards.len() >= 3 {
            let last_three = &table_cards[table_cards.len().saturating_sub(3)..];
            if last_three.len() == 3 && last_three.iter().all(|c| c.get_rank() == card.get_rank()) {
                trace!("4 cards in a row, destroying table");
                table.clear();
                self.set_turn_moves(0).await;
                return PlayCardFeedback {
                    is_played: true,
                    effect: Effect::Destroy,
                };
            }
        }

        if card.get_effect() == Effect::Destroy {
            trace!("Card is destroy, destroying table");
            table.clear();
            self.set_turn_moves(0).await;
            self.draw_card(player).await;
            PlayCardFeedback {
                is_played: true,
                effect: Effect::Destroy,
            }
        } else {
            trace!("Regular card, adding to table");
            let effect = card.get_effect();
            table.add_card(card);
            self.set_turn_moves(self.get_turn_moves().await + 1).await;
            PlayCardFeedback {
                is_played: true,
                effect: effect,
            }
        }
    }

    pub async fn end_turn(&self) -> bool {
        let turn_index = *self.turn_index.read().await;
        let mut players = self.players.write().await;

        match players.get_mut(turn_index) {
            Some(player) => {
                trace!("Ending turn for player: {:?}", player.get_name());
                self.draw_cards(player).await;

                drop(players);

                let _ = self.look_next_turn().await;

                self.next_turn().await;

                self.set_turn_moves(0).await;

                let timer_tx = self.timer_tx.as_ref().lock().await;
                let _ = timer_tx.send(TimerCommand::Reset).await;

                true
            }
            None => {
                trace!("Player not found, returning false");
                return false;
            }
        }
    }

    pub async fn pickup_turn(&self) -> Result<(), Box<dyn std::error::Error>> {
        trace!("Picking up turn");
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
            let timer_tx = self.timer_tx.as_ref().lock().await;
            let _ = timer_tx.send(TimerCommand::Reset).await;
        }

        Ok(())
    }

    async fn draw_card(&self, player: &mut Player) {
        trace!("Drawing card for player: {:?}", player.get_name());
        let mut deck = self.deck.write().await;
        if let Some(card) = deck.draw_card() {
            player.add_hand_card(card);
        }
    }

    pub async fn draw_cards(&self, player: &mut Player) {
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
        feedback: GameTurnFeedback,
    ) -> GameTurn {
        let player_name = self.players.read().await[*self.turn_index.read().await]
            .get_name()
            .to_string();
        debug!("Generating game turn for player: {:?}", player_name);
        let players = self.players.read().await;
        let curr_player = match players.iter().find(|p| p.get_uid() == player_uid) {
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
            is_winner: feedback_clone.has_won
                && self
                    .is_win_condition(player_uid, feedback_clone.has_disconnect)
                    .await,
        };

        game_turn
    }

    async fn generate_game_turn_player(
        &self,
        feedback: GameTurnFeedback,
        curr_player: &Player,
    ) -> GameTurnPlayer {
        GameTurnPlayer {
            name: self.players.read().await[*self.turn_index.read().await]
                .get_name()
                .to_string(),
            is_my_turn: self.is_my_turn(curr_player.get_uid()).await,
            action: feedback.action,
            message: feedback.message,
        }
    }

    async fn generate_game_turn_status(&self, player_uid: &str) -> GameTurnStatus {
        let players = self.players.read().await;
        let player = match players.iter().find(|p| p.get_uid() == player_uid) {
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

        trace!("Gen player status for player: {:?}, hand cards: {:?}, floor cards: {:?}, hidden cards: {:?}, game uid: {:?}", player.get_name(), player_cards, player.get_small_floor_cards(), hidden_cards, self.uid);

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
        let player = match players.iter().find(|p| p.get_uid() == player_uid) {
            Some(p) => p,
            None => return false,
        };
        player.get_uid() == players[turn_index].get_uid()
    }

    pub async fn is_win_condition(&self, player_uid: &str, has_disconnect: bool) -> bool {
        let players = self.players.read().await;
        let player = match players.iter().find(|p| p.get_uid() == player_uid) {
            Some(p) => p,
            None => return false,
        };
        if has_disconnect {
            return true;
        }
        player.is_hand_cards_empty()
            && player.is_floor_cards_empty()
            && player.is_blind_cards_empty()
    }

    pub async fn get_start_time(&self) -> DateTime<Utc> {
        *self.created_at.read().await
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
        let player = Player::new(
            "test_uid".to_string(),
            "test_public_uid".to_string(),
            "Test Player".to_string(),
            "Test Player".to_string(),
        );

        instance.add_player(player).await.unwrap();

        let players = instance.players.read().await;
        assert_eq!(players.len(), 1);
    }

    #[tokio::test]
    async fn test_game_initialization() {
        let instance = GameInstance::new();
        let player1 = Player::new(
            "p1".to_string(),
            "public_p1".to_string(),
            "Player 1".to_string(),
            "Player 1".to_string(),
        );
        let player2 = Player::new(
            "p2".to_string(),
            "public_p2".to_string(),
            "Player 2".to_string(),
            "Player 2".to_string(),
        );

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
        let player1 = Player::new(
            "p1".to_string(),
            "public_p1".to_string(),
            "Player 1".to_string(),
            "Player 1".to_string(),
        );
        let player2 = Player::new(
            "p2".to_string(),
            "public_p2".to_string(),
            "Player 2".to_string(),
            "Player 2".to_string(),
        );
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
            }
        };

        instance.play_card(card.get_uid().to_string()).await;

        let table_cards = instance.table.read().await.get_cards();
        assert_eq!(table_cards.len(), 1);
    }

    #[tokio::test]
    async fn test_play_card_failure() {
        let instance = GameInstance::new();
        let player1 = Player::new(
            "p1".to_string(),
            "public_p1".to_string(),
            "Player 1".to_string(),
            "Player 1".to_string(),
        );
        let player2 = Player::new(
            "p2".to_string(),
            "public_p2".to_string(),
            "Player 2".to_string(),
            "Player 2".to_string(),
        );
    }

    #[tokio::test]
    async fn test_pickup_turn() {
        let instance = GameInstance::new();
        let player1 = Player::new(
            "p1".to_string(),
            "public_p1".to_string(),
            "Player 1".to_string(),
            "Player 1".to_string(),
        );
        let player2 = Player::new(
            "p2".to_string(),
            "public_p2".to_string(),
            "Player 2".to_string(),
            "Player 2".to_string(),
        );

        instance.add_player(player1).await.unwrap();
        instance.add_player(player2).await.unwrap();

        instance.init_instance(Box::new(|| {})).await.unwrap();

        assert!(instance.is_initialized().await);
    }
}
