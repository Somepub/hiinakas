import { RANK, SUIT, CARD_EFFECT } from "#types";
import { v4 } from "uuid";

export class Card {
    private uid: string;
    private rank: RANK;
    private suit: SUIT;
    private effect: CARD_EFFECT;
  
    constructor(rank: RANK, suit: SUIT, uid?: string) {
      this.uid = uid ? uid : v4();
      this.rank = rank;
      this.suit = suit;
      this.effect = this.setEffect();
    }
  
    getUid() {
      return this.uid;
    }
  
    getRank() {
      return this.rank.valueOf();
    }
  
    getSuit() {
      return this.suit.valueOf();
    }
  
    getEffect() {
      return this.effect;
    }
  
    private setEffect() {
      switch (this.rank) {
        case RANK.TWO:
          return CARD_EFFECT.ACE_KILLER;
        case RANK.SEVEN:
          return CARD_EFFECT.CONSTRAINT;
        case RANK.EIGHTH:
          return CARD_EFFECT.TRANSPARENT;
        case RANK.TEN:
          return CARD_EFFECT.DESTROY;
        default:
          return CARD_EFFECT.NO_EFFECT;
      }
    }
  }