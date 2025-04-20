import React from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import styles from "./playerName.module.scss";

const PlayerName = observer(() => {
  const store = useStore();

  return <div id={styles.playerName}>
        My name: {` `}
        {store.gameInstance.player.name}
    </div>;
});

export default PlayerName;