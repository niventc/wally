import * as express from 'express';
import * as expressWs from 'express-ws';
import { NoteService } from './note.service';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { WallStore } from './store/wall.store';
import { NoteStore } from './store/note.store';
import { WebSocketClient, ClientService, WebSocketIdentity } from './client.service';
import { UserStore } from './store/user.store';
import { UserConnected, UserLeftWall } from 'wally-contract';
import { LineStore } from './store/line.store';
import { WallController } from './api/wall.controller';
import { WallService } from './wall.services';

export interface Controller {
    router: express.Router;
}

class Server {
    public app: express.Application;

    private clientService = new ClientService();
    private userStore = new UserStore();
    private wallStore = new WallStore();
    private noteStore = new NoteStore();
    private lineStore = new LineStore();

    private wallService = new WallService(this.lineStore, this.noteStore, this.userStore, this.wallStore);

    constructor(
        private port: number
    ) {
        const app = express();

        app.use(express.static("client"));

        const controllers = [new WallController(this.wallService)];

        this.app = this.initializeWebSocket(app);
        this.initializeControllers(this.app, controllers);

        // reserved sub routes
        this.app.get('/api/*', (req, res) => res.sendStatus(404));
        this.app.get('/ws*', (req, res) => res.sendStatus(404));
        // fall through
        this.app.get('*', (req, res) => res.sendFile('./client/index.html', { root: path.resolve() }));
    }

    private initializeControllers(app: express.Application, controllers: Controller[]): void {
        controllers.forEach(controller => {
            app.use('/api', controller.router);
        });
    }

    private initializeWebSocket(app: express.Application): express.Application {
        const wsInstance = expressWs(app);
        const noteService = new NoteService(this.clientService, this.userStore, this.wallStore, this.noteStore, this.lineStore);

        wsInstance.app.ws('/ws', noteService.onWebSocket);

        wsInstance.getWss().on("connection", async (ws, req) => {
            const clientId = (<any>req).query['clientId'];
            const wsc = <WebSocketClient><unknown>ws;
            wsc.identity = new WebSocketIdentity(uuidv4(), clientId);
            this.clientService.addClient(wsc);
            const user = await this.userStore.getOrCreateUser(clientId);
            ws.send(JSON.stringify(new UserConnected(user)));
            console.log("Client connected", wsc.identity);

            ws.onclose = async () => {
                this.clientService.removeClient(wsc);
                
                // Send client left wall... both on page close/refresh and on join new wall
                const wall = await this.wallStore.removeClient(wsc.identity);
                if (wall) {
                    const instances = this.clientService.getInstances(wall[1].map(x => x.uuid));
                    const user = await this.userStore.getOrCreateUser(wsc.identity.clientId);
                    const json = JSON.stringify(new UserLeftWall(wall[0], user.id));
                    instances.forEach(i => {
                        i.send(json);
                    });
                }
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
