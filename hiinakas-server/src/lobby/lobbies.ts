import { Lobby } from "./lobby";
import { LobbyGameRequest, LobbyRequest } from "#types";

export class Lobbies {
  lobbiesPool: Map<string, Lobby>;

  constructor() {
    this.lobbiesPool = new Map();
  }

  addNewLobby(uid: string): Lobby {
    const newLobby = new Lobby(uid);
    this.lobbiesPool.set(uid, newLobby);
    return newLobby;
  }

  getLobby(lobbyId: string): Lobby | undefined {
    return this.lobbiesPool.get(lobbyId);
  }

  removeLobby(lobbyId: string) {
    this.lobbiesPool.delete(lobbyId);
  }

  hasLobby(lobbyId: string): boolean {
    return this.lobbiesPool.has(lobbyId);
  }

  addPlayer(lobbyRequest: LobbyRequest, publicUid: string) {
    const lobby = this.getLobby(lobbyRequest.uid);
    
    if(lobby?.owner?.uid === lobbyRequest.player.uid) {
      lobby?.addPlayer({...lobbyRequest.player, publicUid, ready: true});
    }
    else {
      lobby?.addPlayer({...lobbyRequest.player, publicUid});
    }
  }

  removePlayer(lobbyRequest: LobbyRequest) {
    const lobby = this.getLobby(lobbyRequest.uid);
    lobby?.removePlayer(lobbyRequest.player);
  }

  setPlayerReady(lobbyRequest: LobbyRequest) {
    const lobby = this.getLobby(lobbyRequest.uid);
    lobbyRequest.player.ready = true;
    lobby?.updatePlayer(lobbyRequest.player);
  }

  isLobbyReady(lobbyRequest: LobbyRequest) {
    const lobby = this.getLobby(lobbyRequest.uid);
    return lobby?.players?.size === lobby?.maxPlayer && lobby?.getPlayers().every(player => player.ready);
  }

  endGame(lobbyRequest: LobbyGameRequest) {
    this.removeLobby(lobbyRequest.uid);
  }
}
