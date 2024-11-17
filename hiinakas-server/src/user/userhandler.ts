import { PublicLobbyPlayer } from "#types";
import { SqliteDatabase } from "db/sqlitedb";
import { Socket } from "socket.io";

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
    private socketUsers: Map<string, string> = new Map();
    private db: SqliteDatabase;

    constructor(db: SqliteDatabase, socketUsers: Map<string, string>) {
        this.db = db;
        this.socketUsers = socketUsers;
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
        return this.getUsers().map((user) => ({ uid: user.publicUid, name: user.name }));
    }

    onDisconnect(disconnectedUid: string) {
        this.users.delete(disconnectedUid);
    }

    async handleUserConnection(socket: Socket): Promise<User | undefined> {
        console.log("handleUserConnection", socket.handshake.query);
        const userUid = socket.handshake?.query?.userUid as string;
        const publicUid = socket.handshake?.query?.publicUid as string;
        const name = socket.handshake?.query?.name as string;
        let sub = socket.handshake?.query.sub as string;

        if (!sub) {
           socket.disconnect();
           return undefined;
        }
      

        const pushSub = JSON.parse(sub) as PushSubscriptionJSON;

        console.log("sub", JSON.stringify([...this.socketUsers.values()]));
        console.log("userUid", !userUid);
        console.log("publicUid", !publicUid);
        console.log("name", !name);
        console.log("socketUsers", this.socketUsers.has(userUid));
        console.log("all", !userUid || !publicUid || !name || this.socketUsers.has(userUid));

        if (!userUid || !publicUid || !name || this.socketUsers.has(userUid)) {
            console.log("disconnect??");
            socket.disconnect();
            return undefined;
        }

        console.log("sub2");

        this.socketUsers.set(userUid, socket.id);
        const user = await this.setupUser(userUid, publicUid, name, pushSub);

        this.addUser(socket.id, user);
        socket.join(user.publicUid);
        return user;
    }

    private async setupUser(userUid: string, publicUid: string, name: string, pushSub: PushSubscriptionJSON) {
        console.log("setupUser", userUid, publicUid, name, pushSub);
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
}