import React, { useContext, createContext } from "react";
import { LocalStore } from "./localStore";
import { GameInstance } from "./gameInstance";
import { Menu } from "./menu";

type Context = {
    localStore: LocalStore;
    gameInstance: GameInstance;
    menu: Menu;
}

const StoreContext = createContext<Context>(null);

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({children}: {children: any}) => {
    const localStore = new LocalStore();
    const gameInstance = new GameInstance(localStore);
    const menu = new Menu(gameInstance);
    gameInstance.setMenu(menu);
   
    const store: Context = {
        localStore,
        gameInstance,
        menu,
    }

    return <StoreContext.Provider value={store}>
              {children}
           </StoreContext.Provider>
}