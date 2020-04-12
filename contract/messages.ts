import { Note, User } from "./model";

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

    constructor(
        public noteId: string,
        public x: number,
        public y: number
    ) {}
}

export class UpdateNoteText implements Message {
    type = UpdateNoteText.name;

    constructor(
        public noteId: string,
        public text: string
    ) {}
}

export class SelectNote implements Message {
    type = SelectNote.name;

    constructor(
        public noteId: string,
        public byUser: User
    ) {}
}

export class DeleteNote implements Message {
    type = DeleteNote.name;

    constructor(
        public noteId: string
    ) {}
}

export class UpdateUser implements Message {
    type = UpdateUser.name;

    constructor(
        public userId: string,
        public user: Partial<User>
    ) {}
}