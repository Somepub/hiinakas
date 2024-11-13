import { MainMenu } from "@components/menu/menu";
import { useStore } from "@stores/stores";
import { observer } from "mobx-react-lite";
import React from "react";

export const MenuView = observer(() => {
    const store = useStore();
    return (
        <>
            <MainMenu />
        </>
    );
});