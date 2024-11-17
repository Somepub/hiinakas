import { makeAutoObservable, when } from "mobx";
import { GameZones } from "../util/zones";
import { PlayerState } from "./playerState";
import { NotificationManager } from "../util/notifications";
import { SocketManager } from "../util/socketManager";
import { LocalStore } from "../util/localStore";
import { Deck } from "./deck";
import { Hand } from "./hand";
import { Menu } from "./menu";
import { Opponent } from "./opponent";
import { Table } from "./table";
import { Turn } from "./turn";

export class GameInstance {
  gameReady: boolean = false;
  zones: GameZones;
  player: PlayerState;
  notifications: NotificationManager;
  socketManager: SocketManager;
  opponent: Opponent;
  hand: Hand;
  table: Table;
  deck: Deck;
  turn: Turn;
  menu: Menu = null;
  
  currentLobby: string = "";
  iswebSocketConnected: boolean = false;
  stopAuth: () => void;
  reDirectLogin: () => void;

  constructor(localStore: LocalStore) {
    this.zones = new GameZones();
    this.player = new PlayerState(localStore);
    this.notifications = new NotificationManager();
    this.socketManager = new SocketManager(this);
    this.menu = new Menu(this);
    
    this.hand = new Hand();
    this.table = new Table();
    this.deck = new Deck();
    this.opponent = new Opponent();
    this.turn = new Turn(this);
    
    makeAutoObservable(this);
    this.setupWatchers();
  }

  private setupWatchers() {
    when(() => this.player.name !== "", () => {
      when(() => this.player.userUid !== null, () => {
        this.socketManager.initialize();
        this.iswebSocketConnected = true;
      });
    });
  }

  playCard(cardId: string): Promise<boolean> {
    return this.socketManager.playCard(cardId);
  }

  endTurn() {
    this.socketManager.endTurn();
  }

  pickUp() {
    this.socketManager.pickUp();
  }

  setGameReady() {
    this.gameReady = true;
  }

  setMenu(menu: Menu) {
    this.menu = menu;
  }
}
