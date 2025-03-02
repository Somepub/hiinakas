import { makeAutoObservable, when } from "mobx";
import { GameInstance } from "./gameInstance";
import { LobbyQueueAction, LobbyQueueRequest, LobbyQueueResponse, LobbyStatistics } from "@proto/lobby";

export class Menu {
  gameInstance: GameInstance;
  isWaiting: boolean = false;
  isOnTop10: boolean = false;
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
        publicUid: this.gameInstance.player.publicUid,
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
        publicUid: this.gameInstance.player.publicUid,
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

  setIsOnTop10(value: boolean) {
    this.isOnTop10 = value;
  }

  setMaxPlayers(value: number) {
    if (value < 2) {
      value = 2;
    }
    if (value > 5) {
      value = 5;
    }
    this.maxPlayers = value;
  }

  setFullscreen(value: boolean) {
    this.isFullscreen = value;
  }

  async enterFullscreen() {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      try {
        await (document.documentElement as any).webkitRequestFullscreen();
      } catch (err) {
        console.error("Try ios: ", err);
      }
    }
    this.setFullscreen(true);
  }

  exitFullscreen() {
    document.exitFullscreen();
    this.setFullscreen(false);
  }
}
