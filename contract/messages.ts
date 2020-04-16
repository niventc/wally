import { Note, User, Wall } from "./model";

export class Message {
    type: string;
}

export class CreateWall implements Message {
    type = "CreateWall";

    constructor(public wallId: string) {
    }
}

export class JoinWall implements Message {
    type = "JoinWall";

    constructor(public wallId: string) {
    }
}

export class WallState implements Message {
    type = "WallState";

    constructor(public wall: Wall) {
    }
}

export class WallyError implements Message {
    type = "WallyError";

    constructor(public message: string) {
    }
}

export class NewNote implements Message {
    type = "NewNote";

    constructor (public wallId: string, public note: Note) {
    }
}

export class MoveNote implements Message {
    type = "MoveNote";

    constructor(
        public wallId: string,
        public noteId: string,
        public x: number,
        public y: number
    ) {
    }
}

export class UpdateNoteText implements Message {
    type = "UpdateNoteText";

    constructor(
        public wallId: string,
        public noteId: string,
        public text: string
    ) {
    }
}

export class SelectNote implements Message {
    type = "SelectNote";

    constructor(
        public wallId: string,
        public noteId: string,
        public byUser: User
    ) {
    }
}

export class DeleteNote implements Message {
    type = "DeleteNote";

    constructor(
        public wallId: string,
        public noteId: string
    ) {
    }
}

export class UpdateUser implements Message {
    type = "UpdateUser";

    constructor(
        public userId: string,
        public user: Partial<User>
    ) {
    }
}