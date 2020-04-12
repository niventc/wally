import { WebsocketRequestHandler } from "express-ws";
import { Message, NewNote, MoveNote, UpdateNoteText, SelectNote } from "wally-contract";
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

                case MoveNote.name:
                    const moveNote = message as MouseEvent;
                    this.wsInstance.getWss().clients.forEach(x => x.send(JSON.stringify(moveNote)));                    
                    break;

                case UpdateNoteText.name:
                    const updateNoteText = message as UpdateNoteText;
                    this.wsInstance.getWss().clients.forEach(x => x.send(JSON.stringify(updateNoteText)));
                    break;

                case SelectNote.name:
                    const selectNote = message as SelectNote;
                    this.wsInstance.getWss().clients.forEach(x => x.send(JSON.stringify(selectNote)));
                    break;

            }


        });

    }

}