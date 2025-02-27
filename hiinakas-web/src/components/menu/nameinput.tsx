import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "@stores/stores";
import styles from "./nameinput.module.scss";
import { v4 } from "uuid";
import { action } from "mobx";

export const NameInput = observer(() => {
    const { gameInstance } = useStore();
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = action(() => {
        if (name.trim().length < 2) {
            setError("Name must be at least 2 characters");
            return;
        }

        if (name.trim().length > 15) {
            setError("Name must be less than 15 characters");
            return;
        }

        gameInstance.player.setName(name.trim());
        gameInstance.player.setUid(v4());
        setError("");
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && name.trim().length > 0) {
            handleSubmit();
        }
    };

    return (
        <div className={styles.nameInputModal}>
            <div className={styles.modalContainer}>
                <h2 className={styles.title}>Enter Your Name</h2>

                <div className={styles.inputGroup}>
                    <input
                        className={styles.nameInput}
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError("");
                        }}
                        placeholder="Your name"
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    {error && (
                        <div className={styles.error}>{error}</div>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    className={styles.submitButton}
                    disabled={name.trim().length === 0}
                >
                    START GAME
                </button>
            </div>
        </div>
    );
});