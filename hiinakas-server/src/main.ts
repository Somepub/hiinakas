import { SqliteDatabase } from "./db/sqlitedb";
import { HttpServer } from "./server/http";
import {SocketIoServer} from "./websocket/socketio";

( () => {
    console.log("Starting server...")
    const PORT = 3000;
    const httpServer = new HttpServer();
    const db = new SqliteDatabase();
    httpServer
        .getServer()
        .listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    new SocketIoServer(httpServer, db);
})();