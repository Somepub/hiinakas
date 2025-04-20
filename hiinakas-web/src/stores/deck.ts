import { makeAutoObservable } from "mobx";

export class Deck {
  pool: number = 0;
  constructor() {
    makeAutoObservable(this);
  }

  getCards() {
    return this.pool;
  }

  setCards(_cards: number) {
    this.pool = _cards;
  }

  clearDeck() {
    this.pool = 0;
  }
}
