import React from "react";
import { Vector2, useDrag } from "@use-gesture/react";
import styles from "./card.module.scss";
import { CARD_EFFECT, CardJson, FloorCardJson, HiddenCardJson } from "@common/card";
import { animated, useSpring } from "react-spring";
import { observer, useLocalObservable } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import { GameInstanceAction } from "@common/game";

export type CardT = {
  card: CardJson | FloorCardJson | HiddenCardJson;
  isDraggable: boolean;
  style?: any;
  opponent?: boolean;
  floorCard?: boolean;
  deck?: boolean;
  table?: boolean;
}

export const ranks = '2 3 4 5 6 7 8 9 10 J Q K A'.split(' ');
export const suits = '♠︎ ♥︎ ♣︎ ♦︎'.split(' ');

const Card = observer((cardT: CardT) => {
  const store = useStore();
  const {dragPos, dragOffset, setDragOffset, setDragPos} = useLocalObservable(() => ({
      dragPos: [0, 0],
      dragOffset: [0, 0],
      setDragPos(state: Vector2) {
        this.dragPos = state;
      },
      setDragOffset(state: Vector2) {
        this.dragOffset = state;
      }
  }));

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
      rotateY: 0
    },
    to: {
      x: dragOffset[0],
      y: dragOffset[1],
      rotateY: 0
    }
  });

  const handleDrop = () => {
    if (
      dragPos[0] < store.gameInstance.dropZoneBounds.right &&
      dragPos[0] > store.gameInstance.dropZoneBounds.left &&
      dragPos[1] > store.gameInstance.dropZoneBounds.top &&
      dragPos[1] < store.gameInstance.dropZoneBounds.bottom
    ) {
      const card = cardT?.card! as CardJson;
      if(!store.gameInstance.turn.isMyTurn()) return setDragOffset([0, 0]);
      store.gameInstance.playCard(card.uid).then( (res) => !res && setDragOffset([0, 0]));

    } else {
      setDragOffset([0, 0]);
    }
  };

  const inComingStyle = cardT.style;
  const card = cardT?.card! as CardJson;
  let imgPath = cardT.opponent && !cardT.floorCard ? `url(./cards/back.svg)` :`url(./cards/${card.suit}${card.rank}.png)`;

  if(cardT.deck) {
    imgPath = "url(./cards/back.svg)";
  }

  if(card.effect === CARD_EFFECT.TRANSPARENT && cardT.table) {
    imgPath = "";
    inComingStyle.backgroundColor = "#d9c2c259";
    inComingStyle.border = "3px solid";
  }

  if(!cardT.isDraggable) {
    return (
      <animated.div 
      style={{ backgroundImage: imgPath, ...inComingStyle }}
      className={styles.card}>
    </animated.div>
    );
  }
  return (
    <animated.div 
      {...bindDrag()}
      style={{ backgroundImage: imgPath, ...inComingStyle, ...positionSpring, touchAction: "none", }}
      className={styles.card}>
    </animated.div>
  );
});

export default Card;