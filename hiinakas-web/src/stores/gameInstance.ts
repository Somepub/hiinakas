import { makeAutoObservable, reaction, when } from "mobx";
import { Hand } from "./hand";
import { Table } from "./table";
import { Socket, io } from "socket.io-client";
import { v4 } from "uuid";
import { LocalStore } from "./localStore";
import {
  GameInstanceAction,
  GameInstanceMessageAction,
  LobbyGameRequest,
  LobbyGameResponse,
  OpponentPlayerStatus,
  PublicLobbyPlayer
} from "@types";
import { Turn } from "./turn";
import { Deck } from "./deck";
import { Opponent } from "./opponent";
import { Menu } from "./menu";

export type ZoneBounds = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
};

type PushSub = {
  endpoint: string;
  keys: {
    p256dn: string;
    auth: string;
  };
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')
  ;
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const vapidPublicKey =
  "BIKn_TwIU9IWFEHCLERc91obtWZNM5lZxkzlf6ICHsm4lcM4oceA7VmlINuYay8wJepC6NluqnlbcVnWGf4OoIs";

export class GameInstance {
  gameReady: boolean = false;
  dropZoneBounds: ZoneBounds = null;
  opponentZoneBounds: ZoneBounds = null;
  deckZoneBounds: ZoneBounds = null;
  tableZoneBounds: ZoneBounds = null;
  opponent: Opponent;
  hand: Hand;
  table: Table;
  deck: Deck;
  socketIO: Socket;
  localStore: LocalStore;
  turn: Turn;
  currentLobby: string;
  publicUid: string;
  myName: string;
  userUid: string;
  stopAuth: () => void;
  reDirectLogin: () => void;
  users: PublicLobbyPlayer[];
  iswebSocketConnected: boolean;
  isNotificationsEnabled: boolean;
  menu: Menu;
  subscription: PushSubscription;

  constructor(localStore: LocalStore) {
    this.users = [];
    this.hand = new Hand();
    this.table = new Table();
    this.deck = new Deck();
    this.menu = null;
    this.localStore = localStore;
    this.opponent = new Opponent();
    this.currentLobby = "";
    this.publicUid = this.localStore.getPublicUid();
    this.myName = this.localStore.getGameName();
    this.userUid = null;
    this.iswebSocketConnected = false;
    this.turn = new Turn(this);
    this.isNotificationsEnabled = false;
    this.subscription = null;
    makeAutoObservable(this);
    try {
      when( () => this.myName != "", () => {
        when( () => this.userUid != null, () => {
          this.listenGame();
          this.iswebSocketConnected = true;
        });
      });
    } catch {}
  }

  setIsNotificationsEnabled(newIsNotificationsEnabled: boolean) {
    this.isNotificationsEnabled = newIsNotificationsEnabled;
  }

  setMenu(menu: Menu) {
    this.menu = menu;
  }

  setName(newName: string) {
    this.myName = newName;
  }

  private async registerServiceWorker() {
    return new Promise<void>((res) => {
      Notification.requestPermission().then(async (result) => {
        if (result === "granted") {
          await navigator.serviceWorker.register("./serviceWorker.js");
          console.log("service")
          const register = await navigator.serviceWorker.ready;
          const subscription = await register.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
          this.setSubscription(subscription);
          this.setIsNotificationsEnabled(true);
          console.log("done");
          res();
        }
      });
    });
  }

  setSubscription(newSub: PushSubscription) {
    this.subscription = newSub;
  }

  private setUsers(newUsers: PublicLobbyPlayer[]) {
    this.users = newUsers.filter(
      (user: PublicLobbyPlayer) => user.uid !== this.publicUid
    );
  }

  private listenGame() {
    console.log("hmm", {
      userUid: this.userUid,
      name: this.myName,
      publicUid: this.publicUid,
      sub: JSON.stringify(this.subscription),
    });
    const decoder = new TextDecoder();
    this.socketIO = io("ws://localhost:3000" /*"wss://godhaze.com:3000"*/, {
      secure: true,
      rejectUnauthorized: true,
      query: {
        userUid: this.userUid,
        name: this.myName,
        publicUid: this.publicUid,
        sub: JSON.stringify(this.subscription),
      },
      path: "/v1/hiinakas/",
    });

    this.socketIO.on("connect", () => {
      const rootRoom = {
        uid: v4(),
        player: { uid: this.userUid, name: this.myName },
        action: 0,
      };

      setInterval(() => {
        this.socketIO.emit("users/request", {
          uid: v4(),
          player: { uid: this.userUid, name: this.myName },
          action: 0,
        });
      }, 2500);

      setTimeout(() => {
        const e = this.socketIO.emit("lobby/connect", rootRoom);
        console.log("CONNECT?", rootRoom);
      }, 100);

      this.socketIO.on("users/response", (newUsers: PublicLobbyPlayer[]) => {
        this.setUsers(newUsers);
      });

      this.socketIO.on("lobby/connect", (msg: string) => {
        console.log("connecTLOBBY??", msg);
        this.currentLobby = msg;
      });

      this.socketIO.on("game/turn", (message: LobbyGameResponse) => {
        console.log("on game?");
        const gameTurn = message?.gameTurn!;
        const playerStatus = gameTurn?.gameTurnStatus?.playerStatus!;
        const tableCards = gameTurn?.gameTurnTable;
        const playerTurn = gameTurn?.gameTurnPlayer;
        // TODO:: Fix logic when more than 2 players are present.
        const opponentInfo: OpponentPlayerStatus =
          gameTurn?.gameTurnStatus?.otherPlayers[0]!;

        this.table.setCards(tableCards!);
        this.deck.setCards(gameTurn?.gameTurnDeck);
        this.turn.setCurrentTurnHash(playerTurn?.uidHash);
        this.turn.setCurrentTurnName(playerTurn?.name);
        this.turn.setTurnMessage(playerTurn?.message);
        this.turn.setGameInstanceAction(playerTurn?.action);
        this.turn.setWinner(
          gameTurn.gameTurnWinner
            ? gameTurn.gameTurnWinner.winnerUidHash
            : null,
          this
        );
        this.opponent.setCards(opponentInfo?.handCards);
        this.opponent.setFloorCards(opponentInfo.floorCards);
        this.opponent.setHiddenCards(opponentInfo?.hiddenCards);
        this.opponent.setName(opponentInfo?.name);
        this.hand.setCards(playerStatus?.handCards);
        this.hand.setFloorCards(playerStatus?.floorCards);
        this.hand.setHiddenCards(playerStatus?.hiddenCards);
        if (!this.gameReady) {
          this.setGameReady();
        }
      });

      this.socketIO.on("disconnect", (e) => {
        if (e === "io server disconnect") {
          this.stopAuth();
        }
      });
    });
  }

  setGameReady() {
    this.gameReady = true;
  }

  playCard(cardId: string): Promise<boolean> {
    return new Promise((res) => {
      const msg: LobbyGameRequest = {
        uid: this.currentLobby,
        player: {
          uid: this.userUid,
          name: this.myName,
        },
        action: GameInstanceAction.PLAY_CARD,
        cardId,
      };

      this.socketIO.once("game/turn", (message: LobbyGameResponse) => {
        res(
          message.gameTurn.gameTurnPlayer.message.type ===
            GameInstanceMessageAction.INFO
        );
      });
      this.socketIO.emit("game/turn", msg);
    });
  }

  endTurn() {
    const msg: LobbyGameRequest = {
      uid: this.currentLobby,
      player: {
        uid: this.userUid,
        name: this.myName,
      },
      action: GameInstanceAction.END_TURN,
    };
    this.socketIO.emit("game/turn", msg);
  }

  pickUp() {
    const msg: LobbyGameRequest = {
      uid: this.currentLobby,
      player: {
        uid: this.userUid,
        name: this.myName,
      },
      action: GameInstanceAction.PICK_UP,
    };
    this.socketIO.emit("game/turn", msg);
  }

  setDropZoneBound(state: ZoneBounds) {
    this.dropZoneBounds = state;
  }

  setOpponentZoneBounds(state: ZoneBounds) {
    this.opponentZoneBounds = state;
  }

  setDeckZoneBounds(state: ZoneBounds) {
    this.deckZoneBounds = state;
  }

  setTableZoneBounds(state: ZoneBounds) {
    this.tableZoneBounds = state;
  }

  setUserUid(userUid: string, stopAuth: any, reDirectLogin: any) {
    const newUserUid = userUid.split("|")[1];
    this.userUid = newUserUid;
    this.publicUid = this.localStore.getPublicUid();
  }
}
