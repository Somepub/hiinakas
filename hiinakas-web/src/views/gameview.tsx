import Table from "@components/table/table";
import React from "react";
import styles from "./gameview.module.scss";
import { Seat as PlayerSeat } from "@components/player/seat";
import { Seat as OpponentSeat } from "@components/opponent/seat";
import TurnNotification from "@components/turn/turnNotification";
import { GameResult } from "@components/gameresult/gameresult";

const GameView = () => {
  return (
    <>
      <TurnNotification />
      <GameResult />
      <div id={styles.mainwrapper}>
        <OpponentSeat />
        <Table />
        <PlayerSeat />
      </div>
    </>
  );
};

export default GameView;
