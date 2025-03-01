import React from "react";
import styles from "./seat.module.scss";
import { useStore } from "@stores/stores";
import { observer } from "mobx-react-lite";
import useMeasure from "react-use-measure";
import { BackCards } from "@components/card/backCards";
import { FloorCards } from "@components/card/floorCards";
import { Opponent } from "@stores/opponent";

const PlayerCards = observer(({ opponent }: { opponent: Opponent }) => {
  const opponentPlayerCardsLen = opponent.cards;
  return (
    <>
      <BackCards attr={{ style: styles.handCards }} numOfCards={opponentPlayerCardsLen > 3 ? 3 : opponentPlayerCardsLen} />
      <div
        style={{ color: "white" }}
        className={`${styles.handCards} ${styles.textShadow}`}
      >
       { opponentPlayerCardsLen > 3 && `+ ${opponentPlayerCardsLen - 3}`}
      </div>
    </>
  );
});

const PlayerIcon = observer(({ opponent }: { opponent: Opponent }) => {
  const [ref, bounds] = useMeasure();
  const store = useStore();
  const opponentName = opponent.name;

  React.useEffect(() => {
    store.gameInstance.zones.setOpponentZone({
      ...bounds,
    });
  });

  if (opponentName) {
    return (
      <div className={styles.player}>
        <div className={styles.playerName} >
          {opponentName}
        </div>
      </div>
    );
  }
});

const PlayerOtherCards = observer(({ opponent }: { opponent: Opponent }) => {
  return (
    <>
      <BackCards
        numOfCards={opponent.hiddenCards}
        attr={{ style: styles.hiddenCards }}
      />
      <FloorCards
        cards={opponent.floorCards}
        style={styles.floorCards}
      />
    </>
  );
});

export const Seat = observer(({ opponent }: { opponent: Opponent }) => {
    return (
      <div className={styles.seat}>
        <PlayerIcon opponent={opponent} />
        <PlayerCards opponent={opponent} />
        <PlayerOtherCards opponent={opponent} />
      </div>
    );
});
