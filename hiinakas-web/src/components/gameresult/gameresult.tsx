import { useStore } from "@stores/stores";
import { observer } from "mobx-react-lite";
import React, { act } from "react";
import styles from "./gameresult.module.scss";
import { Md5 } from "ts-md5";
import { action } from "mobx";

export const GameResult = observer(() => {
  const { gameInstance } = useStore();
  const isWinner = Md5.hashStr(gameInstance.player.userUid) === gameInstance.turn.winner;
  return (
    <div>
      {gameInstance.turn.winner && (
        <div style={{backgroundColor: isWinner ? "#457346" : "#953240"}} id={styles.gameResult}>
          <div id={styles.gameResultText}>You { isWinner ? "won" : "lost"} the game!</div>
          <div id={styles.gameResultButton}>
            <div onClick={() => {
              clearTimeout(gameInstance.turn.winnerTimeout!);
              action(() => {
                gameInstance.menu.reset();
                gameInstance.gameReady = false;
                gameInstance.turn.winner = null;
                gameInstance.socketManager.setupInitialLobbyConnection();
              })();
            }}><span>Play again</span></div>
          </div>
        </div>
      )}
    </div>
  );
});
