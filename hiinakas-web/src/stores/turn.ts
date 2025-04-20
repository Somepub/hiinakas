import { action, makeAutoObservable, reaction } from "mobx";
import { GameInstanceAction, GameInstanceMessage, GameInstanceMessageAction, GameTurnPlayer } from "@proto/game";
import dropCard from "../assets/sounds/cardput.mp3";
import drawCard from "../assets/sounds/carddraw.mp3";
import suffleCards from "../assets/sounds/cardshuffle.mp3";
import pickUpCards from "../assets/sounds/pickup.mp3";
import destroyCard from "../assets/sounds/destroy_card.mp3";
import { GameInstance } from "./gameInstance";
import { toast } from "react-toastify";
import { Effect } from "@proto/card";
import { convertSmallCardToCard } from "@components/card/floorCards";

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
      this.gameInstance.timer.stopTimer();
      this.gameInstance.deck.clearDeck();
      this.gameInstance.hand.clearCards();
      this.gameInstance.table.clearTable();
      this.gameInstance.opponents.forEach( (opponent) => {
        opponent.clearCards();
      });
      this.gameInstance.opponents = [];
    }
  }

  playSound() {
    const getRankDisplay = (rank: number): string => {
      const rankValue = rank + 2;

      switch (rankValue) {
        case 11:
          return "J";
        case 12:
          return "Q";
        case 13:
          return "K";
        case 14:
          return "A";
        default:
          return rankValue.toString();
      }
    };

    const getEffectDisplay = (effect: Effect): string => {
      switch (effect) {
        case Effect.DESTROY:
          return "DESTROY";
        case Effect.CONSTRAINT:
          return "CONSTRAINT";
        case Effect.ACE_KILLER:
          return "ACE KILLER";
        case Effect.TRANSPARENT:
          return "TRANSPARENT";
        case Effect.NO_EFFECT:
        default:
          return "";
      }
    };

    const stringToEffect = (effectString: string): Effect => {
      switch (effectString.toUpperCase()) {
          case 'DESTROY':
              return Effect.DESTROY;
          case 'CONSTRAINT':
              return Effect.CONSTRAINT;
          case 'ACE_KILLER':
              return Effect.ACE_KILLER;
          case 'TRANSPARENT':
              return Effect.TRANSPARENT;
          default:
              return Effect.NO_EFFECT;
      }
  };

    if(this.turnMessage.type !== GameInstanceMessageAction.ERROR) {
      switch (this.action) {
        case GameInstanceAction.INIT:
          new Audio(suffleCards).play();
          break;
        case GameInstanceAction.END_TURN:
          new Audio(drawCard).play();
          break;
        case GameInstanceAction.PICK_UP:
          const isMyTurn = this.gameInstance.turn.isMyTurn;
          const turnPlayerName = this.turnMessage.message.split(":")[1];
          if(!isMyTurn) {
            this.gameInstance.floatingTextStore.showText(`${turnPlayerName} picked up`);
          }

          new Audio(pickUpCards).play();
          break;
        case GameInstanceAction.PLAY_CARD:
          const cardEffect = stringToEffect(this.turnMessage.message.split(":")[1]);
          const smallCard = convertSmallCardToCard({ value: Number(this.turnMessage.message.split(":")[2]) });

          this.gameInstance.floatingTextStore.showText(
            cardEffect !== Effect.NO_EFFECT && cardEffect !== Effect.ACE_KILLER
              ? getEffectDisplay(cardEffect)
              : getRankDisplay(Number(smallCard.rank))
          );
          if(cardEffect === Effect.DESTROY) {
            new Audio(destroyCard).play();
          } else {
            new Audio(dropCard).play();
          }
          break;
      }
    }
  }
}
