import React, { useEffect } from "react";
import { MenuView } from "./menuview";
import GameView, { GameDevView } from "./gameview";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import { v4 } from "uuid";

const MainViewSwitch = observer(() => {
    const { gameInstance, localStore } = useStore();

    useEffect(() => {
        const currentPublicUid = localStore.getPlayerPublicUid();
        if (!currentPublicUid) {
            localStore.setPlayerPublicUid(v4());
        }

        const currentUid = localStore.getPlayerUid();
        if (!currentUid) {
            localStore.setPlayerUid(v4());
        }

        gameInstance.player.setUid(currentUid); 
        gameInstance.player.setPublicUid(currentPublicUid);
    }, []);
    
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