import React, { useEffect } from "react";
import { TableCardDrop } from "./drop";
import { observer } from "mobx-react-lite";
import styles from "./table.module.scss";
import { useStore } from "@stores/stores";
import { Deck } from "./deck";
import useMeasure from "react-use-measure";

const Table = observer(() => {
  const [ref, bounds] = useMeasure();
  const store = useStore();
  const isMyTurn = store.gameInstance.turn.isMyTurn();

  React.useEffect(() => {
    store.gameInstance.zones.setTableZone({
      ...bounds,
    });
  });

  if(store.gameInstance.gameReady) {
    return (
      <div ref={ref} style={{borderTop: isMyTurn ? "8px solid #733c13" : "8px solid #4df700", borderBottom:  isMyTurn ? "8px solid #4df700": " 8px solid #733c13"}} id={styles.table}>
        <div id={styles.tableBorder}></div>
        <Deck />
       
        <TableCardDrop />
        <div id={styles.buttons}>
              <div onClick={() => store.gameInstance.endTurn()} id={styles.endTurn}><span>End Turn</span></div>
              <div onClick={() => store.gameInstance.pickUp()} id={styles.pickUp}><span>Pick up</span></div>
            </div>
        
      </div>
    );
  }
  
});

export default Table;
