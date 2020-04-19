import * as express from 'express';
import * as expressWs from 'express-ws';
import { NoteService } from './note.service';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { WallStore } from './store/wall.store';
import { NoteStore } from './store/note.store';
import { WebSocketClient, ClientService, WebSocketIdentity } from './client.service';
import { UserStore } from './store/user.store';
import { UpdateUser, UserConnected } from 'wally-contract';

class Server {
    public app: express.Application;

    private clientService = new ClientService();
    private userStore = new UserStore();
    private wallStore = new WallStore();
    private noteStore = new NoteStore();

    constructor(
        private port: number
    ) {
        const app = express();

        app.use(express.static("client"));

        this.app = this.initializeWebSocket(app);

        // fall through
        this.app.get('*', (req, res) => res.sendFile('./client/index.html', { root: path.resolve() }));
    }

    private initializeWebSocket(app: express.Application): express.Application {
        const wsInstance = expressWs(app);
        const noteService = new NoteService(this.clientService, this.userStore, this.wallStore, this.noteStore);

        wsInstance.app.ws('/ws', noteService.onWebSocket);

        wsInstance.getWss().on("connection", async (ws, req) => {
            const clientId = (<any>req).query['clientId'];
            const wsc = <WebSocketClient><unknown>ws;
            wsc.identity = new WebSocketIdentity(uuidv4(), clientId);
            this.clientService.addClient(wsc);
            const user = await this.userStore.getOrCreateUser(clientId);
            ws.send(JSON.stringify(new UserConnected(user)));
            console.log("Client connected", wsc.identity);

            ws.onclose = () => {
                this.clientService.removeClient(wsc);
                this.wallStore.removeClient(wsc.identity);
                // TODO send client left wall... both on page close/refresh and on join new wall
                console.log(`Client disconnected`, wsc.identity);
            };
        });

        return wsInstance.app;
    }

    public listen(): void {
        this.app.listen(this.port, () => {
            console.log(`Listening on port ${this.port}`);
        });
    }
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000; 
new Server(port).listen();
