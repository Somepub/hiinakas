import { LobbyPlayer } from "./lobby";
import { CardJson, FloorCardJson, HiddenCardJson } from "./card";

export enum GameInstanceAction {
  INIT,
  PLAY_CARD,
  END_TURN,
  PICK_UP,
}

export enum GameInstanceMessageAction {
  ERROR,
  INFO,
  WIN
}

export type LobbyGameRequest = {
  uid: string;
  player: LobbyPlayer;
  action: GameInstanceAction;
  cardId?: string;
};

export type LobbyGameResponse = {
  uid: string;
  gameTurn: GameTurn;
};

export type GameInstanceMessage = {
  type: GameInstanceMessageAction;
  message: string;
}

export type GameTurnFeedback = {
  action: GameInstanceAction,
  message: GameInstanceMessage,
  hasWon?: boolean;
}

export type PlayerStatus = {
  uidHash: string;
  name: string;
  handCards: CardJson[];
  floorCards: FloorCardJson[];
  hiddenCards: HiddenCardJson[];
};

export type OpponentPlayerStatus = {
  name: string;
  handCards: HiddenCardJson[];
  floorCards: FloorCardJson[];
  hiddenCards: HiddenCardJson[];
};

export type GameTurnStatus = {
  playerStatus: PlayerStatus;
  otherPlayers: OpponentPlayerStatus[];
};

export type GameTurnPlayer = {
  name: string;
  uidHash: string;
  action: GameInstanceAction;
  message: GameInstanceMessage;
};

export type GameTurn = {
  gameTurnStatus: GameTurnStatus;
  gameTurnPlayer: GameTurnPlayer;
  gameTurnTable: CardJson[];
  gameTurnDeck: HiddenCardJson[];
  gameTurnWinner?: GameWin | null;
};

export type GameWin = {
  winnerUidHash: string;
}
