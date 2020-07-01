import * as express from 'express';
import { Controller } from 'src/server';
import { WallService } from 'src/wall.services';

export class WallController implements Controller {
    public router = express.Router(); 

    constructor(
        private wallService: WallService
    ) {
        this.router.get("/walls", this.getWalls.bind(this));
        this.router.get("/wall/:name", this.getWall.bind(this));
    }

    public async getWalls(request: express.Request, response: express.Response): Promise<void> {
        response.send(await this.wallService.getWalls());
    }

    public async getWall(request: express.Request, response: express.Response): Promise<void> {
        const wallName = request.params["name"] as string;
        if (wallName) {
            response.json(await this.wallService.getWall(wallName));
        } else {
            response.sendStatus(404);
        }
    }

}