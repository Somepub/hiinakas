import { Server, Socket } from "socket.io";
import { Lobbies } from "lobby/lobbies";
import {
  GameInstanceAction,
  GameTurnFeedback,
  GameInstanceMessageAction,
  LobbyGameRequest,
} from "#types";
import { InternalLobbyPlayer, Lobby } from "lobby/lobby";
import { Instance } from "./instance";
import { Player } from "./player";

export class GameHandler {
  private io: Server;
  private lobbies: Lobbies;
  private socket: Socket;

  constructor(io: Server, lobbies: Lobbies, socket: Socket) {
    this.io = io;
    this.lobbies = lobbies;
    this.socket = socket;
  }

  handleGameTurn(message: LobbyGameRequest) {
    if (!message) return;

    if (!message.uid && !message.player?.uid && !message.action) return;

    const lobby = this.lobbies.getLobby(message.uid)!;
    const gameInstance = lobby.gameInstance;
    if (!gameInstance) return;

    if (gameInstance?.isMyTurn(message.player.uid)) {
      const currPlayer = gameInstance?.getCurrentPlayer();
      switch (message.action) {
        case GameInstanceAction.PLAY_CARD:
          this.playCard(message, gameInstance, lobby, currPlayer);
          break;
        case GameInstanceAction.END_TURN:
          this.endTurn(message, gameInstance, lobby, currPlayer);
          break;
        case GameInstanceAction.PICK_UP:
          this.pickupTurn(message, gameInstance, lobby);
          break;
        default:
          break;
      }
    } else {
      this.io.to(message.player.uid).emit("game/turn", "Not ur turn!");
    }
  }

  private playCard(
    message: LobbyGameRequest,
    gameInstance: Instance,
    lobby: Lobby,
    currPlayer: Player
  ) {
    if (gameInstance?.playCard(message.cardId!)) {
      let gameTurnFeedback: GameTurnFeedback = {
        action: message.action,
        message: {
          type: GameInstanceMessageAction.INFO,
          message: "Card played",
        },
      };
      lobby.generateGameTurn(gameTurnFeedback, (lobbyGameResponse, player) =>
        this.io.to(player.uid).emit("game/turn", lobbyGameResponse)
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
      lobby.generateGameTurn(gameTurnFeedback, (lobbyGameResponse, player) =>
        this.io.to(player.uid).emit("game/turn", lobbyGameResponse)
      );
    }
  }

  private endTurn(
    message: LobbyGameRequest,
    gameInstance: Instance,
    lobby: Lobby,
    currPlayer: Player
  ) {
    if (gameInstance.isWinCondition(currPlayer)) {
      let gameTurnFeedback: GameTurnFeedback = {
        action: message.action,
        message: {
          type: GameInstanceMessageAction.WIN,
          message: "Game over",
        },
        hasWon: true,
      };
      lobby.generateGameTurn(gameTurnFeedback, (lobbyGameResponse, player) =>
        this.io.to(player.uid).emit("game/turn", lobbyGameResponse)
      );
      this.lobbies.endGame(message);
    }
    if (gameInstance?.endTurn()) {
      let gameTurnFeedback: GameTurnFeedback = {
        action: message.action,
        message: {
          type: GameInstanceMessageAction.INFO,
          message: "Turn ended",
        },
      };
      lobby.generateGameTurn(gameTurnFeedback, (lobbyGameResponse, player) =>
        this.io.to(player.uid).emit("game/turn", lobbyGameResponse)
      );
    } else {
      let gameTurnFeedback: GameTurnFeedback = {
        action: message.action,
        message: {
          type: GameInstanceMessageAction.ERROR,
          message: "Failed to end turn",
        },
      };
      lobby.generateGameTurn(gameTurnFeedback, (lobbyGameResponse, player) =>
        this.io.to(player.uid).emit("game/turn", lobbyGameResponse)
      );
    }
  }

  private pickupTurn(
    message: LobbyGameRequest,
    gameInstance: Instance,
    lobby: Lobby
  ) {
    if (gameInstance.turnMoves < 1) {
      let gameTurnFeedback: GameTurnFeedback = {
        action: message.action,
        message: {
          type: GameInstanceMessageAction.INFO,
          message: "Cards picked up",
        },
      };
      gameInstance.pickupTurn();
      gameInstance?.endTurn(true);
      lobby.generateGameTurn(gameTurnFeedback, (lobbyGameResponse, player) =>
        this.io.to(player.uid).emit("game/turn", lobbyGameResponse)
      );
    }
  }
}
