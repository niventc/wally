import * as  DataStore from 'nedb';

class Wall {
    public _id: string;
    public notes = new Array<string>();
    public users = new Array<string>();

    constructor(public name: string) {}
}

export class WallStore {

    private dataStore: DataStore<Wall>;

    constructor() {
        this.dataStore = new DataStore({ filename: (process.env.NEDB_ROOT_DIR ? process.env.NEDB_ROOT_DIR : "./store") + "/walls.db", autoload: true });
        this.dataStore.persistence.setAutocompactionInterval(30 * 60 * 1000); // try compacting every 30 minutes
    }

    public async doesWallExist(name: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.dataStore.findOne({ name: name }, (error, wall) => {
                if (error) {
                    console.error("Failed to check if wall exists", error);
                    reject(error);
                } else {
                    resolve(wall !== null);
                }
            })
        })
    }

    public async createWall(name: string): Promise<Wall> {
        return new Promise((resolve, reject) => {
            this.dataStore.insert(new Wall(name), (error, wall) => {
                if (error) {
                    console.error("Failed to create wall", error);
                    reject(error);
                } else {
                    resolve(wall);
                }
            })
        });
    }

    public async getWall(name: string): Promise<Wall | null> {
        return new Promise((resolve, reject) => {
            this.dataStore.findOne({ name: name }, (error, wall) => {
                if (error) {
                    console.error("Failed to get wall", error);
                    reject(error);
                } else {
                    resolve(wall);
                }
            })
        });
    }

    public async addNote(name: string, noteId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.dataStore.update({ name: name }, { $push: { notes: noteId }}, {}, (error, numUpdated, upsert) => {
                if (error) {
                    console.error("Failed to add note", error);
                    reject(error);
                } else {
                    console.log("Added note to wall");
                    resolve();
                }
            })
        })
    }

}