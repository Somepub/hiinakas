import { Server, Socket } from "socket.io";
import { HttpServer } from "../server/http";
import { Lobbies } from "../lobby/lobbies";
import { User, UserHandler } from "../user/userhandler";
import { SqliteDatabase } from "../db/sqlitedb";
import {
  LobbyRequest,
  LobbyGameRequest,
  LobbyJoinRequest,
} from "#types";
import webpush from "web-push";
import { LobbyHandler } from "../lobby/lobbyhandler";
import { GameHandler } from "../game/gamehandler";
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

  constructor(server: HttpServer, db: SqliteDatabase) {
    this.db = db;
    this.io = new Server(server.getServer(), {
      path: "/v1/hiinakas/",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    this.lobbies = new Lobbies();
    this.userHandler = new UserHandler(this.db, this.socketUsers);
    this.createHandlers();
  }

  private setupSocketListeners(socket: Socket, user: User) {
    const lobbyHandler = new LobbyHandler(this.io, this.lobbies, this.userHandler, socket);
    const gameHandler = new GameHandler(this.io, this.lobbies, socket);

    socket.on("users/request", () => lobbyHandler.handleUsersRequest());
    socket.on("lobby/request", (message: LobbyJoinRequest) => lobbyHandler.handleLobbyRequest(message));
    socket.on("lobby/connect", (message: LobbyRequest) => lobbyHandler.handleLobbyConnect(message));
    socket.on("lobby/ready", (message: LobbyRequest) => lobbyHandler.handleLobbyReady(message));
    socket.on("lobby/start", (message: LobbyRequest) => lobbyHandler.handleLobbyStart(message));
    socket.on("lobby/leave", (message: LobbyRequest) => lobbyHandler.handleLobbyLeave(message));
    socket.on("game/turn", (message: LobbyGameRequest) => gameHandler.handleGameTurn(message));
    socket.on("disconnect", () => this.handleDisconnect(socket, user.userUid));
  }

  createHandlers() {
    this.io.on("connection", async (socket: Socket) => {
      const user = await this.userHandler.handleUserConnection(socket);
      if (user) {
        this.setupSocketListeners(socket, user);
      }
    });
  }

  private handleDisconnect(socket: Socket, userUid: string) {
    this.userHandler.onDisconnect(socket.id);
    this.socketUsers.delete(userUid);
    socket.disconnect(true);
    console.log(`User ${userUid} with Socket ${socket.id} disconnected`);
  }
}
