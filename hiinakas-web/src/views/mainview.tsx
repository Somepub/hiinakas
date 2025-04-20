import React, { useEffect } from "react";
import { MenuView } from "./menuview";
import GameView, { GameDevView } from "./gameview";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";
// @ts-ignore
import serviceWorker from "../../service-worker.js";

const MainViewSwitch = observer(() => {
  const { gameInstance } = useStore();
  console.log(gameInstance.player, gameInstance.gameReady);
  return (
    <>
      {!gameInstance.gameReady && <MenuView />}
      {gameInstance.gameReady && <GameView />}
    </>
  );
});

export const DevView = observer(() => {
  return (
    <>
      <GameDevView />
    </>
  );
});

export const MainView = () => {
  useEffect(() => {
    const loadServiceWorker = async () => {
      navigator.serviceWorker
        .register(new URL("./service-worker.js", import.meta.url))
        .then((_registration) => {
          console.log("ServiceWorker registration successful");
        })
        .catch((err) => {
          console.log("ServiceWorker registration failed: ", err);
        });
    };
    try {
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", loadServiceWorker);
      }
    } catch (e) {
      console.log(e);
    }
    () => window.removeEventListener("load", loadServiceWorker);
  }, []);
  return <MainViewSwitch />;
};
