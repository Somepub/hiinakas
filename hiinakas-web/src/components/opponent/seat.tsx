import React from "react";
import styles from "./seat.module.scss";
import { useStore } from "@stores/stores";
import { observer } from "mobx-react-lite";
import useMeasure from "react-use-measure";
import { BackCards } from "@components/card/backCards";
import { FloorCards } from "@components/card/floorCards";
import Avvvatars from "avvvatars-react";

const PlayerCards = observer(() => {
  const store = useStore();
  const opponentPlayerCardsLen = store.gameInstance?.opponent?.cards;
  return (
    <div>
      <BackCards attr={{ style: styles.handCards }} numOfCards={opponentPlayerCardsLen > 3 ? 3 : opponentPlayerCardsLen} />
      <div
        style={{ color: "white" }}
        className={`${styles.handCards} ${styles.textShadow}`}
      >
       { opponentPlayerCardsLen > 3 && `+ ${opponentPlayerCardsLen - 3}`}
      </div>
    </div>
  );
});

const PlayerIcon = observer(() => {
  const [ref, bounds] = useMeasure();
  const store = useStore();
  const opponentName = store.gameInstance?.opponent?.name;

  React.useEffect(() => {
    store.gameInstance.zones.setOpponentZone({
      ...bounds,
    });
  });

  if (opponentName) {
    return (
      <div ref={ref} id={styles.icon}>
        <Avvvatars style="shape" value={opponentName} size={110} />
        <div className={styles.textShadow} id={styles.playerName}>
          {opponentName}
        </div>
      </div>
    );
  }
});

const PlayerDetails = observer(() => {
  const store = useStore();
  return (
    <div>
      <BackCards
        numOfCards={store.gameInstance.opponent.hiddenCards}
        attr={{ style: styles.hiddenCards }}
      />
      <FloorCards
        cards={store.gameInstance.opponent.floorCards}
        style={styles.floorCards}
      />
    </div>
  );
});

const PlayerIconCards = observer(() => {
  return <div id={styles.iconCards}>
    <PlayerIcon />
    <PlayerCards />
  </div>
});

export const Seat = observer(() => {
  const store = useStore();
    return (
      <div id={styles.seat}>
        <PlayerDetails />
        <PlayerIconCards />
      </div>
    );
});
