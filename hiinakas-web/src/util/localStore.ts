
const PLAYER_UID_KEY = "HplayerUid";
const PLAYER_NAME_KEY = "HplayerName"

export class LocalStore {
    localStorage: Storage;
    publicUid: string = "";
    gameName: string = "";

    constructor() {
        this.localStorage = window.localStorage;
    }

    getPlayerUid(): string {
        return this.localStorage.getItem(PLAYER_UID_KEY) || null;
    }

    getPlayerName(): string {
        return this.localStorage.getItem(PLAYER_NAME_KEY) || null;
    }

    setPlayerUid(uid: string) {
        this.localStorage.setItem(PLAYER_UID_KEY, uid);
    }

    setPlayerName(name: string) {
        this.localStorage.setItem(PLAYER_NAME_KEY, name);
    }
}