import { CardJson } from "#types";
import { Card } from "./card";

export class Player {
  private uid: string;
  private name: string;
  private handCards: Map<string, Card>;
  private floorCards: Map<string, Card>;
  private blindCards: Map<string, Card>;

  constructor(uid: string, name: string) {
    this.uid = uid;
    this.name = name;
    this.handCards = new Map();
    this.floorCards = new Map();
    this.blindCards = new Map();
  }

  getUid() {
    return this.uid;
  }

  getName() {
    return this.name;
  }

  playCard(cardId: string): Card | undefined {
    if (this.handCards.has(cardId)) {
      const handCard = this.handCards.get(cardId);
      this.removeCard(cardId);
      return handCard;
    }
  }

  getCards(json: boolean): Card[] | CardJson[] {
    if (json)
      return [...this.handCards.values()].map((card) => {
        const jsonCard: CardJson = {
          uid: card.getUid(),
          rank: card.getRank(),
          suit: card.getSuit(),
          effect: card.getEffect(),
        };

        return jsonCard;
      });
    return [...this.handCards.values()];
  }

  getFloorCards(json: boolean): Card[] | CardJson[] {
    if (json) {
      return [...this.floorCards.values()].map((card) => {
        const jsonCard: CardJson = {
          uid: card.getUid(),
          rank: card.getRank(),
          suit: card.getSuit(),
          effect: card.getEffect(),
        };
        return jsonCard;
      });
    }
    return [...this.floorCards.values()];
  }

  getHiddenCards(json: boolean): Card[] | CardJson[] {
    if (json) {
      return [...this.blindCards.values()].map((card) => {
        const jsonCard: CardJson = {
          uid: card.getUid(),
          rank: card.getRank(),
          suit: card.getSuit(),
          effect: card.getEffect(),
        };
        return jsonCard;
      });
    }
    return [...this.blindCards.values()];
  }

  drawCard(newCard: Card) {
    this.handCards.set(newCard.getUid(), newCard);
  }

  drawBlindCard(newCard: Card) {
    this.blindCards.set(newCard.getUid(), newCard);
  }

  drawFloorCard(newCard: Card) {
    this.floorCards.set(newCard.getUid(), newCard);
  }

  getFloorCard(cardUid: string) {
    return this.floorCards.get(cardUid);
  }

  getHiddenCard(cardUid: string) {
    return this.blindCards.get(cardUid);
  }

  getCard(cardUid: string): Card | undefined {
    return this.handCards.get(cardUid);
  }

  removeCard(cardUid: string): boolean {
    return this.handCards.delete(cardUid);
  }

  pickCardsUp(newCards: Card[]) {
    newCards.forEach((card) => {
      this.handCards.set(card.getUid(), card);
    });
  }

  isHandCardsEmpty() {
    return this.handCards.size === 0;
  }

  isFloorCardsEmpty() {
    return this.floorCards.size === 0;
  }

  isBlindCardsEmpty() {
    return this.blindCards.size === 0;
  }

  pickFloorCardsUp() {
    const floorCards = this.getFloorCards(false) as Card[];
    floorCards.forEach( floorCard => this.drawCard(floorCard));
    this.floorCards = new Map();

  }

  pickBlindCardUp() {
    const blindCards = this.getHiddenCards(false) as Card[];
    if(blindCards.length > 0) {
      const pickedCard = blindCards[0];
      this.drawCard(pickedCard);
      this.blindCards.delete(pickedCard.getUid());
    }
  }
  
}
