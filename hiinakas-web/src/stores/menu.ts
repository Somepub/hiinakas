import { makeAutoObservable, reaction, when } from "mobx";
import { GameInstance } from "./gameInstance";
import { v4 } from "uuid";
import { LobbyInviteRequest, LobbyInviteResponse, LobbyJoinRequest, LobbyMaxPlayerChange, LobbyRequest, PublicLobbyPlayer } from "@types";

const SOCKET_EVENTS = {
  LOBBY_INVITE: 'lobby/invite',
  LOBBY_STATUS: 'lobby/status',
  LOBBY_CONNECT: 'lobby/connect',
  LOBBY_LEAVE: 'lobby/leave',
  LOBBY_REQUEST: 'lobby/request',
  LOBBY_READY: 'lobby/ready',
  LOBBY_START: 'lobby/start',
  LOBBY_MAX_PLAYERS: 'lobby/maxPlayers',
} as const;

export enum OpponentState {
  ADD,
  SEARCH,
  JOINED,
  PENDING,
}

const MAX_PLAYERS_LIMIT = 5;
const MIN_PLAYERS_LIMIT = 2;

export type Opponent = {
  uid: string;
  state: OpponentState;
  user: PublicLobbyPlayer;
};

export class Menu {
  maxPlayers: number = 2;
  opponents: Opponent[] = [];
  gameInstance: GameInstance;
  gameInvite: LobbyInviteRequest = null;
  isSelfOwner: boolean = false;
  isLobbyReady: boolean = false;

  constructor(gameInstance: GameInstance) {
    this.gameInstance = gameInstance;
    makeAutoObservable(this);
    this.initOpponents();
    when(() => this.gameInstance.iswebSocketConnected, this.initializeSocketListeners);
    reaction(() => this.maxPlayers, this.reset);
  }

  private initializeSocketListeners = () => {
    const socketIO = this.gameInstance.socketManager.socket;
    socketIO.on(SOCKET_EVENTS.LOBBY_INVITE, this.handleLobbyInvite);
    socketIO.on(SOCKET_EVENTS.LOBBY_STATUS, this.handleLobbyStatus);
  }

  private handleLobbyInvite = (msg: LobbyInviteRequest) => {
    try {
      const title = "Hiinakas game invite";
      const body = `Game invite from: ${msg.senderPlayerUid}`;
      new Notification(title, { body });
      this.setGameInvite(msg);
    } catch (error) {
      console.error('Error handling lobby invite:', error);
    }
  }

  private handleLobbyStatus = (players: PublicLobbyPlayer[]) => {
    try {
      this.updateOwnerStatus(players);
      this.updateLobbyReadyStatus(players);
      this.updateOpponentsStatus(players);
    } catch (error) {
      console.error('Error handling lobby status:', error);
    }
  }

  private updateOwnerStatus(players: PublicLobbyPlayer[]) {
    const selfPlayer = players.find(player => player.uid === this.gameInstance.player.publicUid);
    if (selfPlayer) {
      this.isSelfOwner = selfPlayer.owner;
    }
  }

  private updateLobbyReadyStatus(players: PublicLobbyPlayer[]) {
    this.isLobbyReady = players.every(player => player.ready) && players.length > 1;
  }

  private updateOpponentsStatus(players: PublicLobbyPlayer[]) {
    const lobbyPlayers = players.filter(player => player.uid !== this.gameInstance.player.publicUid);
    
    this.opponents.forEach((opponent, i) => {
      const lobbyPlayer = lobbyPlayers[i];
      if (lobbyPlayer) {
        this.updateOpponent(opponent.uid, OpponentState.JOINED, lobbyPlayer);
      }
    });
  }

  reset = () => {
    this.opponents = [];
    this.isSelfOwner = true;
    this.isLobbyReady = false;
    this.initOpponents();
  }

  setGameInvite(newGameInvite: LobbyInviteRequest) {
    this.gameInvite = newGameInvite;
  }

  initOpponents() {
    for (let index = 0; index < this.maxPlayers - 1; index++) {
     this.addBlankOpponent();
    }
  }

  setMaxPlayers(newMaxPlayers: number) {
    this.maxPlayers = newMaxPlayers;
  }

  getOpponents() {
    return this.opponents;
  }

  addBlankOpponent() {
    this.opponents.push({
      uid: v4(),
      state: OpponentState.ADD,
      user: null,
    });
  }

  updateOpponent(uid: string, state: OpponentState, user?: PublicLobbyPlayer) {
    const opponent = this.opponents.find((op) => op.uid === uid);
    if (opponent) {
      opponent.state = state;
      if (user) {
        opponent.user = user;
      }
    }
  }

  acceptGameInvite() {
    const resp: LobbyInviteResponse = {
      uid: this.gameInvite.uid,
      senderPlayerUid: this.gameInvite.senderPlayerUid,
      requestToPlayerUid: this.gameInstance.player.publicUid,
      result: true
    };

    const { socketManager, currentLobby, player } = this.gameInstance;
    const socketIO = socketManager.socket;

    socketIO.emit(SOCKET_EVENTS.LOBBY_INVITE, resp);
    
    if (currentLobby !== this.gameInvite.uid) {
      socketIO.emit(SOCKET_EVENTS.LOBBY_LEAVE, {
        uid: currentLobby,
        player: { uid: player.userUid, name: player.name },
        action: 0,
      });
    }

    socketIO.emit(SOCKET_EVENTS.LOBBY_CONNECT, {
      uid: this.gameInvite.uid,
      player: { uid: player.userUid, name: player.name },
      action: 0,
    });

    this.gameInvite = null;
  }

  declineGameInvite() {
    const resp: LobbyInviteResponse = {
      uid: this.gameInvite.uid,
      senderPlayerUid: this.gameInvite.senderPlayerUid,
      requestToPlayerUid: this.gameInstance.player.publicUid,
      result: false
    };
    const socketIO = this.gameInstance.socketManager.socket;
    socketIO.emit(SOCKET_EVENTS.LOBBY_INVITE, resp);
    this.gameInvite = null;
  }

  requestUsers(requestToPlayerUid: string, slotUid: string) {
    const msg: LobbyJoinRequest = {
      uid: this.gameInstance.currentLobby,
      callerPlayerUid: this.gameInstance.player.publicUid,
      requestToPlayerUid
    };
    const socketIO = this.gameInstance.socketManager.socket;
    socketIO.emit(SOCKET_EVENTS.LOBBY_REQUEST, msg);
    this.updateOpponent(slotUid, OpponentState.PENDING);
  }

  ready() {
    const msg: LobbyRequest = {
      uid: this.gameInstance.currentLobby,
      player: {
        uid: this.gameInstance.player.userUid,
        name: this.gameInstance.player.name,
        ready: true
      }
    };
    const socketIO = this.gameInstance.socketManager.socket;
    socketIO.emit(SOCKET_EVENTS.LOBBY_READY, msg);
  }

  findMatch() {
    const msg: LobbyRequest = {
      uid: this.gameInstance.currentLobby,
      player: {
        uid: this.gameInstance.player.userUid,
        name: this.gameInstance.player.name,
        ready: true
      }
    };
    const socketIO = this.gameInstance.socketManager.socket;
    socketIO.emit(SOCKET_EVENTS.LOBBY_START, msg);
  }

  changeMaxPlayers(increase: boolean) {
    if (this.canChangeMaxPlayers(increase)) {
      const newPlayers = increase ? this.maxPlayers + 1 : this.maxPlayers - 1;
      const msg: LobbyMaxPlayerChange = {
        uid: this.gameInstance.currentLobby,
        player: {
          uid: this.gameInstance.player.userUid,
          name: this.gameInstance.player.name,
        },
        maxPlayers: newPlayers
      };
      
      this.setMaxPlayers(newPlayers);
      const socketIO = this.gameInstance.socketManager.socket;
      socketIO.emit(SOCKET_EVENTS.LOBBY_MAX_PLAYERS, msg);
    }
  }

  private canChangeMaxPlayers(increase: boolean): boolean {
    return increase ? 
           this.maxPlayers < MAX_PLAYERS_LIMIT : 
           this.maxPlayers > MIN_PLAYERS_LIMIT;
  }
}
