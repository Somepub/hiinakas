import { Socket, io } from "socket.io-client";
import { GameInstanceAction, GameInstanceMessageAction, GameTurn, GameTurnRequest, GameTurnResponse, OpponentPlayerStatus, PlayerStatus } from "@proto/game";
import { GameInstance } from "../stores/gameInstance";
import { LobbyQueueResponse } from "@proto/lobby";

const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  LOBBY_QUEUE: 'lobby/queue',
  GAME_TURN: 'game/turn'
} as const;

const WEBSOCKET_CONFIG = {
  DEV_URL: "ws://localhost:5000",
  PROD_URL: "wss://gameyard.pro",
  PATH: '/v2/curak/',
  POLLING_INTERVAL: 2500,
  CONNECT_DELAY: 100  
} as const;

export const getWebsocketUrl = () => {
  const isHttps = window.location.protocol === 'https:';
  return isHttps ? WEBSOCKET_CONFIG.PROD_URL : WEBSOCKET_CONFIG.DEV_URL;
};

export class SocketManager {
  socket: Socket;
  private gameInstance: GameInstance;

  constructor(gameInstance: GameInstance) {
    this.gameInstance = gameInstance;
  }

  initialize() {
    this.initializeSocket();
    this.setupSocketListeners();
  }

  private initializeSocket() {
    this.socket = io(getWebsocketUrl(), {
      secure: true,
      rejectUnauthorized: true,
    });
  }

  private setupSocketListeners() {
    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log("Socket connected");
      this.setupGameEventListeners();
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, this.handleDisconnect);
  }

  private setupGameEventListeners() {
    this.socket.on(SOCKET_EVENTS.LOBBY_QUEUE, (message: ArrayBuffer) => {
      const decodedMessage = LobbyQueueResponse.decode(new Uint8Array(message));
      console.log("decodedMessage", decodedMessage);
      this.handleLobbyConnect(decodedMessage);
    });
    this.socket.on(SOCKET_EVENTS.GAME_TURN, (message: ArrayBuffer) => {
      const decodedMessage = GameTurnResponse.decode(new Uint8Array(message));
      this.handleGameTurn(decodedMessage);
    });
  }

  playCard(cardId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const msg = this.createGameRequest(GameInstanceAction.PLAY_CARD, cardId);
      this.socket.once(SOCKET_EVENTS.GAME_TURN, (message: GameTurnResponse) => {
        resolve(message.gameTurn?.player?.message?.type === GameInstanceMessageAction.INFO);
      });
      const encodedMsg = Array.from(GameTurnRequest.encode(msg).finish());
      this.socket.emit(SOCKET_EVENTS.GAME_TURN, encodedMsg);
    });
  }

  endTurn() {
    const msg = this.createGameRequest(GameInstanceAction.END_TURN);
    const encodedMsg = Array.from(GameTurnRequest.encode(msg).finish());
    this.socket.emit(SOCKET_EVENTS.GAME_TURN, encodedMsg);
  }

  pickUp() {
    const msg = this.createGameRequest(GameInstanceAction.PICK_UP);
    const encodedMsg = Array.from(GameTurnRequest.encode(msg).finish());
    this.socket.emit(SOCKET_EVENTS.GAME_TURN, encodedMsg);
  }

  private createGameRequest(action: GameInstanceAction, cardId?: string): GameTurnRequest {
    return GameTurnRequest.create({
      uid: this.gameInstance.currentLobby,
      player: {
        playerUid: this.gameInstance.player.uid,
        name: this.gameInstance.player.name,
      },
      action,
      cardId,
    });
  }

  private handleLobbyConnect = (msg: LobbyQueueResponse) => {
    console.debug("handleLobbyConnect", msg);
    this.gameInstance.currentLobby = msg?.gameUid;
  }

  private handleGameTurn = (message: GameTurnResponse) => {
    if (!message?.gameTurn) return;
    
    const gameTurn = message.gameTurn;
    this.updateGameState(gameTurn);
    
    if (!this.gameInstance.gameReady) {
      this.gameInstance.setGameReady();
    }
  }

  private updateGameState(gameTurn: GameTurn) {
    console.debug("updateGameState", gameTurn);
    const playerStatus = gameTurn.status?.playerStatus;
    const opponentInfo = gameTurn.status?.otherPlayers[0];

    this.updateTableAndDeck(gameTurn);
    this.updateTurnInfo(gameTurn);
    this.updatePlayerStates(playerStatus, opponentInfo);
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
    this.gameInstance.turn.setWinner(
      gameTurn.isWinner,
      this.gameInstance
    ); 
    if(gameTurn.player.action === GameInstanceAction.END_TURN || gameTurn.player.action === GameInstanceAction.PICK_UP || gameTurn.player.action === GameInstanceAction.INIT) {
      this.gameInstance.timer.startTimer();
    }
  }

  private updatePlayerStates(playerStatus: PlayerStatus, opponentInfo: OpponentPlayerStatus) {
    if (opponentInfo) {
      this.gameInstance.opponent.setCards(opponentInfo.handCards);
      this.gameInstance.opponent.setFloorCards(opponentInfo.floorCards);
      this.gameInstance.opponent.setHiddenCards(opponentInfo.hiddenCards);
      this.gameInstance.opponent.setName(opponentInfo.name);
    }

    if (playerStatus) {
      this.gameInstance.hand.setCards(playerStatus.handCards);
      this.gameInstance.hand.setFloorCards(playerStatus.floorCards);
      this.gameInstance.hand.setHiddenCards(playerStatus.hiddenCards);
    }
  }

  private handleDisconnect = (e: string) => {
   
  }
} 