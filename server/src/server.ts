import * as express from 'express';
import * as expressWs from 'express-ws';
import * as http from 'http';

class Server {
    public app: express.Application;

    constructor(
        private port: number
    ) {
        const app = express();

        app.get('/', function (req, res) {
            res.send('Hello World!');
        });

        this.app = app;
    }

    public listen(): void {
        this.app.listen(this.port, () => {
            console.log(`Listening on port ${this.port}`);
        });
    }
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000; 
new Server(port).listen();
