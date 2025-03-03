import React from "react";
import { TableCardDrop } from "./drop";
import { observer } from "mobx-react-lite";
import styles from "./table.module.scss";
import { useStore } from "@stores/stores";
import { Deck } from "./deck";
import useMeasure from "react-use-measure";
import { FloatingText } from "./floatingText";

const Table = observer(() => {
  const [ref, bounds] = useMeasure();
  const store = useStore();
  const { floatingTextStore } = store;
  const isMyTurn = store.gameInstance.turn.isMyTurn;

  React.useEffect(() => {
    store.gameInstance.zones.setTableZone({
      ...bounds,
    });
  });

  if (store.gameInstance.gameReady) {
    return (
      <div id={styles.tableWrapper}>
        <div
          ref={ref}
          style={{
            borderTop: isMyTurn ? "8px solid #733c13" : "8px solid #4df700",
            borderBottom: isMyTurn ? "8px solid #4df700" : " 8px solid #733c13",
          }}
          id={styles.table}
        >
          <div className={styles.cornerDecorations}>
            <div className={`${styles.corner} ${styles.topLeft}`} />
            <div className={`${styles.corner} ${styles.topRight}`} />
            <div className={`${styles.corner} ${styles.bottomLeft}`} />
            <div className={`${styles.corner} ${styles.bottomRight}`} />
          </div>
          <div className={styles.gameContent}>
            <Deck />
            {floatingTextStore.show && (
                    <FloatingText 
                        text={floatingTextStore.text} 
                        onFinish={() => floatingTextStore.hideText()} 
                    />
                )}
            <TableCardDrop />
            
            <div id={styles.buttons}>
              <div
                onClick={() => store.gameInstance.endTurn()}
                className={`${styles.button} ${styles.endTurn}`}
              >
                <span>End Turn</span>
              </div>
              <div 
                onClick={() => store.gameInstance.pickUp()} 
                className={`${styles.button} ${styles.pickUp}`}
              >
                <span>Pick up</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

export default Table;
