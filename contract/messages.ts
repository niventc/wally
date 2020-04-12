import { Note } from "./model";

export class Message {    
    constructor(
        public type: string
    ) {}
}

export class NewNote implements Message {
    type = NewNote.name;

    constructor (public note: Note) {}
}

export class MoveNote implements Message {
    type = MoveNote.name;
    noteId?: string;
    x?: number;
    y?: number;
}

export class UpdateNoteText implements Message {
    type = UpdateNoteText.name;
    noteId?: string;
    text?: string;
}

export class DeleteNote implements Message {
    type = DeleteNote.name;
    noteId?: string;
}