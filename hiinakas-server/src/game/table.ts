import { CARD_EFFECT, CardJson } from "../types/card";
import { Card } from "./card";

type Turn = {
  uid: string;
  card: Card;
  turnAuthor: string;
};

export class Table {
  private cardsPool: Map<string, Card> = new Map();

  constructor() { }

  placeCard(card: Card) {
    if(card) {
      this.cardsPool.set(card.getUid(), card);
    }
  }

  getCards(json?: boolean): Card[] | CardJson[] {
    if (json)
      return [...this.cardsPool.values()].map((card) => {
        const jsonCard: CardJson = {
          uid: card.getUid(),
          rank: card.getRank(),
          suit: card.getSuit(),
          effect: card.getEffect(),
        };
        return jsonCard;
      });
    return [...this.cardsPool.values()];
  }

  clear() {
    this.cardsPool.clear();
  }

  isCardPlayable(card: Card) {
    const cards = this.getCards() as Card[];
    const lastCard = cards[this.getCards().length - 1];
    if (!lastCard || card?.getEffect() === CARD_EFFECT.DESTROY) return true;
    const lastCardEffect = lastCard?.getEffect();
    const currentCardEffect = card?.getEffect();

    if (
      currentCardEffect === CARD_EFFECT.NO_EFFECT &&
      lastCardEffect === CARD_EFFECT.NO_EFFECT
    ) {
      return card?.getRank() >= lastCard.getRank();
    }

    if (
      currentCardEffect !== CARD_EFFECT.NO_EFFECT &&
      lastCardEffect === CARD_EFFECT.NO_EFFECT
    ) {
      // return true but maybe add something?
      switch (currentCardEffect) {
        case CARD_EFFECT.ACE_KILLER:
        case CARD_EFFECT.TRANSPARENT:
        case CARD_EFFECT.CONSTRAINT:
          return true;
      }
    }

    if (
      currentCardEffect === CARD_EFFECT.NO_EFFECT &&
      lastCardEffect !== CARD_EFFECT.NO_EFFECT
    ) {
      switch (lastCardEffect) {
        case CARD_EFFECT.ACE_KILLER:
          return true;
        case CARD_EFFECT.TRANSPARENT:
          const cards = this.getCards() as Card[];
          const filterCards = cards?.filter(
            (card) => card?.getEffect() !== CARD_EFFECT.TRANSPARENT
          );
          const beneathTransparentCard = filterCards?.length > 0 ?
            filterCards[filterCards?.length - 1] : null;
          if (beneathTransparentCard) {
            switch (beneathTransparentCard.getEffect()) {
              case CARD_EFFECT.ACE_KILLER:
                return true;
              case CARD_EFFECT.CONSTRAINT:
                return card.getRank() < beneathTransparentCard.getRank();
              case CARD_EFFECT.NO_EFFECT:
                return card.getRank() >= beneathTransparentCard.getRank();
            }
          }
          return true;
        case CARD_EFFECT.CONSTRAINT:
          return card.getRank() < lastCard.getRank();
      }
    }

    return (
      currentCardEffect !== CARD_EFFECT.NO_EFFECT &&
      lastCardEffect !== CARD_EFFECT.NO_EFFECT
    );
  }
}
