import * as  DataStore from 'nedb';
import { Note } from 'wally-contract';

export class NoteStore {

    private dataStore: DataStore<Note>;

    constructor() {
        this.dataStore = new DataStore({ filename: "./store/notes.db", autoload: true });
    }

    public async addNote(note: Note): Promise<void> {
        return new Promise((resolve, reject) => {
            this.dataStore.insert(note, (error, note) => {
                if (error) {
                    console.error("Error inserting note", error);
                    reject(error);
                } else {
                    console.log(`Inserted note ${note._id}`);
                    resolve();
                }
            });
        });        
    }

    public async getNotes(noteIds: Array<string>): Promise<Array<Note>> {
        return new Promise<Array<Note>>((resolve, reject) => {
            this.dataStore.find({ _id: { $in: noteIds }}, (error, notes) => {
                if (error) {
                    console.error("Failed to get notes", error);
                    reject(error);
                } else {
                    resolve(notes);
                }
            })
        });        
    }

    public updateNote(noteId: string, note: Partial<Note>): void {
        this.dataStore.update({ _id: noteId }, { $set: note }, {}, (error, numUpdated, upsert) => {
            if (error) {
                console.error("Error inserting note", error);
            } else if (numUpdated) {
                console.log(`Updated ${numUpdated} record`);
            }
        })
    }

    public deleteNote(noteId: string): void {
        this.dataStore.remove({ _id: noteId }, {}, (error, numDeleted) => {
            if (error) {
                console.error("Error deleting note", error);
            } else if (numDeleted) {
                console.log(`Deleted ${numDeleted} records`);
            }
        })
    }
}
