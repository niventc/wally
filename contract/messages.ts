import { Note, User, Line, Image } from "./model";

export class Message {
    type: string;
}

export class CreateWall implements Message {
    type = "CreateWall";

    constructor(public name: string) {
    }
}

export class DeleteWall implements Message {
    type = "DeleteWall";

    constructor(public name: string) {
    }
}

export class JoinWall implements Message {
    type = "JoinWall";

    constructor(public name: string) {
    }
}

export class UserJoinedWall implements Message {
    type = "UserJoinedWall";

    constructor(
        public wallName: string,
        public user: User
    ) {}
}

export class UserLeftWall implements Message {
    type = "UserLeftWall";

    constructor(
        public wallName: string,
        public userId: string
    ) {
    }
}

export class WallState implements Message {
    type = "WallState";

    constructor(
        public name: string, 
        public lines: Array<Line>,
        public notes: Array<Note>, 
        public users: Array<User>,
        public images: Array<Image>,
        // user id to note id
        public selectedNotes: { [key: string] : string }
    ) {
    }
}

export class WallyError implements Message {
    type = "WallyError";

    constructor(public message: string) {
    }
}

export class NewNote implements Message {
    type = "NewNote";

    constructor (public wallName: string, public note: Note) {
    }
}

export class NewImage implements Message {
    type = "NewImage";

    constructor (public wallName: string, public image: Image, public data: string) {
    }
}

export class UpdateImage implements Message {
    type = "UpdateImage";

    constructor (public wallName: string, public imageId: string, public image: Partial<Image>) {
    }
}

export class DeleteImage implements Message {
    type = "DeleteImage";

    constructor(
        public wallName: string,
        public imageId: string
    ) {
    }
}

export class MoveNote implements Message {
    type = "MoveNote";

    constructor(
        public wallName: string,
        public noteId: string,
        public x: number,
        public y: number
    ) {
    }
}

export class UpdateNoteText implements Message {
    type = "UpdateNoteText";

    constructor(
        public wallName: string,
        public noteId: string,
        public text: string
    ) {
    }
}

export class SelectNote implements Message {
    type = "SelectNote";

    constructor(
        public wallName: string,
        public noteId: string,
        public byUser: User
    ) {
    }
}

export class DeleteNote implements Message {
    type = "DeleteNote";

    constructor(
        public wallName: string,
        public noteId: string
    ) {
    }
}

export class NewLine implements Message {
    type = "NewLine";

    constructor(
        public wallName: string,
        public line: Line
    ) {}
}

export class UpdateLine implements Message {
    type = "UpdateLine";

    constructor(
        public wallName: string,
        public lineId: string,
        public points: Array<[number, number]>,
        public replace: boolean
    ) {}
}

export class DeleteLine implements Message {
    type = "DeleteLine";

    constructor(
        public wallName: string,
        public lineId: string
    ) {}
}

export class UserConnected implements Message {
    type = "UserConnected";

    constructor(public user: User) {}
}

export class UpdateUser implements Message {
    type = "UpdateUser";

    constructor(
        public userId: string,
        public user: Partial<User>
    ) {}
}