import { WebsocketRequestHandler } from "express-ws";
import { Message, NewNote, MoveNote, UpdateNoteText, SelectNote, Wall, CreateWall, JoinWall, Note, User, WallState, WallyError, UpdateUser } from "wally-contract";
import expressWs = require('express-ws');

export class NoteService {

    private walls = new Map<string, Wall>();

    constructor(
        private wsInstance: expressWs.Instance
    ) {}

    public onWebSocket: WebsocketRequestHandler = (ws, req, next): void => {
        ws.on('message', (data: string) => {
            console.log(data);

            const message = JSON.parse(data) as Message;
            
            switch (message.type) {
                case UpdateUser.name:
                    // TODO store some user state here
                    ws.send(JSON.stringify(message));
                    break;

                case CreateWall.name:
                    const createWall = message as CreateWall;
                    if (this.walls.has(createWall.wallId)) {
                        const createError = `Wall with id '${createWall.wallId}' already exists`;
                        console.error(createError);
                        ws.send(JSON.stringify(new WallyError(createError)))
                    } else {
                        const wall = new Wall(createWall.wallId, new Array<Note>(), new Array<User>());
                        this.walls.set(createWall.wallId, wall);
                        // TODO add user
                        ws.send(JSON.stringify(new WallState(wall)));
                    }
                    break;

                case JoinWall.name:
                    const joinWall = message as JoinWall;
                    if (!this.walls.has(joinWall.wallId)) {
                        const joinError = `Wall with id '${joinWall.wallId}' does not exist`;
                        console.error(joinError);
                        ws.send(JSON.stringify(new WallyError(joinError)))
                    } else {                        
                        // TODO add user
                        ws.send(JSON.stringify(new WallState(this.walls.get(joinWall.wallId))));
                    }
                    break;

                case NewNote.name:
                    const newNote = message as NewNote;
                    const wall = this.walls.get(newNote.wallId);
                    if (wall) {
                        wall.notes.push(newNote.note);
                    }
                    this.wsInstance.getWss().clients.forEach(x => x.send(JSON.stringify(newNote)));
                    break;

                case MoveNote.name:
                    const moveNote = message as MoveNote;
                    const moveWall = this.walls.get(moveNote.wallId);
                    if (moveWall) {
                        const noteMove = moveWall.notes.find(n => moveNote.noteId === n.id);
                        if (noteMove) {
                            noteMove.x = moveNote.x;
                            noteMove.y = moveNote.y;
                        }
                    }
                    this.wsInstance.getWss().clients.forEach(x => x.send(JSON.stringify(moveNote)));                    
                    break;

                case UpdateNoteText.name:
                    const updateNoteText = message as UpdateNoteText;
                    const textWall = this.walls.get(updateNoteText.wallId);
                    if (textWall) {
                        const textNote = textWall.notes.find(n => updateNoteText.noteId === n.id);
                        if (textNote) {
                            textNote.text = updateNoteText.text;
                        }
                    }
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