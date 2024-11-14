export type LobbyRequest = {
  uid: string;
  player: LobbyPlayer;
};

export type LobbyResponse = {
  uid: string;
  message?: string;
};

export type LobbyPlayer = {
  uid: string;
  name: string;
  ready?: boolean;
};

export type PublicLobbyPlayer = {
  uid: string;
  name: string;
  ready?: boolean;
  owner?: boolean;
};

export type LobbyJoinRequest = {
  uid: string;
  callerPlayerUid: string;
  requestToPlayerUid: string;
}

export type LobbyInviteRequest = {
  uid: string;
  senderPlayerUid: string;
}

export type LobbyInviteResponse = {
  uid: string;
  senderPlayerUid: string;
  requestToPlayerUid: string;
  result: boolean;
};

export type LobbyMaxPlayerChange = LobbyRequest & {
  maxPlayers: number;
};
