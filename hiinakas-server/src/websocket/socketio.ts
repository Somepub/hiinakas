import { Server, Socket } from "socket.io";
import { HttpsServer } from "../server/https";
import { Lobbies } from "../lobby/lobbies";
import { UserHandler } from "../user/userhandler";
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

  createHandlers() {
    this.io.on("connection", async (socket: Socket) => {
      const userUid = socket.handshake?.query?.userUid as string;
      const publicUid = socket.handshake?.query?.publicUid as string;
      const name = socket.handshake?.query?.name as string;
      let sub = socket.handshake?.query.sub as string;
      if(!sub) return socket.disconnect();
      const pushSub = JSON.parse(sub) as PushSubscriptionJSON; 
      
      if (
        !userUid ||
        !publicUid ||
        !name ||
        this.socketUsers.has(userUid)
      ) {
        return socket.disconnect();
      }
      this.socketUsers.set(userUid, socket.id);
      //console.log(this.socketUsers, this.lobbies);
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

      this.userHandler.addUser(socket.id, user);
      socket.join(user.publicUid);

      socket.on("users/request", () => {
        const users = this.userHandler.getPublicUsers();
        socket.emit("users/response", users);
      });

      socket.on("lobby/request", (message: LobbyJoinRequest) => {
        const req: LobbyInviteRequest = {
          uid: message.uid,
          senderPlayerUid: message.callerPlayerUid,
        };
        console.log("lobby req", message);

        this.io.sockets
          .in(message.requestToPlayerUid)
          .emit("lobby/invite", req);

        /*const payload = JSON.stringify({ title: "Gamerequest", body: `Gamerequest from ${message.callerPlayerUid}` });
        const user = this.userHandler.getUsers().find( user => user.publicUid === message.requestToPlayerUid);

        const sendPushSub = {
          endpoint: user?.pushSubscription?.endpoint!,
          keys: {
              p256dh: user?.pushSubscription?.keys!["p256dh"]!,
              auth: user?.pushSubscription.keys!["auth"]!
          }
         };
        webpush.sendNotification(sendPushSub, payload);*/
      });

      socket.on("lobby/leave", async (message: LobbyRequest) => {
        if (this.lobbies.hasLobby(message.uid)) {
          this.lobbies.removePlayer(message);
          if (this.lobbies.getLobby(message.uid)!.players.size < 1) {
            this.lobbies.removeLobby(message.uid);
            // TODO:: LobbyResponse
          }
        }
      });

      socket.on("lobby/invite", (message: LobbyInviteResponse) => {
        this.io.sockets
          .in(message.senderPlayerUid)
          .emit("lobby/invite_response", message);
      });

      socket.on("lobby/connect", async (message: LobbyRequest) => {
        let lobby: Lobby;
        console.debug("Player joined: ", message.player.uid, socket.id);
        if (!this.lobbies.hasLobby(message.uid)) {
          lobby = this.lobbies.addNewLobby(message.uid);
          lobby.setOwner(message.player);
        } else {
          lobby = this.lobbies.getLobby(message.uid)!;
        }

        this.lobbies.addPlayer(message, user.publicUid);
        socket.join(message.uid);
        socket.join(message.player.uid);

        this.io.sockets.in(message.uid).emit("lobby/connect", message.uid); // TODO:: LobbyResponse

        const lobbyPlayers: PublicLobbyPlayer[] = lobby
          .getPlayers()
          .map((player) => ({
            uid: player.publicUid!,
            name: player.name,
            ready: player.ready,
            owner: lobby.owner?.uid === player.uid,
          }));
        this.io.sockets.in(message.uid).emit("lobby/status", lobbyPlayers);
      });

      socket.on("lobby/ready", (message: LobbyRequest) => {
        const lobby = this.lobbies.getLobby(message.uid)!;
        lobby.updatePlayer(message.player);
        this.io.sockets
          .in(message.uid)
          .emit("lobby/status", lobby.getPlayers());
      });

      socket.on("lobby/start", (message: LobbyRequest) => {
        console.log(this.lobbies.isLobbyReady(message), message);
        if (this.lobbies.isLobbyReady(message)) {
          const lobby = this.lobbies.getLobby(message.uid)!;

          if (lobby.owner?.uid !== message.player.uid) return;

          const gameInstance = lobby.startGame();
          console.debug(
            "Game ready: ",
            message.uid,
            gameInstance.uid,
            message.player
          );

          if (!gameInstance?.getInitInstance()) {
            console.debug("Game init.");
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
                console.debug("Game turn: ", player);
                this.io.to(player.uid).emit("game/turn", lobbyGameResponse);
              }
            );
            gameInstance.initInstance();
          }
        } else {
          socket.emit("lobby/start", {
            uid: message.uid,
            message: "Waiting players...",
          });
          return;
        }
      });

      socket.on("game/turn", (message: LobbyGameRequest) => {
        const lobby = this.lobbies.getLobby(message.uid);
        if (lobby) {
          const gameInstance = lobby?.gameInstance;
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
      });

      socket.on("disconnect", () => {
        this.userHandler.onDisconnect(socket.id);
        this.socketUsers.delete(userUid);
        console.log(`User ${userUid} with Socket ${socket.id} disconnected`);
      });
    });
  }
}
