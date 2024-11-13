import React, { useState } from "react";
import styles from "./hand.module.scss";
import { useStore } from "@stores/stores";
import Card from "@components/card/card";
import { observer } from "mobx-react-lite";
import { useSprings, animated, to as interpolate } from "@react-spring/web";
import useMeasure from "react-use-measure";

const trans = (r: number, s: number) =>
  `perspective(1500px) rotateX(10deg) rotateY(0deg) rotateZ(${r}deg) scale(${s})`;

export const Hand = observer(() => {
  const [ref, bounds] = useMeasure();
  const store = useStore();

  const deckBounds = store.gameInstance?.deckZoneBounds!;
  const startY =  deckBounds?.bottom - bounds.bottom;
  const deckCenterX = (deckBounds?.left + deckBounds?.right) / 2;
  const handCenterX = (bounds.left + bounds.right) / 2;
  const startX = deckCenterX - handCenterX - 100;

  const from = (_i: number) => ({
    x: startX,
    rot: 0,
    scale: 1,
    y: startY,
  });

  const to = (i: number) => { 
    let handLengthX;
    let handLengthY;
    handLengthY = i - 10;
    handLengthX = i > 0 ? i - i * 45 - store.gameInstance.hand.getCards().length * i : 0;
    if(i > 8) {
      handLengthX = i - 470 - 9 * (i * 5);
      handLengthY = i - 110
    }

    if(i > 15) {
      handLengthX = i - 890 - 16 * (i * 2.6);
      handLengthY = i - 430
    }

    return {
    x: handLengthX,
    y: handLengthY,
    rot: Math.random() * 6 - Math.random() * 6,
    delay: i * 50,
  }};

  const cards = store.gameInstance.hand.getCards();
  const [props, api] = useSprings(cards.length, (i) => ({
    ...to(i),
    from: from(i),
  }));

  return (
    <div
    ref={ref}
      id={styles.hand}
    >
      <div id={styles.handCards}>
        {props.map(({ x, y, rot, scale }, i) => {
          const zIndex = i > 15 ? 100 + i :  i > 8 ? 200 + i : 300 + i;
          return (
            <React.Fragment key={cards[i].uid}>
              <animated.div key={cards[i].uid} style={{ x, y, zIndex }}>
                <Card
                  deck={false}
                  opponent={false}
                  isDraggable={true}
                  card={cards[i]}
                  floorCard={false}
                  style={{ transform: interpolate([rot, scale], trans) }}
                />
              </animated.div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});
