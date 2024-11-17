import React, { useEffect } from "react";
import { MenuView } from "./menuview";
import GameView from "./gameview";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import { UserPrompt } from "@components/prompt/userprompt";
import { useAuth0 } from "@auth0/auth0-react";
import { v4 } from "uuid";

const MainViewSwitch = observer(() => {
    const { gameInstance } = useStore();
    return (
        <>
            {!gameInstance.player.name && <UserPrompt />}
            {gameInstance.player.name && gameInstance.player.publicUid && gameInstance.player.userUid && !gameInstance.gameReady && <MenuView />}
            {gameInstance.gameReady && <GameView />}
        </>
    );
});

const MainProdView = observer(() => {
    const { user, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
    const { gameInstance } = useStore();

    useEffect(() => {
        (async function login() {
            if (!isLoading && !user) {
                await loginWithRedirect();
            }

            if (user) {
                gameInstance.player.setUserUid(user.sub);
            }
        })();
    }, [isLoading]);

    return (
        <>
            {isAuthenticated && <MainViewSwitch />}
        </>
    );
});

const MainDevView = observer(() => {
    const { gameInstance } = useStore();
    useEffect(() => {
        const userUid = "dev|" + v4();
        gameInstance.player.setUserUid(userUid);
    }, []);

    return <MainViewSwitch />;
});

export const MainView = () => {
    const isDev = import.meta.env.DEV;
    return isDev ? <MainDevView /> : <MainProdView />;
};