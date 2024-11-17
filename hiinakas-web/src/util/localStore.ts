import { makeAutoObservable} from "mobx";
import { v4 } from "uuid";

const PUBLIC_UID_KEY = "HpublicUid";
const GAME_NAME_KEY = "HgameName"

export class LocalStore {
    localStorage: Storage;
    publicUid: string = "";
    gameName: string = "";

    constructor() {
        this.localStorage = window.localStorage;
        this.publicUid = this.getPublicUid();
        this.gameName = this.getGameName();

        if(!this.publicUid) {
            this.setPublicUid(v4());
        }

    }

    getPublicUid(): string {
        if(!this.publicUid) {
            const item = this.localStorage.getItem(PUBLIC_UID_KEY);
            this.publicUid = item ? item : "";
            return item ? item : "";
        }
        return this.publicUid;
    }

    getGameName(): string {
        if(!this.gameName) {
            const item = this.localStorage.getItem(GAME_NAME_KEY);
            this.gameName = item ? item : "";
            return item ? item : "";
        }
        return this.gameName;
    }

    setPublicUid(uid: string) {
        this.localStorage.setItem(PUBLIC_UID_KEY, uid);
        this.publicUid = uid;
    }

    setGameName(name: string) {
        this.localStorage.setItem(GAME_NAME_KEY, name);
        this.gameName = name;
    }
}