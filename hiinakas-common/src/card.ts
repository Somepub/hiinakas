export enum RANK {
  TWO,
  THREE,
  FOUR,
  FIVE,
  SIX,
  SEVEN,
  EIGHTH,
  NINE,
  TEN,
  JACK,
  QUEEN,
  KING,
  ACE,
}

export enum SUIT {
  CLUBS,
  DIAMONDS,
  HEARTS,
  SPADES,
}

export enum CARD_EFFECT {
  ACE_KILLER,
  CONSTRAINT,
  TRANSPARENT,
  DESTROY,
  NO_EFFECT,
  FLOW_CHANGE,
}

export type CardJson = {
  uid: string;
  rank: RANK;
  suit: SUIT;
  effect: CARD_EFFECT;
};

export type FloorCardJson = {
  uidHash: string;
  rank: RANK;
  suit: SUIT;
  effect: CARD_EFFECT;
};

export type HiddenCardJson = {
  uidHash: string;
};
