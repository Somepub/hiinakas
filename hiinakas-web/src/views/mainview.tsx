import React from "react";
import { MenuView } from "./menuview";
import GameView, { GameDevView } from "./gameview";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";

const MainViewSwitch = observer(() => {
    const { gameInstance } = useStore();
    return (
        <>
            {!gameInstance.gameReady && <MenuView />}
            {gameInstance.gameReady && <GameView />}
        </>
    );
});

const DevView = observer(() => {
    return <>
        <GameDevView />
    </>;
});

export const MainView = () => {
    return <MainViewSwitch />;
};