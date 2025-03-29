import { useStore } from "@stores/stores";
import { observer } from "mobx-react-lite";
import React from "react";
import styles from "./gameresult.module.scss";
import { GameInstanceAction } from "@proto/game";

export const GameResult = observer(() => {
  const { gameInstance } = useStore();
  const isWinner = gameInstance.turn.isWinner;
  const message = gameInstance.turn.turnMessage.message;
  const winnerName = message.split(":")[1];

  return (
    <div>
      {gameInstance.turn.action === GameInstanceAction.WIN && (
        <div style={{backgroundColor: isWinner ? "#457346" : "#953240"}} id={styles.gameResult}>
          <div id={styles.gameResultText}>{`You ${isWinner ? "won" : "lost"} the game ${!isWinner ? `, winner is${winnerName}` : "."}`}</div>
          <div  onClick={() => {
              gameInstance.setGameReady(false);
              gameInstance.turn.setWinner(false, gameInstance);
              clearTimeout(gameInstance.turn.winnerTimeout);
            }} id={styles.gameResultButton}>
            <div><span>Play again</span></div>
          </div>
        </div>
      )}
    </div>
  );
});
