import { Note } from './note';
import { User } from './user';

export class Wall {
    constructor(
        public id: string,
        public notes: Array<Note>,
        public users: Array<User>
    ) {}
}
