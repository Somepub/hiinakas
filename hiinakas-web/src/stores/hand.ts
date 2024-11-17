import { CardJson, FloorCardJson, HiddenCardJson } from "@types";
import { action, makeAutoObservable, makeObservable, observable, set } from "mobx";

export class Hand {
  cards: CardJson[];
  floorCards: FloorCardJson[];
  hiddenCards: HiddenCardJson[];

  constructor() {
    this.cards = [];
    this.floorCards = [];
    this.hiddenCards = [];

    makeAutoObservable(this);  
  }

  setCards(_cards: CardJson[]) {
    if(_cards) {
      this.cards.splice(0, this.cards.length, ..._cards);
    }
  }

  setFloorCards(_cards: FloorCardJson[]) {
    if(_cards) {
      this.floorCards.splice(0, this.floorCards.length, ..._cards);
    }
  }

  setHiddenCards(_cards: HiddenCardJson[]) {
    if(_cards) {
      this.hiddenCards.splice(0, this.hiddenCards.length, ..._cards);
    }
  }

  getCards() {
    return this.cards;
  }

  getFloorCards() {
    return this.floorCards;
  }

  getHiddenCards() {
    return this.hiddenCards;
  }

  get numCards() {
    return this.cards.length;
  }
}
