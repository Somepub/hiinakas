import Table from "@components/table/table";
import React, { useEffect, useRef, useState } from "react";
import styles from "./gameview.module.scss";
import { Seat as PlayerSeat } from "@components/player/seat";
import { Seat as OpponentSeat } from "@components/opponent/seat";
import { useStore } from "@stores/stores";
import { observer } from "mobx-react-lite";
import TurnNotification from "@components/turn/turnNotification";

const GameView = observer(() => {
  const { gameInstance } = useStore();

  return (
    <>
      {gameInstance.turn.winner && (
        <div
          style={{
            position: "absolute",
            backgroundColor: "white",
            width: "100vw",
            height: "100vh",
            fontSize: "21px",
          }}
        >
          Game winner: {gameInstance.turn.winner}
        </div>
      )}
      <>
        <TurnNotification />
        <div style={{backgroundColor: "black" }} id={styles.mainwrapper}>
          <OpponentSeat />
          <Table />
          <PlayerSeat />
        </div>
      </>
    </>
  );
});

export default GameView;
