import { LobbyRequest, PublicLobbyPlayer, LobbyJoinRequest, LobbyInviteRequest, GameTurnFeedback, GameInstanceAction, GameInstanceMessageAction } from "#types";
import { Lobby } from "./lobby";
import { UserHandler } from "user/userhandler";
import { Lobbies } from "./lobbies";
import { Server, Socket } from "socket.io";

export class LobbyHandler {
    private io: Server;
    private lobbies: Lobbies;
    private userHandler: UserHandler;
    private socket: Socket;

    constructor(io: Server, lobbies: Lobbies, userHandler: UserHandler, socket: Socket) {
        this.io = io;
        this.lobbies = lobbies;
        this.userHandler = userHandler;
        this.socket = socket;
    }

    handleLobbyConnect(message: LobbyRequest) {
        if (!message) return;

        if (!message.uid && !message.player?.uid) return;

        console.debug("Player joined: ", message.player.uid, this.socket.id);
        let lobby: Lobby;

        if (!this.lobbies.hasLobby(message.uid)) {
            lobby = this.lobbies.addNewLobby(message.uid);
            lobby.setOwner(message.player);
        } else {
            lobby = this.lobbies.getLobby(message.uid)!;
        }

        const handlerUser = this.userHandler.getUser(this.socket.id);
        this.lobbies.addPlayer(message, handlerUser?.publicUid!);
        this.socket.join(message.uid);
        this.socket.join(message.player.uid);

        this.io.sockets.in(message.uid).emit("lobby/connect", message.uid);

        const lobbyPlayers: PublicLobbyPlayer[] = lobby
            .getPlayers()
            .map((player) => {
                return {
                    uid: player.publicUid!,
                    name: player.name,
                    ready: player.ready,
                    owner: lobby.owner?.uid === player.uid,
                };
            }
            );
        this.io.sockets.in(message.uid).emit("lobby/status", lobbyPlayers);
    }

    handleUsersRequest() {
        const users = this.userHandler.getPublicUsers();
        this.socket.emit("users/response", users);
    }

    handleLobbyRequest(message: LobbyJoinRequest) {
        if (!message) return;

        if (!message.uid && !message.callerPlayerUid && !message.requestToPlayerUid) return;

        const req: LobbyInviteRequest = {
            uid: message.uid,
            senderPlayerUid: message.callerPlayerUid,
        };

        this.io.sockets
            .in(message.requestToPlayerUid)
            .emit("lobby/invite", req);
    }

    handleLobbyStart(message: LobbyRequest) {
        if (!message) return;

        if (!message.uid && !message.player?.uid) return;

        if (this.lobbies.isLobbyReady(message)) {
            const lobby = this.lobbies.getLobby(message.uid)!;

            if (lobby.owner?.uid !== message.player.uid) return;

            const gameInstance = lobby.startGame();

            if (!gameInstance?.getInitInstance()) {
                console.debug("Game init.", gameInstance);
                let gameTurnFeedback: GameTurnFeedback = {
                    action: GameInstanceAction.INIT,
                    message: {
                        type: GameInstanceMessageAction.INFO,
                        message: "Game started!",
                    },
                };
                lobby.generateGameTurn(
                    gameTurnFeedback,
                    (lobbyGameResponse, player) => {
                        this.io.to(player.uid).emit("game/turn", lobbyGameResponse);
                    }
                );
                gameInstance.initInstance();
            }
        } else {
            this.socket.emit("lobby/start", {
                uid: message.uid,
                message: "Waiting players...",
            });
            return;
        }
    }

    handleLobbyReady(message: LobbyRequest) {
        if (!message) return;

        if (!message.uid && !message.player?.uid) return;

        const lobby = this.lobbies.getLobby(message.uid)!;
        lobby.updatePlayer(message.player);
        this.io.sockets
            .in(message.uid)
            .emit("lobby/status", lobby.getPlayers());
    }

    handleLobbyLeave(message: LobbyRequest) {
        if (!message) return;

        if (!message.uid && !message.player?.uid) return;

        if (this.lobbies.hasLobby(message.uid)) {
          this.lobbies.removePlayer(message);
          if (this.lobbies.getLobby(message.uid)!.players.size < 1) {
            this.lobbies.removeLobby(message.uid);
          }
        }
    }
}