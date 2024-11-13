import { FloorCardJson, HiddenCardJson } from "../types/card";
import { makeAutoObservable } from "mobx";

export class Opponent {
  cards: HiddenCardJson[];
  floorCards: FloorCardJson[];
  hiddenCards: HiddenCardJson[];
  name: string;

  constructor() {
    this.cards = [];
    this.floorCards = [];
    this.hiddenCards = [];
    this.name = "";

    makeAutoObservable(this);
  }

  setCards(_cards: HiddenCardJson[]) {
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

  get numCards() {
    return this.cards.length;
  }
}
