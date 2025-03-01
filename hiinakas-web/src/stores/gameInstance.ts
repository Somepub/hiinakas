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
import { Timer } from "./timer";

export class GameInstance {
  gameReady: boolean = false;
  zones: GameZones;
  player: PlayerState;
  notifications: NotificationManager;
  socketManager: SocketManager;
  opponents: Opponent[];
  hand: Hand;
  table: Table;
  deck: Deck;
  turn: Turn;
  menu: Menu = null;
  
  currentLobby: string = "";
  iswebSocketConnected: boolean = false;
  timer: Timer;

  constructor(localStore: LocalStore, timer: Timer) {
    this.zones = new GameZones();
    this.player = new PlayerState(localStore);
    this.notifications = new NotificationManager();
    this.socketManager = new SocketManager(this);
    this.menu = new Menu(this);
    this.timer = timer;
    this.hand = new Hand();
    this.table = new Table();
    this.deck = new Deck();
    this.opponents = [];
    this.turn = new Turn(this);
    
    makeAutoObservable(this);
    this.setupWatchers();
  }

  private setupWatchers() {
    when(() => this.player.name !== null, () => {
      when(() => this.player.uid !== null, () => {
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

  setGameReady(set: boolean = true) {
    this.gameReady = set;
  }

  setMenu(menu: Menu) {
    this.menu = menu;
  }

  setOpponent(opponent: Opponent) {
    this.opponents = [...this.opponents, opponent];
  }
}
