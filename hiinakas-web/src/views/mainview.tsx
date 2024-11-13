import React, { useEffect } from "react";
import { MenuView } from "./menuview";
import GameView from "./gameview";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import { UserPrompt } from "@components/prompt/userprompt";
import { useAuth0 } from "@auth0/auth0-react";
import { v4 } from "uuid";

export const MainView = observer(() => {
    const { gameInstance } = useStore();
    
    //const { user, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
    const isDev = true;
    const isGameView = true;

    useEffect(() => {
        /*(async function login() {
                if (!isLoading && !user) {
                    await loginWithRedirect();
                }

                if(user) {
                    gameInstance.setUserUid(user.sub, logout, loginWithRedirect);
                }
        })();*/
        if(isDev) {
            gameInstance.setUserUid("dev|"+v4(), null, null);
        }
    }, [/*isLoading*/]);

    
    if (/*isAuthenticated ||*/ isDev) {
        return (
            <>
                {!gameInstance.myName && <UserPrompt />}
                {gameInstance.myName && gameInstance.publicUid && gameInstance.userUid && !gameInstance.gameReady && <MenuView />}
                {gameInstance.gameReady && <GameView />}
            </>
        );
    }
    
});