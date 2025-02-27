import React from "react";
import styles from "./timer.module.scss";
import { useStore } from "@stores/stores";
import { observer } from "mobx-react-lite";

export const Timer = observer(() => {
  const { timer } = useStore();
  const timeLeft = timer.timeLeft;
  
  return (
    <div id={styles.timer}>
        Turn ends in: {` `}
        <span>{timeLeft}</span>
    </div>
  );
});

export default Timer;
