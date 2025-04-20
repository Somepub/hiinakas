import React from "react";
import styles from "./menu.module.scss";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import backgroundImage from "@assets/area/background.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons/faSpinner";
import { NameInput } from "./nameinput";
import { Stats } from "./stats";
import { GameType } from "@proto/lobby";

const MenuLogo = () => {
  return (
    <div id={styles.menuLogo}>
      <div id={styles.menuIcon}>
        <span>HIINAKAS</span>
      </div>
      <div id={styles.menuIconAlt}>
        <div></div>
        <span>CARD GAME</span>
      </div>
    </div>
  );
};

const MenuContent = observer(() => {
  const { menu } = useStore();

  return (
    <div id={styles.menuContent}>
      <MenuContentStatistics />
      <MenuContentFindMatch />
      <MenuContentTop10 />
    </div>
  );
});

const MenuContentStatistics = observer(() => {
  const { menu, gameInstance } = useStore();
  return (
    <div className={styles.infoBox}>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Playing as:</span>
        <span className={styles.infoValue}>{gameInstance.player.name}</span>
      </div>
      {menu.statistics && (
        <>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Players online:</span>
            <span className={styles.infoValue}>
              {menu.statistics.playerCount}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Active games:</span>
            <span className={styles.infoValue}>
              {menu.statistics.gameCount}
            </span>
          </div>
        </>
      )}
    </div>
  );
});

const MenuContentTop10 = observer(() => {
  const { menu } = useStore();
  return (
    <div className={styles.menuButton} onClick={() => menu.setIsOnTop10(true)}>
      <span>LEADERBOARD</span>
    </div>
  );
});

const MenuContentFindMatch = observer(() => {
  const { menu } = useStore();
  return (
    <>
      <div className={styles.menuButton} onClick={() => menu.findMatch(GameType.TWO_PLAYER)}>
        <span>FIND MATCH 2 PLAYER</span>
      </div>
      <div className={styles.menuButton} onClick={() => menu.findMatch(GameType.THREE_PLAYER)}>
        <span>FIND MATCH 3 PLAYER</span>
      </div>
      <div className={styles.menuButton} onClick={() => menu.findMatch(GameType.FOUR_PLAYER)}>
        <span>FIND MATCH 4 PLAYER</span>
      </div>
      <div className={styles.menuButton} onClick={() => menu.findMatch(GameType.FIVE_PLAYER)}>
        <span>FIND MATCH 5 PLAYER</span>
      </div>
    </>
  );
});

const MenuContentWaiting = observer(() => {
  const { menu } = useStore();

  return (
    <div id={styles.menuContentWaiting}>
      <div id={styles.menuContentWaitingLabel}>
        <span>SEARCHING FOR A MATCH...</span>
        <FontAwesomeIcon spin icon={faSpinner} />
      </div>
      <MenuContentStatistics />
      <div className={styles.menuButton} onClick={() => menu.leaveQueue()}>
        <span>BACK</span>
      </div>
    </div>
  );
});

export const MainMenu = observer(() => {
  const { menu, gameInstance } = useStore();

  return (
    <div
      style={{ backgroundImage: `url(${backgroundImage})` }}
      id={styles.menu}
    >
      <MenuLogo />
      {!gameInstance.player.name && <NameInput />}
      {!menu.isWaiting && !menu.isOnTop10 && <MenuContent />}
      {menu.isWaiting && !menu.isOnTop10 && <MenuContentWaiting />}
      {menu.isOnTop10 && <Stats />}
    </div>
  );
});
