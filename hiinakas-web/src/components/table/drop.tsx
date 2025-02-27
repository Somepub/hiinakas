import Card from "@components/card/card";
import React from "react";
import styles from "./drop.module.scss";
import { useStore } from "@stores/stores";
import { observer } from "mobx-react-lite";
import useMeasure from "react-use-measure";
import { useSprings, animated, to as interpolate } from "@react-spring/web";
import { convertSmallCardToCard } from "@components/card/floorCards";

const trans = (r: number, s: number) => ``;

export const TableCardDrop = observer(() => {
  const [ref, bounds] = useMeasure();
  const store = useStore();
  const cards = store.gameInstance.table.getCards();
  const isMyTurn: boolean = store.gameInstance.turn.isMyTurn;
  const containerTopOffset = bounds.top;
  const containerLeftOffset = bounds.left;
  const startY = store?.gameInstance?.zones?.opponentZone?.top - containerTopOffset;
  const startX = store?.gameInstance?.zones?.opponentZone?.left - containerLeftOffset;

  const from = (_i: number) => ({
    x: !isMyTurn ? startX : 0,
    rot: 0,
    scale: 1,
    y: !isMyTurn ? startY : 0,
  });

  const to = (i: number) => ({
    x: i,
    y: i,
    delay: 100,
    zIndex: cards.length + i,
  });

  const [props, api] = useSprings(cards.length, (i) => ({
    ...to(i),
    from: from(i),
  }));


  React.useEffect(() => {
    store.gameInstance.zones.setDropZone({
      ...bounds,
    });
  });

  return (
    <animated.div id={styles.drop}>
      <div ref={ref} id={styles.cardDrop}>
        {props.map(({ x, y, rot, scale }, i) => {
          const card = convertSmallCardToCard(cards[i]);
          return (
            <animated.div
              key={card.uid}
              style={{ x, y, position: "absolute", zIndex: cards.length + i }}
          >
            <Card
              isDraggable={false}
              card={card}
              table={true}
              style={{
                width: "63px",
                height: "98px",
                // @ts-ignore
                transform: interpolate([rot, scale], trans),
                position: "absolute",
              }}
            />
          </animated.div>
        );
        })}
      </div>
    </animated.div>
  );
});
