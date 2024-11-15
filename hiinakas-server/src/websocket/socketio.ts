import { Server, Socket } from "socket.io";
import { HttpsServer } from "../server/https";
import { Lobbies } from "../lobby/lobbies";
import { User, UserHandler } from "../user/userhandler";
import { SqliteDatabase } from "../db/sqlitedb";
import { Lobby } from "../lobby/lobby";
import {
  LobbyRequest,
  LobbyResponse,
  GameTurnFeedback,
  GameInstanceAction,
  GameInstanceMessageAction,
  LobbyGameRequest,
  LobbyJoinRequest,
  LobbyInviteRequest,
  LobbyInviteResponse,
  LobbyPlayer,
  PublicLobbyPlayer,
} from "#types";
import { v4 } from "uuid";
import webpush from "web-push";

export type PushSub = {
  token: string;
  auth: string;
  endpoint: string;
};

const vapidPublicKey = "BIKn_TwIU9IWFEHCLERc91obtWZNM5lZxkzlf6ICHsm4lcM4oceA7VmlINuYay8wJepC6NluqnlbcVnWGf4OoIs";
const vapidPrivateKey = "bDhVshALM-zRxygrTpYAxyCMtEXAePBke5jQt9MA1e0";

webpush.setVapidDetails(
  "mailto:somepub@gmail.com",
  vapidPublicKey,
  vapidPrivateKey
);

export class SocketIoServer {
  private io: Server;
  private db: SqliteDatabase;
  private socketUsers: Map<string, string> = new Map();
  private lobbies: Lobbies;
  private userHandler: UserHandler;

  constructor(server: HttpsServer, db: SqliteDatabase) {
    this.db = db;
    this.io = new Server(server.getServer(), {
      path: "/v1/hiinakas/",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    this.lobbies = new Lobbies();
    this.userHandler = new UserHandler();
    this.createHandlers();
  }

  private async handleUserConnection(socket: Socket) {
    const userUid = socket.handshake?.query?.userUid as string;
    const publicUid = socket.handshake?.query?.publicUid as string;
    const name = socket.handshake?.query?.name as string;
    let sub = socket.handshake?.query.sub as string;
    
    if(!sub) return socket.disconnect();
    const pushSub = JSON.parse(sub) as PushSubscriptionJSON; 
    
    if (!userUid || !publicUid || !name || this.socketUsers.has(userUid)) {
      return socket.disconnect();
    }

    this.socketUsers.set(userUid, socket.id);
    const user = await this.setupUser(userUid, publicUid, name, pushSub);
    
    this.userHandler.addUser(socket.id, user);
    socket.join(user.publicUid);
    
    this.setupSocketListeners(socket, user);
  }

  private async setupUser(userUid: string, publicUid: string, name: string, pushSub: PushSubscriptionJSON) {
    const userExists = await this.db.getUserExists(userUid);
    if (!userExists) {
      this.db.createUser(userUid, publicUid, name);
    }

    let user = await this.db.getUser(userUid);
    
    if (user?.name !== name) {
      user.name = name;
    }

    if (user?.publicUid !== publicUid) {
      user.publicUid = publicUid;
    }

    user.pushSubscription = pushSub;
    return user;
  }

  private setupSocketListeners(socket: Socket, user: User) {
    socket.on("users/request", () => this.handleUsersRequest(socket));
    socket.on("lobby/request", (message: LobbyJoinRequest) => this.handleLobbyRequest(socket, message));
    socket.on("lobby/connect", (message: LobbyRequest) => this.handleLobbyConnect(socket, message));
    socket.on("lobby/ready", (message: LobbyRequest) => this.handleLobbyReady(socket, message));
    socket.on("lobby/leave", (message: LobbyRequest) => this.handleLobbyLeave(message));
    socket.on("game/turn", (message: LobbyGameRequest) => this.handleGameTurn(socket, message));
    socket.on("disconnect", () => this.handleDisconnect(socket, user.gameUid));
  }

  createHandlers() {
    this.io.on("connection", async (socket: Socket) => {
      await this.handleUserConnection(socket);
    });
  }

  private handleUsersRequest(socket: Socket) {
    const users = this.userHandler.getPublicUsers();
    socket.emit("users/response", users);
  }

  private handleLobbyRequest(socket: Socket, message: LobbyJoinRequest) {
    const req: LobbyInviteRequest = {
      uid: message.uid,
      senderPlayerUid: message.callerPlayerUid,
    };
    this.io.sockets.in(message.requestToPlayerUid).emit("lobby/invite", req);
  }

  private handleLobbyConnect(socket: Socket, message: LobbyRequest) {
    if (!this.lobbies.hasLobby(message.uid)) {
      this.lobbies.addNewLobby(message.uid);
    }
    
    const lobby = this.lobbies.getLobby(message.uid)!;
    const player = this.userHandler.getUser(socket.id)!;
    
    if (!lobby.players.has(player.publicUid)) {
      this.lobbies.addPlayer(message, player.gameUid);
      socket.join(message.uid);
      this.io.sockets.in(message.uid).emit("lobby/player-joined", player);
    }
  }

  private handleLobbyReady(socket: Socket, message: LobbyRequest) {
    if (!this.lobbies.hasLobby(message.uid)) return;
    
    const lobby = this.lobbies.getLobby(message.uid)!;
    const player = this.userHandler.getUser(socket.id)!;
    
    this.lobbies.setPlayerReady(message);
    this.io.sockets.in(message.uid).emit("lobby/player-ready", player);
    
    if (this.lobbies.isLobbyReady(message) && lobby.players.size === 2) {
      const gameState = lobby.startGame();
      this.io.sockets.in(message.uid).emit("game/start", gameState);
    }
  }

  private handleGameTurn(socket: Socket, message: LobbyGameRequest) {
    const lobby = this.lobbies.getLobby(message.uid)!;
    const gameInstance = lobby.gameInstance;
    if (!gameInstance) return;
    
    if (gameInstance?.isMyTurn(message.player.uid)) {
      const currPlayer = gameInstance?.getCurrentPlayer();
      switch (message.action) {
        case GameInstanceAction.PLAY_CARD:
          if (gameInstance?.playCard(message.cardId!)) {
            let gameTurnFeedback: GameTurnFeedback = {
              action: message.action,
              message: {
                type: GameInstanceMessageAction.INFO,
                message: "Card played",
              },
            };
            lobby.generateGameTurn(
              gameTurnFeedback,
              (lobbyGameResponse, player) =>
                this.io
                  .to(player.uid)
                  .emit("game/turn", lobbyGameResponse)
            );
            gameInstance.lookNextTurn(currPlayer);
          } else {
            let gameTurnFeedback: GameTurnFeedback = {
              action: message.action,
              message: {
                type: GameInstanceMessageAction.ERROR,
                message: "Failed to play card",
              },
            };
            lobby.generateGameTurn(
              gameTurnFeedback,
              (lobbyGameResponse, player) =>
                this.io
                  .to(player.uid)
                  .emit("game/turn", lobbyGameResponse)
            );
          }
          break;
        case GameInstanceAction.END_TURN:
          if (gameInstance?.endTurn()) {
            gameInstance?.resetPlayMove();

            if (gameInstance.isWinCondition(currPlayer)) {
              let gameTurnFeedback: GameTurnFeedback = {
                action: message.action,
                message: {
                  type: GameInstanceMessageAction.WIN,
                  message: "Game over",
                },
                hasWon: true,
              };
              lobby.generateGameTurn(
                gameTurnFeedback,
                (lobbyGameResponse, player) =>
                  this.io
                    .to(player.uid)
                    .emit("game/turn", lobbyGameResponse)
              );
            } else {
              let gameTurnFeedback: GameTurnFeedback = {
                action: message.action,
                message: {
                  type: GameInstanceMessageAction.INFO,
                  message: "Turn ended",
                },
              };
              lobby.generateGameTurn(
                gameTurnFeedback,
                (lobbyGameResponse, player) =>
                  this.io
                    .to(player.uid)
                    .emit("game/turn", lobbyGameResponse)
              );
            }
          } else {
            let gameTurnFeedback: GameTurnFeedback = {
              action: message.action,
              message: {
                type: GameInstanceMessageAction.ERROR,
                message: "Failed to end turn",
              },
            };
            lobby.generateGameTurn(
              gameTurnFeedback,
              (lobbyGameResponse, player) =>
                this.io
                  .to(player.uid)
                  .emit("game/turn", lobbyGameResponse)
            );
          }

          break;
        case GameInstanceAction.PICK_UP:
          let gameTurnFeedback: GameTurnFeedback = {
            action: message.action,
            message: {
              type: GameInstanceMessageAction.INFO,
              message: "Cards picked up",
            },
          };
          gameInstance.pickupTurn();
          gameInstance.resetPlayMove();
          gameInstance?.endTurn(true);
          lobby.generateGameTurn(
            gameTurnFeedback,
            (lobbyGameResponse, player) =>
              this.io.to(player.uid).emit("game/turn", lobbyGameResponse)
          );
        default:
          break;
      }
    } else {
      this.io.to(message.player.uid).emit("game/turn", "Not ur turn!");
    }
  }

  private handleLobbyLeave(message: LobbyRequest) {
    if (this.lobbies.hasLobby(message.uid)) {
      this.lobbies.removePlayer(message);
      if (this.lobbies.getLobby(message.uid)!.players.size < 1) {
        this.lobbies.removeLobby(message.uid);
      }
    }
  }

  private handleDisconnect(socket: Socket, userUid: string) {
    this.userHandler.onDisconnect(socket.id);
    this.socketUsers.delete(userUid);
    console.log(`User ${userUid} with Socket ${socket.id} disconnected`);
  }
}
