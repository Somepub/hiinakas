import React from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import styles from "./playerTurn.module.scss";

const PlayerTurn = observer(() => {
  const store = useStore();

  return <div id={styles.playerTurn}>
        Current turn: {store.gameInstance?.turn?.isMyTurn ? "You" : store.gameInstance?.turn?.currentTurnName}
    </div>;
});

export default PlayerTurn;