import { makeAutoObservable } from "mobx";
import { LocalStore } from "../util/localStore";
import { PublicLobbyPlayer } from "@proto/lobby";

export class PlayerState {
  publicUid: string;
  name: string;
  uid: string = null!;
  users: PublicLobbyPlayer[] = [];
  localStore: LocalStore;

  constructor(localStore: LocalStore) {
    this.uid = localStore.getPlayerUid();
    this.name = localStore.getPlayerName();
    this.publicUid = localStore.getPlayerPublicUid();
    this.localStore = localStore;

    makeAutoObservable(this);
  }

  setName(newName: string) {
    this.name = newName;
    this.localStore.setPlayerName(newName);
  }

  setUid(uid: string) {
    this.uid = uid;
    this.localStore.setPlayerUid(uid);
  }

  setPublicUid(uid: string) {
    this.publicUid = uid;
    this.localStore.setPlayerPublicUid(uid);
  }
}
