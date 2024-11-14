import { CardT } from "@components/card/card";
import { action, makeAutoObservable, makeObservable, observable } from "mobx";
import { CardJson } from "@types";

export class Table {
  pool: CardJson[] = [];
  constructor() {
    makeAutoObservable(this);
  }

  getCards() {
    return this.pool;
  }

  setCards(_cards: CardJson[]) {
    if(_cards) {
      this.pool.splice(0, this.pool.length, ..._cards);
    }
  }
}
