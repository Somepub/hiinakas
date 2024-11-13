import https from "https";
import http from "http";
import fs from "fs";
import cors from "cors";
import express from "express";

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: 'CCJFmLq7L1HX6u1FNd2nEtuitwtEcKZIoe2npFVPFEJClhapCJgxnbxt6kA_Cy86',
    baseURL: 'https://godhaze.com',
    clientID: '9dytCQoNRAhlL1MiYGiiNnvXe3180C3g',
    issuerBaseURL: 'https://dev-8oswwsjelji5ur0z.us.auth0.com'
  };
  
export class HttpsServer {
    private server: http.Server;//https.Server;
    constructor() {
        const app = express();
        
        /*this.server = https.createServer({
            key: fs.readFileSync('./godhaze.key'),
            cert: fs.readFileSync('./godhaze_com.crt')
        }, app);*/
        this.server = http.createServer({}, app);
        //app.use(auth(config));
        app.use(cors());
    }

    getServer() {
        return this.server;
    }
}

