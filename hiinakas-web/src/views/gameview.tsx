import Table from "@components/table/table";
import React from "react";
import styles from "./gameview.module.scss";
import { Seat as PlayerSeat } from "@components/player/seat";
import { Seat as OpponentSeat } from "@components/opponent/seat";
import { GameResult } from "@components/gameresult/gameresult";
import backgroundImage from "@assets/area/background.webp";
import { Timer } from "@components/timer/timer";
import { ToastContainer } from "react-toastify";
import { observer } from "mobx-react-lite";
import PlayerTurn from "@components/player/playerTurn";
import { useStore } from "@stores/stores";
import { Rank, SmallCard, Suit } from "@proto/card";
import { Card } from "@proto/card";
import { Opponent } from "@stores/opponent";

const GameView = observer(() => {
  const store = useStore();

  return (
    <>
      <ToastContainer pauseOnFocusLoss={false} autoClose={1000} limit={1} />
      <GameResult />
      <div
        style={{ backgroundImage: `url(${backgroundImage})` }}
        id={styles.mainwrapper}
      >
        <div id={styles.gameview}>
          <div id={styles.opponents}>
            {store.gameInstance.opponents.map((opponent) => (
              <OpponentSeat opponent={opponent} />
            ))}
          </div>
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
    Card.create({ rank: Rank.TEN, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.SIX, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.SEVEN, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.SEVEN, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.ACE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.THREE, suit: Suit.HEARTS }),
    Card.create({ rank: Rank.SEVEN, suit: Suit.HEARTS }),
  ]);

  gameInstance.hand.setFloorCards([
    SmallCard.create({ value: 1 }),
    SmallCard.create({ value: 1 }),
    SmallCard.create({ value: 1 }),
  ]);
  gameInstance.hand.setHiddenCards(3);
  gameInstance.table.setCards([
    SmallCard.create({ value: 7 }),
    SmallCard.create({ value: 6 }),
    SmallCard.create({ value: 7 }),
  ]);

  gameInstance.opponents = [new Opponent(), new Opponent()];
  gameInstance.opponents[0].name = "Player 1";
  gameInstance.opponents[1].name = "Player 2";

  gameInstance.opponents[0].setCards(3);
  gameInstance.opponents[0].setFloorCards([
    SmallCard.create({ value: 1 }),
    SmallCard.create({ value: 1 }),
    SmallCard.create({ value: 1 }),
  ]);
  gameInstance.opponents[0].setHiddenCards(3);

  gameInstance.opponents[1].setCards(3);
  gameInstance.opponents[1].setFloorCards([
    SmallCard.create({ value: 1 }),
    SmallCard.create({ value: 1 }),
    SmallCard.create({ value: 1 }),
  ]);
  gameInstance.opponents[1].setHiddenCards(3);

  gameInstance.deck.setCards(10);
  gameInstance.gameReady = true;
  return <GameView />;
});

export default GameView;
