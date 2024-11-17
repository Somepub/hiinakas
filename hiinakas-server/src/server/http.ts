import http from "http";
import cors from "cors";
import express from "express";
  
export class HttpServer {
    private server: http.Server;
    constructor() {
        const app = express();
        this.server = http.createServer({}, app);
        app.use(cors());
    }

    getServer() {
        return this.server;
    }
}

