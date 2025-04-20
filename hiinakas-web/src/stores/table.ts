import { makeAutoObservable } from "mobx";
import { SmallCard } from "@proto/card";

export class Table {
  pool: SmallCard[] = [];
  constructor() {
    makeAutoObservable(this);
  }

  getCards() {
    return this.pool;
  }

  setCards(_cards: SmallCard[]) {
    if(_cards) {
      this.pool.splice(0, this.pool.length, ..._cards);
    }
  }

  clearTable() {
    this.pool = [];
  }
}
