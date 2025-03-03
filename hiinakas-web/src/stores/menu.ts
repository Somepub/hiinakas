import { makeAutoObservable, when } from "mobx";
import { GameInstance } from "./gameInstance";
import { LobbyQueueAction, LobbyQueueRequest, LobbyQueueResponse, LobbyStatistics } from "@proto/lobby";

export class Menu {
  gameInstance: GameInstance;
  isWaiting: boolean = false;
  statistics: LobbyStatistics = null!;
  maxPlayers: number = 2;
  isFullscreen: boolean = false;

  constructor(gameInstance: GameInstance) {
    this.gameInstance = gameInstance;
    makeAutoObservable(this);
    when(() => this.gameInstance.iswebSocketConnected, this.initializeSocketListeners);
  }

  private initializeSocketListeners = () => {
    const socketIO = this.gameInstance.socketManager.socket;
    socketIO.on("lobby/queue", (message: ArrayBuffer) => {
      const decodedMessage = LobbyQueueResponse.decode(new Uint8Array(message));
      this.handleLobbyQueue(decodedMessage)
    });
    socketIO.on("lobby/statistics", (message: ArrayBuffer) => {
      const decodedMessage = LobbyStatistics.decode(new Uint8Array(message));
      this.handleLobbyStatistics(decodedMessage)
    });
  }

  findMatch() {
    const msg = LobbyQueueRequest.create({
      player: {
        playerUid: this.gameInstance.player.uid,
        name: this.gameInstance.player.name,
      },
      leave: false,
      maxPlayers: this.maxPlayers,
    });
    console.log("Lobby queue", msg);
    const socketIO = this.gameInstance.socketManager.socket;
    const encodedMsg = Array.from(LobbyQueueRequest.encode(msg).finish());
    socketIO.emit("lobby/queue", encodedMsg);
    this.enterFullscreen();
    this.isWaiting = true;
  }

  leaveQueue() {
    const msg = LobbyQueueRequest.create({
      player: {
        playerUid: this.gameInstance.player.uid,
        name: this.gameInstance.player.name,
      },
      leave: true,
    });
    const socketIO = this.gameInstance.socketManager.socket;
    const encodedMsg = Array.from(LobbyQueueRequest.encode(msg).finish());
    socketIO.emit("lobby/queue", encodedMsg);
    this.isWaiting = false;
  }

  handleLobbyQueue(message: LobbyQueueResponse) {

    if (message.action === LobbyQueueAction.START) {
      this.gameInstance.setGameReady();
      this.isWaiting = false;
    }
  }

  handleLobbyStatistics(message: LobbyStatistics) {
    this.statistics = message;
  }

  exitGame() {
    document.querySelector('game-curak')?.remove();
    (window as any).curak = false;
  }

  setMaxPlayers(value: number) {
    if (value < 2) {
      value = 2;
    }
    if (value > 4) {
      value = 4;
    }
    this.maxPlayers = value;
  }

  setFullscreen(value: boolean) {
    this.isFullscreen = value;
  }

  enterFullscreen() {
    document.documentElement.requestFullscreen();
    this.setFullscreen(true);
  }

  exitFullscreen() {
    document.exitFullscreen();
    this.setFullscreen(false);
  }
}
