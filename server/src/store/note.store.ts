import { Note } from 'wally-contract';
import { Store } from './store';

export class NoteStore extends Store<Note> {

    private selectedNotes = new Map<string, string>();

    constructor() {
        super("notes", 5 * 60);
    }

    public selectNote(noteId: string, userId: string): void {
        this.selectedNotes.set(userId, noteId);
    }

    public getUserSelectedNote(userId: string): string {
        return this.selectedNotes.get(userId);
    }
}
