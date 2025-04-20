import { WebSocketClient } from './wsClient';
import { EventType } from '@proto/ws';
import {
  GameInstanceAction,
  GameInstanceMessageAction,
  GameTurn,
  GameTurnRequest,
  GameTurnResponse,
  OpponentPlayerStatus,
  PlayerStatus,
} from "@proto/game";
import { GameInstance } from "../stores/gameInstance";
import { LobbyQueueResponse } from "@proto/lobby";
import { Opponent } from "@stores/opponent";

const SOCKET_EVENTS = {
  CONNECT: EventType.CONNECT,
  DISCONNECT: EventType.DISCONNECT,
  LOBBY_QUEUE: EventType.LOBBY_QUEUE,
  LOBBY_STATISTICS: EventType.LOBBY_STATISTICS,
  GAME_TURN: EventType.GAME_TURN,
} as const;

const WEBSOCKET_CONFIG = {
  DEV_URL: "ws://localhost:5000",
  PROD_URL: "wss://hiinakas.com/ws_hiinakas",
} as const;

export const getWebsocketUrl = () => {
  const isHttps = window.location.protocol === "https:";
  return isHttps ? WEBSOCKET_CONFIG.PROD_URL : WEBSOCKET_CONFIG.DEV_URL;
};

export class SocketManager {
  socket: WebSocketClient;
  private gameInstance: GameInstance;

  constructor(gameInstance: GameInstance) {
    this.gameInstance = gameInstance;
  }

  initialize() {
    this.initializeSocket();
    this.setupSocketListeners();
  }

  private initializeSocket() {
    this.socket = new WebSocketClient(getWebsocketUrl());
  }

  private setupSocketListeners() {
    this.setupGameEventListeners();
  }

  private setupGameEventListeners() {
    this.socket.on(SOCKET_EVENTS.LOBBY_QUEUE, (data: Uint8Array) => {
      const decodedMessage = LobbyQueueResponse.decode(data);
      console.log("decodedMessage", decodedMessage);
      this.handleLobbyConnect(decodedMessage);
    });

    this.socket.on(SOCKET_EVENTS.GAME_TURN, (data: Uint8Array) => {
      const decodedMessage = GameTurnResponse.decode(data);
      this.handleGameTurn(decodedMessage);
    });
  }

  playCard(cardId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const msg = this.createGameRequest(GameInstanceAction.PLAY_CARD, cardId);
      this.socket.once(SOCKET_EVENTS.GAME_TURN, (data: Uint8Array) => {
        const message = GameTurnResponse.decode(data);
        resolve(
          message.gameTurn?.player?.message?.type === GameInstanceMessageAction.INFO
        );
      });
      const encodedMsg = GameTurnRequest.encode(msg).finish();
      this.socket.emit(SOCKET_EVENTS.GAME_TURN, encodedMsg);
    });
  }

  endTurn() {
    const msg = this.createGameRequest(GameInstanceAction.END_TURN);
    const encodedMsg = GameTurnRequest.encode(msg).finish();
    this.socket.emit(SOCKET_EVENTS.GAME_TURN, encodedMsg);
  }

  pickUp() {
    const msg = this.createGameRequest(GameInstanceAction.PICK_UP);
    const encodedMsg = GameTurnRequest.encode(msg).finish();
    this.socket.emit(SOCKET_EVENTS.GAME_TURN, encodedMsg);
  }

  private createGameRequest(
    action: GameInstanceAction,
    cardId?: string
  ): GameTurnRequest {
    return GameTurnRequest.create({
      uid: this.gameInstance.currentLobby,
      player: {
        playerUid: this.gameInstance.player.uid,
        name: this.gameInstance.player.name,
        publicUid: this.gameInstance.player.publicUid,
      },
      action,
      cardId,
    });
  }

  private handleLobbyConnect = (msg: LobbyQueueResponse) => {
    console.debug("handleLobbyConnect", msg);
    this.gameInstance.currentLobby = msg?.gameUid;
  };

  private handleGameTurn = (message: GameTurnResponse) => {
    if (!message?.gameTurn) return;

    const gameTurn = message.gameTurn;
    this.updateGameState(gameTurn);

    if (!this.gameInstance.gameReady) {
      this.gameInstance.setGameReady();
    }
  };

  private updateGameState(gameTurn: GameTurn) {
    console.debug("updateGameState", gameTurn);
    const playerStatus = gameTurn.status?.playerStatus;

    this.updateTableAndDeck(gameTurn);
    this.updateTurnInfo(gameTurn);

    if (this.gameInstance.opponents.length === 0) {
      gameTurn.status?.otherPlayers.forEach((opponentInfo) => {
        const opponent = new Opponent();
        opponent.setName(opponentInfo.name);
        this.gameInstance.setOpponent(opponent);
      });
    }
    gameTurn.status?.otherPlayers.forEach((opponentInfo) => {
      this.updatePlayerStates(playerStatus, opponentInfo);
    });
  }

  private updateTableAndDeck(gameTurn: GameTurn) {
    this.gameInstance.table.setCards(gameTurn.table);
    this.gameInstance.deck.setCards(gameTurn.deck);
  }

  private updateTurnInfo(gameTurn: GameTurn) {
    const playerTurn = gameTurn.player;
    console.debug("updateTurnInfo", playerTurn);
    this.gameInstance.turn.setCurrentTurnName(playerTurn?.name);
    this.gameInstance.turn.setTurnMessage(playerTurn?.message);
    this.gameInstance.turn.setGameInstanceAction(playerTurn?.action);
    this.gameInstance.turn.setIsMyTurn(playerTurn?.isMyTurn);
    this.gameInstance.turn.setWinner(gameTurn.isWinner, this.gameInstance);
    if (
      gameTurn.player.action === GameInstanceAction.END_TURN ||
      gameTurn.player.action === GameInstanceAction.PICK_UP ||
      gameTurn.player.action === GameInstanceAction.INIT
    ) {
      this.gameInstance.timer.startTimer();
    }
  }

  private updatePlayerStates(
    playerStatus: PlayerStatus,
    opponentInfo: OpponentPlayerStatus
  ) {
    if (opponentInfo) {
      this.gameInstance.opponents
        .find((opponent) => opponent.name === opponentInfo.name)
        .setCards(opponentInfo.handCards);
      this.gameInstance.opponents
        .find((opponent) => opponent.name === opponentInfo.name)
        .setFloorCards(opponentInfo.floorCards);
      this.gameInstance.opponents
        .find((opponent) => opponent.name === opponentInfo.name)
        .setHiddenCards(opponentInfo.hiddenCards);
    }

    console.log("playerStatus", playerStatus);
    if (playerStatus) {
      console.log("setting new cards?");
      this.gameInstance.hand.setCards(playerStatus.handCards);
      this.gameInstance.hand.setFloorCards(playerStatus.floorCards);
      this.gameInstance.hand.setHiddenCards(playerStatus.hiddenCards);
    }
  }

  private handleDisconnect = (e: string) => {};
}
