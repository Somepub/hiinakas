import { useStore } from "@stores/stores";
import { observer } from "mobx-react-lite";
import React from "react";
import { useSprings, animated } from "react-spring";
import Card from "./card";
import { Effect, SmallCard } from "@proto/card";
import { v4 } from "uuid";

export const convertSmallCardToCard = (smallCard: SmallCard) => {
  const suit = Math.floor((smallCard.value - 1) / 13);
  const rank = (smallCard.value - 1) % 13;

  const getEffect = (rank: number): Effect => {
    switch(rank) {
      case 0:
        return Effect.ACE_KILLER;
      case 5:
        return Effect.CONSTRAINT;
      case 6:
        return Effect.TRANSPARENT;
      case 8:
        return Effect.DESTROY;
      default:
        return Effect.NO_EFFECT;
    }
  }

  return {
    uid: v4(),
    rank: rank,
    suit: suit,
    effect: getEffect(rank),
  }
}

export const FloorCards = observer((attr: { cards: SmallCard[], style: any }) => {
    const from = (_i: number) => ({ x: 0, rot: 0, scale: 1, y: -1000 });
    const to = (i: number) => ({
      x: 0,
      y: 0,
      delay: 200 * i,
      zIndex: i,
    });
  
    const [props] = useSprings(attr.cards.length, (i) => ({
      ...to(i),
      from: from(i),
    }));
  
    const smallStyle = {
      width: "35px",
      height: "50px",
    };
  
      return (
        <div className={attr.style}>
          {props.map(({ x, y, rot, scale }, i) => (
            <animated.div key={attr.cards[i].value} style={{ x, y, zIndex: 300 + i }}>
              <Card card={convertSmallCardToCard(attr.cards[i])} isDraggable={false} style={{
                ...smallStyle
              }} />
            </animated.div>
          ))}
        </div>
      );
});