import { v4 } from "uuid";
import { Player } from "./player";
import { Table } from "./table";
import { Deck } from "./deck";
import { CARD_EFFECT, CardJson } from "../types/card";
import { Md5 } from "ts-md5";
import {
  GameTurn,
  GameTurnPlayer,
  GameTurnStatus,
  PlayerStatus,
  OpponentPlayerStatus,
  GameTurnFeedback,
} from "@common/game";
import { LobbyPlayer } from "../types/lobby";
import { Card } from "./card";

export class Instance {
  uid: string;
  players: Player[];
  table: Table;
  deck: Deck;
  turnIndex: number;
  playerCount: number;
  turnMoves: number;
  init: boolean;
  canPlayMove: boolean;

  constructor(players: LobbyPlayer[]) {
    this.uid = v4();
    this.table = new Table();
    this.deck = new Deck();
    this.turnIndex = 0;
    this.turnMoves = 0;
    this.playerCount = 2;
    this.players = [];
    this.init = false;
    this.canPlayMove = true;

    for (const player of players) {
      this.players.push(new Player(player.uid, player.name));
    }

    this.initAllCards();
  }

  isMyTurn(playerUid: string) {
    return this.getCurrentPlayer().getUid() === playerUid;
  }

  initInstance() {
    this.init = true;
  }

  getInitInstance() {
    return this.init;
  }

  resetPlayMove() {
    this.canPlayMove = true;
  }

  playCard(cardId: string): boolean {
    const currPlayer = this.players[this.turnIndex];
    const currCard = currPlayer.getCard(cardId);
    if (this.table.isCardPlayable(currCard!)) {
      if (this.canPlayMove) {
        const playCard = currPlayer.playCard(cardId);
        const checkCards = currPlayer.getCards(false) as Card[];
        this.canPlayMove =
          checkCards.filter((card) => card?.getRank() === currCard?.getRank())
            .length > 0;

        if (currCard?.getEffect() === CARD_EFFECT.DESTROY) {
          this.table.clear();
          this.canPlayMove = true;
          this.turnMoves = 0;
          this.lookNextTurn(currPlayer);
        } else {
          this.table.placeCard(playCard!);
          this.turnMoves = this.turnMoves + 1;
        }
        return true;
      }
    }
    return false;
  }


  lookNextTurn(player: Player) {
    if (player.isHandCardsEmpty() && this.deck.isDeckEmpty()) {
      if (!player.isFloorCardsEmpty()) {
        player.pickFloorCardsUp();
      }
      else {
        if (!player.isBlindCardsEmpty()) {
          player.pickBlindCardUp();
        }
      }
    }
  }

  isWinCondition(player: Player) {
    return player.isHandCardsEmpty() && this.deck.isDeckEmpty() && player.isFloorCardsEmpty() && player.isBlindCardsEmpty();
  }

  canEndTurn() {
    return this.turnMoves > 0;
  }

  pickupTurn() {
    const currPlayer = this.players[this.turnIndex];
    const currentTableCards = this.table.getCards() as Card[];
    currPlayer.pickCardsUp(currentTableCards);
    this.table.clear();
  }

  endTurn(pickUp?: boolean): boolean {
    if (!this.canEndTurn() && !pickUp) return false;
    this.lookNextTurn(this.players[this.turnIndex]);
    this.drawCard(this.players[this.turnIndex]);
    this.nextTurn();
    this.turnMoves = 0;
    return true;
  }

  getCurrentPlayer(): Player {
    return this.players[this.turnIndex];
  }

  getTableCards(): Card[] {
    return this.table.getCards() as Card[];
  }

  generateGameTurn(playerUid: string, feedback: GameTurnFeedback): GameTurn {
    const currPlayer = this.getCurrentPlayer();
    return {
      gameTurnStatus: this.generateGameTurnStatus(playerUid),
      gameTurnPlayer: this.generateGameTurnPlayer(feedback),
      gameTurnTable: this.table.getCards(true) as CardJson[],
      gameTurnDeck: this.deck.getCards(),
      gameTurnWinner: feedback?.hasWon ? { winnerUidHash: Md5.hashStr(currPlayer.getUid()) } : null,
    };
  }

  private generateGameTurnPlayer(feedback: GameTurnFeedback): GameTurnPlayer {
    const currPlayer = this.getCurrentPlayer();
    return {
      name: currPlayer.getName(),
      uidHash: Md5.hashStr(currPlayer.getUid()),
      action: feedback.action,
      message: feedback.message
    };
  }

  generateGameTurnStatus(playerUid: string): GameTurnStatus {
    const player = this.players.find((player) => player.getUid() === playerUid);
    return {
      playerStatus: this.generatePlayerStatus(player!),
      otherPlayers: this.generateOpponentPlayerStatus(player!),
    };
  }

  generatePlayerStatus(player: Player): PlayerStatus {
    const playerCards = player.getCards(true) as CardJson[];
    const floorCards = player.getFloorCards(true) as CardJson[];
    const hiddenCards = player.getHiddenCards(true) as CardJson[];
    const jsonFloorCards = floorCards.map((card: CardJson) => ({
      uidHash: Md5.hashStr(card.uid),
      rank: card.rank,
      suit: card.suit,
      effect: card.effect,
    }));
    const jsonHiddenCards = hiddenCards.map((card: CardJson) => ({
      uidHash: Md5.hashStr(card.uid),
    }));

    const playerUid = player.getUid();
    return {
      uidHash: playerUid && Md5.hashStr(playerUid),
      handCards: playerCards,
      name: player.getName(),
      floorCards: jsonFloorCards,
      hiddenCards: jsonHiddenCards,
    };
  }

  generateOpponentPlayerStatus(player: Player): OpponentPlayerStatus[] {
    const otherPlayers = this.players.filter(
      (_player) => _player.getUid() !== player.getUid()
    );
    return otherPlayers.map((op) => {
      const playerCards = op.getCards(true) as CardJson[];
      const floorCards = op.getFloorCards(true) as CardJson[];
      const hiddenCards = op.getHiddenCards(true) as CardJson[];
      const jsonFloorCards = floorCards.map((card: CardJson) => ({
        uidHash: Md5.hashStr(card.uid),
        rank: card.rank,
        suit: card.suit,
        effect: card.effect,
      }));
      const jsonHiddenCards = hiddenCards.map((card: CardJson) => ({
        uidHash: Md5.hashStr(card.uid),
      }));

      return {
        handCards: playerCards.map((card: CardJson) => ({
          uidHash: Md5.hashStr(card.uid),
        })),
        name: op.getName(),
        floorCards: jsonFloorCards,
        hiddenCards: jsonHiddenCards,
      };
    });
  }

  private nextTurn() {
    if (this.turnIndex >= this.players.length - 1) {
      this.turnIndex = 0;
    } else {
      this.turnIndex += 1;
    }
  }

  private drawCard(player: Player) {
    if (!this.deck.isDeckEmpty()) {
      while (player.getCards(false).length < 3 && !this.deck.isDeckEmpty()) {
        const deckCard = this.deck.drawCard();
        if (deckCard) {
          player.drawCard(deckCard);
        }
      }
    }
  }

  private initAllCards() {
    for (const player of this.players) {
      this.drawCard(player);

      for (let i = 0; i < 3; i++) {
        const deckCard = this.deck.drawCard();
        player.drawBlindCard(deckCard!);
      }

      for (let i = 0; i < 3; i++) {
        const deckCard = this.deck.drawCard();
        player.drawFloorCard(deckCard!);
      }
    }
  }

}
