import React, { useContext, createContext } from "react";
import { LocalStore } from "../util/localStore";
import { GameInstance } from "./gameInstance";
import { Menu } from "./menu";
import { Timer } from "./timer";

type Context = {
    localStore: LocalStore;
    gameInstance: GameInstance;
    menu: Menu;
    timer: Timer;
}

const StoreContext = createContext<Context>(null);

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({children}: {children: React.ReactNode}) => {
    const timer = new Timer();
    const localStore = new LocalStore();
    const gameInstance = new GameInstance(localStore, timer);
    const menu = new Menu(gameInstance);
    gameInstance.setMenu(menu);

    const store: Context = {
        localStore,
        gameInstance,
        menu,
        timer,
    };

    return <StoreContext.Provider value={store}>
              {children}
           </StoreContext.Provider>
}