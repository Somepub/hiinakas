import { makeAutoObservable } from "mobx";
import { SmallCard } from "@proto/card";

export class Opponent {
  cards: number;
  floorCards: SmallCard[];
  hiddenCards: number;
  name: string;

  constructor() {
    this.cards = 0;
    this.floorCards = [];
    this.hiddenCards = 0;
    this.name = "";

    makeAutoObservable(this);
  }

  setCards(_cards: number) {
    this.cards = _cards;
  }

  setFloorCards(_cards: SmallCard[]) {
    if(_cards) {
      this.floorCards.splice(0, this.floorCards.length, ..._cards);
    }
  }

  setHiddenCards(_cards: number) {
    this.hiddenCards = _cards;
  }

  setName(name: string) {
    this.name = name;
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

  getName() {
    return this.name;
  }
}
