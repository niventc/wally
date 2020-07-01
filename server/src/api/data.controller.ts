import * as express from 'express';
import { Controller } from 'src/server';
import { DataStore } from 'src/store/data.store';

export class DataController implements Controller {
    public router = express.Router(); 

    constructor(
        private dataStore: DataStore
    ) {
        this.router.get("/data/:id", this.getData.bind(this));
    }

    public async getData(request: express.Request, response: express.Response): Promise<void> {
        const id = request.params["id"] as string;
        if (id) {
            const data = await this.dataStore.getItem(id);
            if (data.data.startsWith("data:image")) {
                // data:image/jpeg;base64,<data>
                const parts = data.data.split(",");
                const type = parts[0].split(";")[0];
                const image = Buffer.from(parts[1], "base64");
                response.writeHead(200, {
                    'Content-Type': type,
                    'Content-Length': image.length
                });
                response.end(image);
            } else {
                response.send(data.data);
            }
        } else {
            response.sendStatus(404);
        }
    }
}
