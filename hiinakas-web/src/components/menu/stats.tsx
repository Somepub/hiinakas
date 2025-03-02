import React from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import styles from "./stats.module.scss"

export const Stats = observer(function Stats() {
  const { menu } = useStore();

  const mock = [
    { id: 1, name: "1d211d211d211d21", wins: 1, losses: 1 },
    { id: 2, name: "asd", wins: 1, losses: 11111111110 },
    { id: 3, name: "1d21", wins: 0, losses: 1 },
    { id: 4, name: "1d21", wins: 0, losses: 1 },
    { id: 5, name: "1d21", wins: 0, losses: 1 },
    { id: 6, name: "asdasdasdasd", wins: 1111111110, losses: 1 },
    { id: 7, name: "1d21", wins: 0, losses: 1 },
    { id: 8, name: "1d21", wins: 0, losses: 1 },
    { id: 9, name: "1d21", wins: 0, losses: 1 },
    { id: 10, name: "1d21", wins: 0, losses: 1 },
  ]

  return (
    <div className={styles.statsContainer}>
        <div className={styles.statsContent}>
          <div className={styles.statsCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Player Stats</h2>
            </div>
            <div className={styles.cardContent}>
              <table className={styles.statsTable}>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Wins</th>
                    <th>Losses</th>
                  </tr>
                </thead>
                <tbody>
                  {menu.statistics.playerStats.map((player) => (
                    <tr key={player.uid}>
                      <td className={styles.playerName}>{player.name}</td>
                      <td className={styles.playerWins}>{player.wins}</td>
                      <td className={styles.playerLosses}>{player.losses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      <div className={styles.backButton} onClick={() => menu.setIsOnTop10(false)}>
        <span>BACK</span>
      </div>
    </div>
  )
});

