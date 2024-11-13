import {  HiddenCardJson, RANK, SUIT } from "../types/card";
import { Card } from "./card";

export class Deck {
  private deckPool: Card[];

  constructor() {
    this.deckPool = this.generateDeck();
  }

  isDeckEmpty() {
    return this.deckPool.length === 0; 
  }

  getCards(): HiddenCardJson[] {
    return this.deckPool.map( (card) => ({uidHash: card.getUid()}));
  }

  cardsLeft(): number {
    return this.deckPool.length;
  }

  drawCard(): Card | undefined {
    const currCard = this.deckPool.pop();
    return currCard;
  }

  private generateDeck(): Card[] {
    const tempICards: Card[] = [];

    for (let rank = 0; rank <= RANK.ACE; rank++) {
      for (let suit = 0; suit <= SUIT.SPADES; suit++) {
        tempICards.push(new Card(rank, suit));
      }
    }

    for (let index = tempICards.length - 1; index > 0; index--) {
      const location2 = Math.floor(Math.random() * (index + 1));

      const tmp = tempICards[index];
      tempICards[index] = tempICards[location2];
      tempICards[location2] = tmp;
    }

    return tempICards;
  }
}
