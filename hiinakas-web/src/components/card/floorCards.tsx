import { useStore } from "@stores/stores";
import { observer } from "mobx-react-lite";
import React from "react";
import { useSprings, animated } from "react-spring";
import Card from "./card";
import { FloorCardJson } from "@types";

export const FloorCards = observer((attr: { cards: FloorCardJson[], style: any }) => {
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
            <animated.div key={attr.cards[i].uidHash} style={{ x, y, zIndex: 300 + i }}>
              <Card card={attr.cards[i]} isDraggable={false} opponent={true} floorCard={true} style={{
                ...smallStyle
              }} deck={false} />
            </animated.div>
          ))}
        </div>
      );
});