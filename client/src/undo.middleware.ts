import { Message, DeleteNote, NewNote, WallState, JoinWall } from "wally-contract";
import { Middleware } from "redux";
import { SendWrapper } from "./webSocket.middleware";

export class Undo extends Message {
    type = "Undo";
}

export const undoMiddleware: () => Middleware = () => {

    let forWall = "";
    let redoStack: Array<Message> = [];
    
    return store => next => (action: Message) => {
        const wall = store.getState().wall?.wall as WallState;
        
        switch (action.type) {
            case JoinWall.name:
                const joinWall = action as JoinWall;
                if (joinWall.name !== forWall) {
                    forWall = joinWall.name;
                    redoStack = [];
                }
                break;

            case NewNote.name:
                const newNote = action as NewNote;
                redoStack = redoStack.filter(x => x.type === "NewNote" && (x as NewNote).note._id !== newNote.note._id);
                break;

            case DeleteNote.name:
                const deleteNote = action as DeleteNote;
                const note = wall.notes.find(n => n._id === deleteNote.noteId);
                if (note) {
                    redoStack.unshift(new NewNote(deleteNote.wallName, note));
                }
                break;

            case Undo.name:
                const redoAction = redoStack.shift();
                if (redoAction) {
                    store.dispatch(new SendWrapper(redoAction));
                }
                break;
        }

        return next(action);
    };
}
