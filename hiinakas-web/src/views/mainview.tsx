import React, { useEffect } from "react";
import { MenuView } from "./menuview";
import GameView, { GameDevView } from "./gameview";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import { v4, validate as validateUid } from "uuid";

const MainViewSwitch = observer(() => {
    const { gameInstance, localStore } = useStore();

    useEffect(() => {
        const currentPublicUid = localStore.getPlayerPublicUid();
        if (!currentPublicUid || !validateUid(currentPublicUid) ) {
            const newPublicUid = v4();
            gameInstance.player.setPublicUid(newPublicUid);
        }

        const currentUid = localStore.getPlayerUid();
        if (!currentUid || !validateUid(currentUid) ) {
            const newUid = v4();
            gameInstance.player.setUid(newUid);
        }

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