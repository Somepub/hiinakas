
const PLAYER_UID_KEY = "HplayerUid";
const PLAYER_NAME_KEY = "HplayerName"
const PLAYER_PUBLIC_UID_KEY = "HplayerPublicUid";

export class LocalStore {
    localStorage: Storage;

    constructor() {
        this.localStorage = window.localStorage;
    }

    getPlayerUid(): string {
        return this.localStorage.getItem(PLAYER_UID_KEY) || null;
    }

    getPlayerName(): string {
        return this.localStorage.getItem(PLAYER_NAME_KEY) || null;
    }

    getPlayerPublicUid(): string {
        return this.localStorage.getItem(PLAYER_PUBLIC_UID_KEY) || null;
    }

    setPlayerUid(uid: string) {
        this.localStorage.setItem(PLAYER_UID_KEY, uid);
    }

    setPlayerName(name: string) {
        this.localStorage.setItem(PLAYER_NAME_KEY, name);
    }

    setPlayerPublicUid(uid: string) {
        this.localStorage.setItem(PLAYER_PUBLIC_UID_KEY, uid);
    }
}