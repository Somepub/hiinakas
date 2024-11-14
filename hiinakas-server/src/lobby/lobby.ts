import { Instance } from "../game/instance";
import { LobbyPlayer, GameInstanceAction, GameTurnFeedback, LobbyGameResponse } from "#types";

export type InternalLobbyPlayer = LobbyPlayer & { publicUid?: string};

export class Lobby {
  uid: string;
  players: Map<string, InternalLobbyPlayer>;
  maxPlayer: number;
  ready: boolean;
  gameInstance: Instance | null;
  owner: LobbyPlayer | null;

  constructor(uuid: string) {
    this.uid = uuid;
    this.players = new Map();
    this.maxPlayer = 2;
    this.ready = false;
    this.gameInstance = null;
    this.owner = null;
  }

  setOwner(player: InternalLobbyPlayer) {
    this.owner = player;
  }

  getPlayer(player: InternalLobbyPlayer) {
    return this.players.get(player.uid);
  }

  updatePlayer(player: InternalLobbyPlayer) {
    if(this.players.has(player.uid)) {
      this.players = this.players.set(player.uid, player);
    }
  }

  addPlayer(player: InternalLobbyPlayer) {
    this.players.set(player.uid, { ...player });
  }

  removePlayer(player: InternalLobbyPlayer) {
    this.players.delete(player.uid);
  }

  getPlayers(): InternalLobbyPlayer[] {
    return [...this.players.values()];
  }

  startGame(): Instance {
    if (!this.gameInstance) {
      this.gameInstance = new Instance(this.getPlayers());
    }
    return this.gameInstance;
  }

  generateGameTurn(
    feedback: GameTurnFeedback,
    socketCallback: (
      lobbyGameResponse: LobbyGameResponse,
      player: InternalLobbyPlayer
    ) => void
  ) {

    for (const player of [...this.players.values()]) {
      const playerUid = player.uid;
      const gameTurn = this.gameInstance?.generateGameTurn(playerUid, feedback);
      const lobbyGameResponse: LobbyGameResponse = {
        uid: this.uid,
        gameTurn: gameTurn!,
      };
      socketCallback(lobbyGameResponse, player);
    }
  }
}
