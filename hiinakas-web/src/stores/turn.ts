import { action, makeAutoObservable, reaction } from "mobx";
import { GameInstanceAction, GameInstanceMessage, GameInstanceMessageAction, GameTurnPlayer } from "@proto/game";
import dropCard from "../assets/sounds/cardput.mp3";
import drawCard from "../assets/sounds/carddraw.mp3";
import suffleCards from "../assets/sounds/cardshuffle.mp3";
import pickUpCards from "../assets/sounds/pickup.mp3";
import { GameInstance } from "./gameInstance";
import { toast } from "react-toastify";

export class Turn {
  currentTurnName: string = "";
  action: GameInstanceAction = null;
  gameInstance: GameInstance;
  turnMessage : GameInstanceMessage;
  isWinner: boolean = false;
  winnerTimeout: NodeJS.Timeout | null = null;
  isMyTurn: boolean = false;

  constructor(gameInstance: GameInstance) {
    this.gameInstance = gameInstance;
    makeAutoObservable(this);

    reaction(() => this.isMyTurn, (turn) => {
      toast.dismiss();
      const turnMessage = turn ? "Your Turn" : this.currentTurnName;
      toast(turnMessage, {
        type: "info",
        theme: "dark",
      });
    });
  }

  setGameInstanceAction(state: GameInstanceAction) {
    this.action = state;
    this.playSound();
  }

  setIsMyTurn(isMyTurn: boolean) {
    this.isMyTurn = isMyTurn;
  }

  setCurrentTurnName(newName: string) {
    this.currentTurnName = newName;
  }

  setTurnMessage(message: GameInstanceMessage) {
    this.turnMessage = message;
    if(message.type === GameInstanceMessageAction.ERROR) {
      toast(message.message, {
        type: "error",
        theme: "dark",
      });
    }
  }

  setWinner(winner: boolean, gameInstance: GameInstance) {
    if(this.action === GameInstanceAction.WIN) {
      this.isWinner = winner;
    }
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
