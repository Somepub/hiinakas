import { CARD_EFFECT, CardJson } from "#types";
import { Card } from "./card";
import { Instance } from "./instance";

export class Table {
  private cardsPool: Map<string, Card> = new Map();
  private instance: Instance;

  constructor(instance: Instance) {
    this.instance = instance;
  }

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

  lastCard() {
    const cards = this.getCards() as Card[];
    return cards[cards.length - 1];
  }

  clear() {
    this.cardsPool.clear();
  }

  isCardPlayable(card: Card) {
    const lastCard = this.lastCard();
    if (!lastCard || card?.getEffect() === CARD_EFFECT.DESTROY) return true;
    const lastCardEffect = lastCard?.getEffect();
    const currentCardEffect = card?.getEffect();
    const turnMoves = this.instance.getTurnMoves();

    if (this.lastCard()?.getRank() === card?.getRank()) {
      this.instance.setTurnMoves(0);
      return true;
    }

    if(turnMoves > 0) {
      return false;
    }

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
