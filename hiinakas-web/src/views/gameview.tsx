import Table from "@components/table/table";
import React from "react";
import styles from "./gameview.module.scss";
import { Seat as PlayerSeat } from "@components/player/seat";
import { Seat as OpponentSeat } from "@components/opponent/seat";
import { GameResult } from "@components/gameresult/gameresult";
import backgroundImage from '@assets/area/background.webp';
import { Timer } from "@components/timer/timer";
import { ToastContainer } from "react-toastify";
import { observer } from "mobx-react-lite";
import PlayerName from "@components/player/playerName";
import { useStore } from "@stores/stores";
import { Rank, SmallCard, Suit } from "@proto/card";
import { Card } from "@proto/card";

const GameView = observer(() => {
  return (
    <>
      <ToastContainer pauseOnFocusLoss={false} autoClose={1000} limit={1} />
      <GameResult />
      <Timer />
      <PlayerName />
      <div style={{backgroundImage: `url(${backgroundImage})`}} id={styles.mainwrapper}>
        <div id={styles.gameview}>
          <OpponentSeat />
          <Table />
          <PlayerSeat />
        </div>
      </div>
    </>
  );
});

export const GameDevView = observer(() => {
  const store = useStore();
  const gameInstance = store.gameInstance;

  gameInstance.hand.setCards([
    Card.create({rank: Rank.TEN, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.SIX, suit: Suit.HEARTS}),
    Card.create({rank: Rank.SEVEN, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.SEVEN, suit: Suit.HEARTS}),
    Card.create({rank: Rank.ACE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.THREE, suit: Suit.HEARTS}),
    Card.create({rank: Rank.SEVEN, suit: Suit.HEARTS}),
  ]);
  
  gameInstance.hand.setFloorCards([
    SmallCard.create({value: 1}),
    SmallCard.create({value: 1}),
    SmallCard.create({value: 1}),
  ]);
  gameInstance.hand.setHiddenCards(3);
  /*gameInstance.table.setCards([
    SmallCard.create({value: 1}),
    SmallCard.create({value: 1}),
    SmallCard.create({value: 1}),
  ]);*/

  gameInstance.opponent.setCards(3);
  gameInstance.opponent.setFloorCards([
    SmallCard.create({value: 1}),
    SmallCard.create({value: 1}),
    SmallCard.create({value: 1}),
  ]);
  gameInstance.opponent.setHiddenCards(3);

  gameInstance.deck.setCards(10);
  gameInstance.gameReady = true;
  return (
    <GameView />
  );
});

export default GameView;
