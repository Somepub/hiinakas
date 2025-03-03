import React, { useContext, createContext } from "react";
import { LocalStore } from "../util/localStore";
import { GameInstance } from "./gameInstance";
import { Menu } from "./menu";
import { Timer } from "./timer";
import { FloatingTextStore } from "./floatingTextStore";

type Context = {
    localStore: LocalStore;
    gameInstance: GameInstance;
    menu: Menu;
    timer: Timer;
    floatingTextStore: FloatingTextStore;
}

const StoreContext = createContext<Context>(null);

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({children}: {children: React.ReactNode}) => {
    const timer = new Timer();
    const localStore = new LocalStore();
    const floatingTextStore = new FloatingTextStore();
    const gameInstance = new GameInstance(localStore, timer, floatingTextStore);
    const menu = new Menu(gameInstance);

    gameInstance.setMenu(menu);

    const store: Context = {
        localStore,
        gameInstance,
        menu,
        timer,
        floatingTextStore,
    };

    return <StoreContext.Provider value={store}>
              {children}
           </StoreContext.Provider>
}