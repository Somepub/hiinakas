import React, { useState } from "react";
import styles from "./userprompt.module.scss";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";

export const UserPrompt = observer(() => {
    const [userName, setUserName] = useState("");
    const {localStore, gameInstance} = useStore();

    const onClick = () => {
        if(userName.trim()) {
            localStore.setGameName(userName);
            gameInstance.player.setName(userName);
        }
    }
    return (
        <div id={styles.userprompt}>
            <div id={styles.userpromptLabel}><span>Please enter your avatar name.</span></div>
            <input onChange={(e) => setUserName(e.target.value)} value={userName} id={styles.userpromptInput} />
            <div onClick={onClick} id={styles.userpromptButton}>OK</div>
        </div>
    );
});