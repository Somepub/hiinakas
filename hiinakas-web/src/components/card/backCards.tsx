import React from "react";
import { useSprings, animated, to as interpolate, to } from "react-spring";
import Card from "./card";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import useMeasure from "react-use-measure";
import { v4 } from "uuid";

const trans = (x: number, y: number, r: number, s: number) =>
  `translate3d(${x}px, ${y}px, 0) rotateZ(${r}deg) scale(${s})`;

interface BackCardsProps {
  numOfCards: number;
  attr: {
    style: any;
  };
}

export const BackCards: React.FC<BackCardsProps> = observer(({ numOfCards, attr }) => {
  const [ref, bounds] = useMeasure();
  const store = useStore();
  
  const deckBounds = store.gameInstance.zones.deckZone!;
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

  const [props] = useSprings(numOfCards, (i) => ({
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
          key={v4()}
          style={{
            zIndex: 300 + i,
            transform: interpolate([x, y, rot, scale], trans),
          }}
        >
          <Card
            card={null}
            isDraggable={false}
            style={{
              ...smallStyle,
            }}
          />
        </animated.div>
      ))}
    </div>
  );
});
