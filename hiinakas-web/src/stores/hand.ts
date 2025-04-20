import { makeAutoObservable } from "mobx";
import { SmallCard, Card } from "@proto/card";

export class Hand {
  cards: Card[];
  floorCards: SmallCard[];
  hiddenCards: number;

  constructor() {
    this.cards = [];
    this.floorCards = [];
    this.hiddenCards = 0;
    makeAutoObservable(this);  
  }

  setCards(_cards: Card[]) {
    console.log("setting cards", _cards);
    if(_cards) {
      this.cards.splice(0, this.cards.length, ..._cards);
    }
  }

  setFloorCards(_cards: SmallCard[]) {
    if(_cards) {
      this.floorCards.splice(0, this.floorCards.length, ..._cards);
    }
  }

  setHiddenCards(_cards: number) {
    this.hiddenCards = _cards;
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

  clearCards() {
    this.cards = [];
    this.floorCards = [];
    this.hiddenCards = 0;
  }

  get numCards() {
    return this.cards.length;
  }
}
