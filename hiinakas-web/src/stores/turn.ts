import { action, makeAutoObservable, reaction } from "mobx";
import { Md5 } from "ts-md5";
import { GameInstanceAction, GameInstanceMessage, GameInstanceMessageAction } from "@types";
import dropCard from "../assets/sounds/cardput.wav";
import drawCard from "../assets/sounds/carddraw.wav";
import suffleCards from "../assets/sounds/cardshuffle.wav";
import pickUpCards from "../assets/sounds/pickup.wav";
import { GameInstance } from "./gameInstance";

export class Turn {
  currentTurnHash: string = "";
  currentTurnName: string = "";
  action: GameInstanceAction = null;
  gameInstance: GameInstance;
  turnMessage : GameInstanceMessage;
  winner: string = null;
  winnerTimeout: NodeJS.Timeout | null = null;
  constructor(gameInstance: GameInstance) {
    this.gameInstance = gameInstance;
    makeAutoObservable(this);
  }

  setGameInstanceAction(state: GameInstanceAction) {
    this.action = state;
    this.playSound();
  }

  setCurrentTurnHash(newHash: string) {
    this.currentTurnHash = newHash;
  }

  setCurrentTurnName(newName: string) {
    this.currentTurnName = newName;
  }

  setTurnMessage(message: GameInstanceMessage) {
    this.turnMessage = message;
  }

  setWinner(winner: string | null, gameInstance: GameInstance) {
    if(winner) {
      this.winner = winner;
      this.winnerTimeout = setTimeout( () => {
        action(() => {    
          gameInstance.menu.reset();
          gameInstance.gameReady = false;
          this.winner = null;
          gameInstance.socketManager.setupInitialLobbyConnection();
        })();
      }, 15000);
    }
  }

  isMyTurn() {
    if(this.gameInstance.player.userUid) {
      const currHash = Md5.hashStr(this.gameInstance.player.userUid);
      return currHash === this.currentTurnHash;
    }
    return false;
  }

  playSound() {
    if(this.turnMessage.type !== GameInstanceMessageAction.ERROR) {
      switch (this.action) {
        case GameInstanceAction.INIT:
          new Audio(suffleCards).play();
          break;
        case GameInstanceAction.END_TURN:
          new Audio(drawCard).play();
          break;
        case GameInstanceAction.PICK_UP:
          new Audio(pickUpCards).play();
          break;
        case GameInstanceAction.PLAY_CARD:
          new Audio(dropCard).play();
          break;
      }
    }
  }
}
