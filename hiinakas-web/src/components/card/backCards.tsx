import React from "react";
import { useSprings, animated, to as interpolate, to } from "react-spring";
import Card from "./card";
import { HiddenCardJson } from "@types";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import useMeasure from "react-use-measure";

const trans = (x: number, y: number, r: number, s: number) =>
  `translate3d(${x}px, ${y}px, 0) rotateZ(${r}deg) scale(${s})`;

export const BackCards = observer((attr: { cards: HiddenCardJson[]; style: any }) => {
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

  const to = (i: number) => ({
    x: 0,
    y: 0,
    delay: 50 * i,
    zIndex: i,
  });

  const [props, api] = useSprings(attr.cards.length, (i) => ({
    ...to(i),
    from: from(i),
  }));

  const smallStyle = {
    width: "35px",
    height: "50px",
  };

  return (
    <div ref={ref} className={attr.style}>
      {props.map(({ x, y, rot, scale }, i) => (
        <animated.div
          key={attr.cards[i].uidHash}
          style={{
            zIndex: 300 + i,
            transform: interpolate([x, y, rot, scale], trans),
          }}
        >
          <Card
            deck={false}
            card={attr.cards[i]}
            floorCard={false}
            isDraggable={false}
            opponent={true}
            style={{
              ...smallStyle,
            }}
          />
        </animated.div>
      ))}
    </div>
  );
});
