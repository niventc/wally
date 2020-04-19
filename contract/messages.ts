import { Note, User } from "./model";

export class Message {
    type: string;
}

export class CreateWall implements Message {
    type = "CreateWall";

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

export class LeaveWall implements Message {
    type = "LeaveWall";

    constructor(public name: string) {
    }
}

export class WallState implements Message {
    type = "WallState";

    constructor(public name: string, public notes: Array<Note>, public users: Array<User>) {
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