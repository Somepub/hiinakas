import { BackCards } from "@components/card/backCards";
import { useStore } from "@stores/stores";
import { observer } from "mobx-react-lite";
import styles from "./deck.module.scss";
import React from "react";
import { animated, useSprings } from "react-spring";
import Card from "@components/card/card";
import useMeasure from "react-use-measure";

export const Deck = observer(() => {
    const [ref, bounds] = useMeasure();
    const from = (_i: number) => ({ x: 0, rot: 0, scale: 1, y: -1000 });
    const store = useStore();
    const cards = store.gameInstance.deck.getCards();
  
    const to = (i: number) => ({
      x: 0,
      y: 0,
      delay: 0,
      zIndex: i,
    });
  
    const [props, api] = useSprings(cards.length, (i) => ({
      ...to(i),
      from: from(i),
    }));
  
    const smallStyle = {
      width: "63px",
      height: "98px",
      position: "absolute"
    };

    React.useEffect(() => {
      store.gameInstance.zones.setDeckZone({
        ...bounds,
      });
    });
  
      return (
        <div ref={ref} id={styles.deck}>
            {props.map(({ x, y, rot, scale }, i) => (
              <animated.div key={cards[i].uidHash} style={{ x, y, zIndex: 100 + i }}>
                <Card deck={true} card={cards[i]} floorCard={false} isDraggable={false} opponent={false} style={{
                  ...smallStyle
                }} />
              </animated.div>
            ))}
        </div>
      );
});