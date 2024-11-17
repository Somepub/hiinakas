import { Socket, io } from "socket.io-client";
import { v4 } from "uuid";
import { GameInstanceAction, GameInstanceMessageAction, GameTurn, LobbyGameRequest, LobbyGameResponse, OpponentPlayerStatus, PublicLobbyPlayer } from "@types";
import { GameInstance } from "../stores/gameInstance";

const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  USERS_REQUEST: 'users/request',
  USERS_RESPONSE: 'users/response',
  LOBBY_CONNECT: 'lobby/connect',
  GAME_TURN: 'game/turn'
} as const;

const WEBSOCKET_CONFIG = {
  DEV_URL: 'ws://localhost:3000',
  PROD_URL: 'wss://godhaze.com:3000',
  PATH: '/v1/hiinakas/',
  POLLING_INTERVAL: 2500,
  CONNECT_DELAY: 100
} as const;

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
    this.socket = io(WEBSOCKET_CONFIG.DEV_URL, {
      secure: true,
      rejectUnauthorized: true,
      query: {
        userUid: this.gameInstance.player.userUid,
        name: this.gameInstance.player.name,
        publicUid: this.gameInstance.player.publicUid,
        sub: JSON.stringify(this.gameInstance.notifications.subscription),
      },
      path: WEBSOCKET_CONFIG.PATH,
    });
  }

  private setupSocketListeners() {
    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      this.setupUserPolling();
      this.setupInitialLobbyConnection();
      this.setupGameEventListeners();
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, this.handleDisconnect);
  }

  private setupUserPolling() {
    setInterval(() => {
      this.socket.emit(SOCKET_EVENTS.USERS_REQUEST, null);
    }, WEBSOCKET_CONFIG.POLLING_INTERVAL);
  }

  setupInitialLobbyConnection() {
    setTimeout(() => {
      this.socket.emit(SOCKET_EVENTS.LOBBY_CONNECT, this.createBaseRequest(true));
    }, WEBSOCKET_CONFIG.CONNECT_DELAY);
  }

  private setupGameEventListeners() {
    this.socket.on(SOCKET_EVENTS.USERS_RESPONSE, this.handleUsersResponse);
    this.socket.on(SOCKET_EVENTS.LOBBY_CONNECT, this.handleLobbyConnect);
    this.socket.on(SOCKET_EVENTS.GAME_TURN, this.handleGameTurn);
  }

  playCard(cardId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const msg = this.createGameRequest(GameInstanceAction.PLAY_CARD, cardId);
      this.socket.once(SOCKET_EVENTS.GAME_TURN, (message: LobbyGameResponse) => {
        resolve(message.gameTurn.gameTurnPlayer.message.type === GameInstanceMessageAction.INFO);
      });
      this.socket.emit(SOCKET_EVENTS.GAME_TURN, msg);
    });
  }

  endTurn() {
    const msg = this.createGameRequest(GameInstanceAction.END_TURN);
    this.socket.emit(SOCKET_EVENTS.GAME_TURN, msg);
  }

  pickUp() {
    const msg = this.createGameRequest(GameInstanceAction.PICK_UP);
    this.socket.emit(SOCKET_EVENTS.GAME_TURN, msg);
  }

  private createBaseRequest(isNewLobby: boolean = false) {
    return {
      uid: isNewLobby ? v4() : this.gameInstance.currentLobby,
      player: {
        uid: this.gameInstance.player.userUid,
        name: this.gameInstance.player.name,
      },
      action: 0,
    };
  }

  private createGameRequest(action: GameInstanceAction, cardId?: string): LobbyGameRequest {
    return {
      ...this.createBaseRequest(),
      action,
      cardId,
    };
  }

  private handleUsersResponse = (newUsers: PublicLobbyPlayer[]) => {
    this.gameInstance.player.setUsers(newUsers);
  }

  private handleLobbyConnect = (msg: string) => {
    this.gameInstance.currentLobby = msg;
  }

  private handleGameTurn = (message: LobbyGameResponse) => {
    if (!message?.gameTurn) return;
    
    const gameTurn = message.gameTurn;
    this.updateGameState(gameTurn);
    
    if (!this.gameInstance.gameReady) {
      this.gameInstance.setGameReady();
    }
  }

  private updateGameState(gameTurn: GameTurn) {
    const playerStatus = gameTurn.gameTurnStatus?.playerStatus;
    const opponentInfo = gameTurn.gameTurnStatus?.otherPlayers[0];

    this.updateTableAndDeck(gameTurn);
    this.updateTurnInfo(gameTurn);
    this.updatePlayerStates(playerStatus, opponentInfo);
  }

  private updateTableAndDeck(gameTurn: GameTurn) {
    this.gameInstance.table.setCards(gameTurn.gameTurnTable);
    this.gameInstance.deck.setCards(gameTurn.gameTurnDeck);
  }

  private updateTurnInfo(gameTurn: GameTurn) {
    const playerTurn = gameTurn.gameTurnPlayer;
    this.gameInstance.turn.setCurrentTurnHash(playerTurn?.uidHash);
    this.gameInstance.turn.setCurrentTurnName(playerTurn?.name);
    this.gameInstance.turn.setTurnMessage(playerTurn?.message);
    this.gameInstance.turn.setGameInstanceAction(playerTurn?.action);
    this.gameInstance.turn.setWinner(
      gameTurn.gameTurnWinner?.winnerUidHash ?? null,
      this.gameInstance
    );
  }

  private updatePlayerStates(playerStatus: any, opponentInfo: OpponentPlayerStatus) {
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
    if (e === "io server disconnect") {
      this.gameInstance.stopAuth();
    }
  }
} 