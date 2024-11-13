import { CardJson, FloorCardJson, HiddenCardJson } from "../types/card";
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

    const mockCards: CardJson[] = [
      {uid: "asd11", rank: 1, suit: 1, effect: 0},
      {uid: "asd112", rank: 2, suit: 0, effect: 1},
      {uid: "asd113", rank: 0, suit: 2, effect: 0},
      {uid: "asd11", rank: 1, suit: 1, effect: 0},

    ];
   // this.cards.splice(0, mockCards.length, ...mockCards);
  }

  setFloorCards(_cards: FloorCardJson[]) {
    console.log("FLOOR?", _cards)
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
