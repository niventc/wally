import { WebsocketRequestHandler } from "express-ws";
import { Message, NewNote, MoveNote, UpdateNoteText, SelectNote, CreateWall, JoinWall, WallState, WallyError, UpdateUser } from "wally-contract";
import expressWs = require('express-ws');
import { NoteStore } from './store/note.store';
import { WallStore } from './store/wall.store';

export class NoteService {

    constructor(
        private wallStore: WallStore,
        private noteStore: NoteStore,
        private wsInstance: expressWs.Instance
    ) {}

    public onWebSocket: WebsocketRequestHandler = (ws, req, next): void => {
        ws.on('message', async (data: string) => {
            console.log(data);

            const message = JSON.parse(data) as Message;
            
            switch (message.type) {
                case UpdateUser.name:
                    // TODO store some user state here
                    ws.send(JSON.stringify(message));
                    break;

                case CreateWall.name:
                    const createWall = message as CreateWall;
                    if (await this.wallStore.doesWallExist(createWall.name)) {
                        const createError = `Wall with name '${createWall.name}' already exists`;
                        console.error(createError);
                        ws.send(JSON.stringify(new WallyError(createError)))
                    } else {
                        const wall = await this.wallStore.createWall(createWall.name);
                        // TODO add user
                        ws.send(JSON.stringify(new WallState(wall.name, [], [])));
                    }
                    break;

                case JoinWall.name:
                    const joinWall = message as JoinWall;
                    const joinedWall = await this.wallStore.getWall(joinWall.name);
                    if (joinedWall === null) {
                        const joinError = `Wall with name '${joinWall.name}' does not exist`;
                        console.error(joinError);
                        ws.send(JSON.stringify(new WallyError(joinError)))
                    } else {                   
                        const notes = await this.noteStore.getNotes(joinedWall.notes);     
                        // TODO add user
                        ws.send(JSON.stringify(new WallState(joinedWall.name, notes, [])));
                    }
                    break;

                case NewNote.name:
                    const newNote = message as NewNote;
                    this.noteStore.addNote(newNote.note);
                    this.wallStore.addNote(newNote.wallName, newNote.note._id);
                    // TODO limit to wall users
                    this.wsInstance.getWss().clients.forEach(x => x.send(JSON.stringify(newNote)));
                    break;

                case MoveNote.name:
                    const moveNote = message as MoveNote;
                    this.noteStore.updateNote(moveNote.noteId, { x: moveNote.x, y: moveNote.y });
                    // TODO limit to wall users
                    //const moveWall = this.wallStore.getWall(moveNote.wallName);
                    this.wsInstance.getWss().clients.forEach(x => x.send(JSON.stringify(moveNote)));                    
                    break;

                case UpdateNoteText.name:
                    const updateNoteText = message as UpdateNoteText;
                    this.noteStore.updateNote(updateNoteText.noteId, { text: updateNoteText.text });
                    // TODO limit to wall users
                    //const textWall = this.walls.get(updateNoteText.wallId);
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