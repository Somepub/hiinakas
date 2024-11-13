import { SqliteDatabase } from "./db/sqlitedb";
import { HttpsServer } from "./server/https";
import {SocketIoServer} from "./websocket/socketio";

( () => {
    console.log("Starting server...")
    const PORT = 3000;
    const https = new HttpsServer();
    const db = new SqliteDatabase();
    https.getServer().listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
    new SocketIoServer(https, db);
})();