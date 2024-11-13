import { makeAutoObservable, reaction, when } from "mobx";
import { GameInstance } from "./gameInstance";
import { v4 } from "uuid";
import { LobbyInviteRequest, LobbyInviteResponse, LobbyJoinRequest, LobbyMaxPlayerChange, LobbyPlayer, LobbyRequest, PublicLobbyPlayer } from "@types";
import addNotification from 'react-push-notification';

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
    when(() => this.gameInstance.iswebSocketConnected, () => {
      this.gameInstance.socketIO.on("lobby/invite", (msg: LobbyInviteRequest) => {
        var title = "Hiinakas game invite";
        var body = `Game invite from: ${msg.senderPlayerUid}`;
        var notification = new Notification(title, { body });
        //navigator.serviceWorker.ready.then( reg => { reg.showNotification("your arguments goes here")})
        console.log("game invite????",msg);
        this.setGameInvite(msg);
      });

      this.gameInstance.socketIO.on("lobby/status", (msg: PublicLobbyPlayer[]) => {
        console.log("lobby status",msg, gameInstance.publicUid)
        msg.forEach( player => {
          if(this.gameInstance.publicUid === player.uid && player.owner && !this.isSelfOwner) {
            this.isSelfOwner = true;
          }

          if(this.gameInstance.publicUid === player.uid && !player.owner && this.isSelfOwner) {
            this.isSelfOwner = false;
          }
        });
        this.isLobbyReady = msg.every( player => player.ready) && msg.length > 1;
        const lobbyPlayers = msg.filter( player => player.uid !== this.gameInstance.publicUid);
        console.log(lobbyPlayers, this.gameInstance.publicUid, lobbyPlayers.length > 0 &&  lobbyPlayers[0].uid )
        this.opponents.forEach( (opponent, i) => {
            try {
              const lobbyPlayer = lobbyPlayers[i];
              if(lobbyPlayer) {
                this.updateOpponent(opponent.uid, OpponentState.JOINED, lobbyPlayer);
              }
            }
            catch {}
        });
      });
    });

    reaction( () => this.maxPlayers, () => {
        this.reset();
    });
  }

  reset() {
    this.opponents = []
    this.isSelfOwner = true;
    this.isLobbyReady = false;
    this.initOpponents();
  }

  setGameInvite(newGameInvite: LobbyInviteRequest) {
    this.gameInvite = newGameInvite;
  }

  initOpponents() {
    
    for (let index = 0; index < this.maxPlayers - 1; index++) {
      try {
        if(this.opponents[index].state === OpponentState.ADD) {
          this.addBlankOpponent();
        }
      }
      catch {
        this.addBlankOpponent();
      }
        
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
    opponent.state = state;
    if (user) {
      opponent.user = user;
    }
  }

  acceptGameInvite() {
    const resp: LobbyInviteResponse = {
      uid: this.gameInvite.uid,
      senderPlayerUid: this.gameInvite.senderPlayerUid,
      requestToPlayerUid: this.gameInstance.publicUid,
      result: true
    }; 
    this.gameInstance.socketIO.emit("lobby/invite", resp);
    if(this.gameInstance.currentLobby !== this.gameInvite.uid) {
      this.gameInstance.socketIO.emit("lobby/leave", {
        uid: this.gameInstance.currentLobby,
        player: { uid: this.gameInstance.userUid, name: this.gameInstance.myName },
        action: 0,
      });
    }
    this.gameInstance.socketIO.emit("lobby/connect", {
      uid: this.gameInvite.uid,
      player: { uid: this.gameInstance.userUid, name: this.gameInstance.myName },
      action: 0,
    });
    this.gameInvite = null;
  }

  declineGameInvite() {
    const resp: LobbyInviteResponse = {
      uid: this.gameInvite.uid,
      senderPlayerUid: this.gameInvite.senderPlayerUid,
      requestToPlayerUid: this.gameInstance.publicUid,
      result: false
    }; 
    this.gameInstance.socketIO.emit("lobby/invite", resp);
    this.gameInvite = null;
  }

  requestUsers(requestToPlayerUid: string, slotUid: string) {
    const msg: LobbyJoinRequest = {
      uid: this.gameInstance.currentLobby,
      callerPlayerUid: this.gameInstance.publicUid,
      requestToPlayerUid
    };
    console.log("req", msg);
    this.gameInstance.socketIO.emit("lobby/request", msg);
    this.updateOpponent(slotUid, OpponentState.PENDING);
  }

  ready() {
    const msg: LobbyRequest = {
      uid: this.gameInstance.currentLobby,
      player: {
        uid: this.gameInstance.userUid,
        name: this.gameInstance.myName,
        ready: true
      }
    };
    this.gameInstance.socketIO.emit("lobby/ready", msg);
  }

  findMatch() {
    const msg: LobbyRequest = {
      uid: this.gameInstance.currentLobby,
      player: {
        uid: this.gameInstance.userUid,
        name: this.gameInstance.myName,
        ready: true
      }
    };
    this.gameInstance.socketIO.emit("lobby/start", msg);
  }

  changeMaxPlayers(increase: boolean) {
    if(MAX_PLAYERS_LIMIT >= this.maxPlayers + 1) {
      const newPlayers = increase ? this.maxPlayers + 1 : this.maxPlayers - 1;
      const msg: LobbyMaxPlayerChange = {
        uid: this.gameInstance.currentLobby,
        player: {
          uid: this.gameInstance.userUid,
          name: this.gameInstance.myName,
        },
        maxPlayers: newPlayers
      };
      this.setMaxPlayers(newPlayers);
      
      this.gameInstance.socketIO.emit("lobby/maxPlayers", msg);
    }
  }

}
