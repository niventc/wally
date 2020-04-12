import * as express from 'express';
import * as expressWs from 'express-ws';
import { NoteService } from './note.service';

class Server {
    public app: express.Application;

    constructor(
        private port: number
    ) {
        const app = express();

        app.get('/', function (req, res) {
            res.send('Hello World!');
        });

        this.app = this.initializeWebSocket(app);
    }

    private initializeWebSocket(app: express.Application): express.Application {
        const wsInstance = expressWs(app);
        const noteService = new NoteService(wsInstance);

        wsInstance.app.ws('/ws', noteService.onWebSocket);

        wsInstance.getWss().on("connection", (ws, req) => {
            console.log("connected");
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
