import { PublicLobbyPlayer } from "#types";

export type User = {
    userUid: string;
    gameUid: string;
    publicUid: string;
    name: string;
    createdAt: string;
    friends: string;
    friendsRequests: string;
    pushSubscription: PushSubscriptionJSON;
}

export class UserHandler {
    private users: Map<string, User> = new Map();

    constructor() {
    }

    addUser(id: string, user: User) {
        this.users.set(id, user);
    }

    getUser(id: string) {
        return this.users.get(id);
    }

    getUsers(): User[] {
        return [...this.users.values()];
    }

    getPublicUsers(): PublicLobbyPlayer[] {
        return this.getUsers().map((user) => ({uid: user.publicUid, name: user.name, createdAt: user.createdAt}));
    }

    onDisconnect(disconnectedUid: string) {
        this.users.delete(disconnectedUid);
    }
}