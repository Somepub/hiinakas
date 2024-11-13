import { useStore } from '@stores/stores';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { animated, useSpring } from 'react-spring';
import styles from "./turnNotification.module.scss";

const TurnNotification = observer(() => {
  const store = useStore();
  const [isVisible, setIsVisible] = useState(false);
  const isMyTurn = store.gameInstance.turn.isMyTurn();

  useEffect(() => {
    setIsVisible(true);

    const timeoutId = setTimeout(() => {
      setIsVisible(false);
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, [store.gameInstance.turn.currentTurnHash, isMyTurn]);

  const animationProps = useSpring({
    opacity: isVisible ? 1 : 0,
    config: { duration: 500 },
  });

  if (store.gameInstance.gameReady) {
    return (
      <animated.div id={styles.turnNotification} style={animationProps}>
        <div id={styles.turnWrapper}><span>{isMyTurn ? "Your Turn" : "Opponent's Turn"}</span></div>
      </animated.div>
    );
  }
});

export default TurnNotification;