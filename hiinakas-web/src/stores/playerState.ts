import { makeAutoObservable } from "mobx";
import { LocalStore } from "../util/localStore";
import { PublicLobbyPlayer } from "@types";

export class PlayerState {
  publicUid: string;
  name: string;
  userUid: string = null!;
  users: PublicLobbyPlayer[] = [];

  constructor(localStore: LocalStore) {
    this.publicUid = localStore.getPublicUid();
    this.name = localStore.getGameName();
    makeAutoObservable(this);
  }

  setName(newName: string) {
    this.name = newName;
  }

  setUserUid(userUid: string) {
    this.userUid = userUid.split("|")[1];
  }

  setUsers(newUsers: PublicLobbyPlayer[]) {
    this.users = newUsers.filter(user => user.uid !== this.publicUid);
  }
} 