import { WallStore } from './store/wall.store';
import { WallState } from 'wally-contract';
import { LineStore } from './store/line.store';
import { NoteStore } from './store/note.store';
import { UserStore } from './store/user.store';

export class WallService {

    constructor(
        private lineStore: LineStore,
        private noteStore: NoteStore,
        private userStore: UserStore,
        private wallStore: WallStore,
    ) {}

    public async getWalls(): Promise<Array<string>> {
        return this.wallStore.getWalls();
    }

    public async getWall(name: string): Promise<WallState> {
        const wall = await this.wallStore.getWall(name);

        const lines = await this.lineStore.getLines(wall.lines);
        lines.filter(async line => {
            if (line.points.length < 2 || !line.colour) {
                await this.wallStore.removeLine(name, line._id);
                await this.lineStore.deleteLine(line._id);
                return false;
            }
            return true;
        });

        const notes = await this.noteStore.getNotes(wall.notes);
        
        const clients = await this.wallStore.getClients(name); 
        const users = await this.userStore.getClientsUsers(clients.map(c => c.clientId));

        const selected = {};
        users.forEach(u => {
            const noteId = this.noteStore.getUserSelectedNote(u.id);
            if (noteId) {
                selected[u.id] = noteId;
            }
        });

        return new WallState(name, lines, notes, users, selected);
    }
}