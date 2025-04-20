import { makeAutoObservable, when } from "mobx";
import { GameInstance } from "./gameInstance";
import {
  GameType,
  LobbyQueueAction,
  LobbyQueueRequest,
  LobbyQueueResponse,
  LobbyStatistics,
} from "@proto/lobby";
import { EventType } from "@proto/ws";
export class Menu {
  gameInstance: GameInstance;
  isWaiting: boolean = false;
  statistics: LobbyStatistics = null!;
  maxPlayers: number = 2;
  isOnTop10: boolean = false;
  isFullscreen: boolean = false;

  constructor(gameInstance: GameInstance) {
    this.gameInstance = gameInstance;
    makeAutoObservable(this);
    when(
      () => this.gameInstance.iswebSocketConnected,
      this.initializeSocketListeners
    );
  }

  private initializeSocketListeners = () => {
    const ws = this.gameInstance.socketManager.socket;
    ws.on(EventType.LOBBY_QUEUE, (data: Uint8Array) => {
      const decodedMessage = LobbyQueueResponse.decode(data);
      this.handleLobbyQueue(decodedMessage);
    });
    ws.on(EventType.LOBBY_STATISTICS, (data: Uint8Array) => {
      const decodedMessage = LobbyStatistics.decode(data);
      this.handleLobbyStatistics(decodedMessage);
    });
  };

  findMatch(gameType: GameType) {
    const msg = LobbyQueueRequest.create({
      player: {
        playerUid: this.gameInstance.player.uid,
        name: this.gameInstance.player.name,
        publicUid: this.gameInstance.player.publicUid,
      },
      leave: false,
      gameType: gameType,
    });
    const ws = this.gameInstance.socketManager.socket;
    const encodedMsg = LobbyQueueRequest.encode(msg).finish();
    ws.emit(EventType.LOBBY_QUEUE, encodedMsg);
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
    const ws = this.gameInstance.socketManager.socket;
    const encodedMsg = LobbyQueueRequest.encode(msg).finish();
    ws.emit(EventType.LOBBY_QUEUE, encodedMsg);
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
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement
          .requestFullscreen()
          .catch((err) => console.error(err));
      } else {
        await (document.documentElement as any).webkitRequestFullscreen();
      }
    } catch (err) {
      console.error("Try ios: ", err);
    }
    this.setFullscreen(true);
  }

  exitFullscreen() {
    document.exitFullscreen();
    this.setFullscreen(false);
  }
}
