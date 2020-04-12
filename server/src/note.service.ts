import { WebsocketRequestHandler } from "express-ws";
import { Message, NewNote } from "wally-contract";
import expressWs = require('express-ws');

export class NoteService {

    constructor(
        private wsInstance: expressWs.Instance
    ) {}

    public onWebSocket: WebsocketRequestHandler = (ws, req, next): void => {

        ws.on('message', (data: string) => {
            console.log(data);

            const message = JSON.parse(data) as Message;

            switch (message.type) {
                case NewNote.name:
                    const newNote = message as NewNote;
                    this.wsInstance.getWss().clients.forEach(x => x.send(JSON.stringify(newNote)));
                    break;

            }


        });

    }

}