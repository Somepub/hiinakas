import { CardT } from "@components/card/card";
import { action, makeAutoObservable, makeObservable, observable } from "mobx";
import { CardJson, HiddenCardJson } from "@common/card";

export class Deck {
  pool: HiddenCardJson[] = [];
  constructor() {
    makeAutoObservable(this);
  }

  getCards() {
    return this.pool;
  }

  setCards(_cards: HiddenCardJson[]) {
    if(_cards) {
      this.pool.splice(0, this.pool.length, ..._cards);
    }
  }
}
