import React, { CSSProperties } from "react";
import { Vector2, useDrag } from "@use-gesture/react";
import styles from "./card.module.scss";
import { animated, useSpring } from "react-spring";
import { observer, useLocalObservable } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import { SmallCard, Card as ProtoCard, Effect } from "@proto/card";

export type CardProps = {
  card: ProtoCard | null;
  isDraggable: boolean;
  style?: CSSProperties;
  table?: boolean;
};

export const ranks = "2 3 4 5 6 7 8 9 10 J Q K A".split(" ");
export const suits = "♠︎ ♥︎ ♣︎ ♦︎".split(" ");

const Card = observer((cardT: CardProps) => {
  const store = useStore();
  const { dragPos, dragOffset, setDragOffset, setDragPos } = useLocalObservable(
    () => ({
      dragPos: [0, 0],
      dragOffset: [0, 0],
      setDragPos(state: Vector2) {
        this.dragPos = state;
      },
      setDragOffset(state: Vector2) {
        this.dragOffset = state;
      },
    })
  );

  const bindDrag = useDrag((state) => {
    setDragOffset(state.movement);
    setDragPos(state.xy);
    if (!state.dragging) {
      handleDrop();
    }
  }, {});

  const positionSpring = useSpring({
    from: {
      x: 0,
      top: 0,
      rotateY: 0,
    },
    to: {
      x: dragOffset[0],
      y: dragOffset[1],
      rotateY: 0,
    },
  });

  const handleDrop = () => {
    if (
      dragPos[0] < store.gameInstance.zones.tableZone.right &&
      dragPos[0] > store.gameInstance.zones.tableZone.left &&
      dragPos[1] > store.gameInstance.zones.tableZone.top &&
      dragPos[1] < store.gameInstance.zones.tableZone.bottom
    ) {
      const card = cardT?.card! as ProtoCard;
      if (!store.gameInstance.turn.isMyTurn) setDragOffset([0, 0]);
      store.gameInstance
        .playCard(card.uid)
        .then((res) => !res && setDragOffset([0, 0]));
    } else {
      setDragOffset([0, 0]);
    }
  };

  const inComingStyle = cardT.style;
  const card = cardT?.card! as ProtoCard;

  let imgPath = `url(${new URL("../../assets/cards/back.webp", import.meta.url).href})`;
  
  if (card) {
    imgPath = `url(${
      new URL(
        `../../assets/cards/${card.suit}${card.rank}.svg`,
        import.meta.url
      ).href
    })`;

    if (card?.effect === Effect.TRANSPARENT && cardT.table) {
      imgPath = "";
      inComingStyle.backgroundColor = "#d9c2c259";
      inComingStyle.border = "3px solid";
    }
  }

  if (!cardT.isDraggable) {
    return (
      <animated.div
        style={{...inComingStyle }}
        className={styles.card}
      >
        <img 
          src={imgPath.replace('url(', '').replace(')', '')}
          className={styles.cardImage}
          loading="lazy"
        />
      </animated.div>
    );
  }

  return (
    <animated.div
      {...bindDrag()}
      style={{
        ...inComingStyle,
        ...positionSpring,
        touchAction: "none",
      }}
      className={styles.card}
    >
      <img 
        src={imgPath.replace('url(', '').replace(')', '')}
        className={styles.cardImage}
        loading="lazy"
      />
    </animated.div>
  );
});

export default Card;
