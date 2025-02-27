import React from "react";
import styles from "./menu.module.scss";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import backgroundImage from "@assets/area/background.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons/faSpinner";
import Avvvatars from "avvvatars-react";
import { NameInput } from "./nameinput";

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

  return (
    <div id={styles.menuContent}>
      <MenuContentStatistics />
      <MenuContentFindMatch />
      <MenuContentExit />
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
          <span className={styles.infoValue}>{menu.statistics.playerCount}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Active games:</span>
          <span className={styles.infoValue}>{menu.statistics.gameCount}</span>
        </div>
      </>
    )}
  </div>
  );
});

const MenuContentFindMatch = observer(() => {
  const { menu } = useStore();
  return (
    <div onClick={() => menu.findMatch()} id={styles.menuContentFindMatch}>
      <span>FIND MATCH</span>
    </div>
  );
});

const MenuContentExit = observer(() => {
  const { menu } = useStore();
  return (
    <div onClick={() => menu.exitGame()} id={styles.menuContentExit}>
      <span>HOW TO PLAY</span>
    </div>
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
      <div onClick={() => menu.leaveQueue()} id={styles.menuContentWaitingBackbutton}>
        <span>BACK</span>
      </div>
    </div>
  );
});

export const MainMenu = observer(() => {
  const { menu, gameInstance } = useStore();

  return (
    <div
      style={{backgroundImage: `url(${backgroundImage})` }}
      id={styles.menu}
    >
      <MenuLogo />
      {!gameInstance.player.name && !gameInstance.player.uid && <NameInput />}
      {!menu.isWaiting && <MenuContent />}
      {menu.isWaiting && <MenuContentWaiting />}
    </div>
  );
});
