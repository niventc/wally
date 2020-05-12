import * as  DataStore from 'nedb';
import { WebSocketIdentity } from 'src/client.service';

class Wall {
    public _id: string;
    public lines = new Array<string>();
    public notes = new Array<string>();

    constructor(public name: string) {}
}

export class WallStore {

    private dataStore: DataStore<Wall>;

    // We don't need to persist clients
    public wallClientMap = new Map<string, Array<WebSocketIdentity>>();

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
                    console.info("Created wall", wall);
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

    public async deleteWall(name: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.dataStore.remove({ name: name }, {}, (error, numDeleted) => {
                if (error) {
                    console.error("Error deleting wall", error);
                    reject(error);
                } else if (numDeleted) {
                    console.log(`Deleted ${numDeleted} records`);
                    resolve();
                }
            });
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
            });
        });
    }

    public async removeNote(name: string, noteId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.dataStore.update({ name: name }, { $pull: { notes: noteId } }, {}, (error, numUpdated, upsert) => {
                if (error) {
                    console.error("Failed to remove note", error);
                    reject(error);
                } else {
                    console.log("Removed note from wall");
                    resolve();
                }
            });
        });
    }

    public async addLine(name: string, lineId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.dataStore.update({ name: name }, { $push: { lines: lineId }}, {}, (error, numUpdated, upsert) => {
                if (error) {
                    console.error("Failed to add line", error);
                    reject(error);
                } else {
                    console.log("Added line to wall");
                    resolve();
                }
            });
        });
    }

    public async removeLine(name: string, lineId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.dataStore.update({ name: name }, { $pull: { lines: lineId } }, {}, (error, numUpdated, upsert) => {
                if (error) {
                    console.error("Failed to remove line", error);
                    reject(error);
                } else {
                    console.log("Removed line from wall");
                    resolve();
                }
            });
        });
    }

    public doesWallHaveClient(name: string, identity: WebSocketIdentity): boolean {
        if (this.wallClientMap.has(name)) {
            if (this.wallClientMap.get(name).find(x => x.uuid === identity.uuid)) {
                return true;
            }
        }
        return false;
    }

    public async addClient(name: string, identity: WebSocketIdentity): Promise<Array<WebSocketIdentity>> {
        return new Promise((resolve, reject) => {
            if (!this.wallClientMap.has(name)) {
                this.wallClientMap.set(name, [identity]);
            } else {
                this.wallClientMap.get(name).push(identity);
            }

            // TODO remove client from other walls

            resolve(this.wallClientMap.get(name));
        });
    }

    public async getClients(name: string): Promise<Array<WebSocketIdentity>> {
        return new Promise((resolve, reject) => {
            if (!this.wallClientMap.has(name)) {
                reject(`Wall '${name}' does not have any clients`);
            }
            resolve(this.wallClientMap.get(name));
        });
    }

    public async getUserWallIds(clientId: string): Promise<Array<string>> {
        return new Promise((resolve, reject) => {
            const wallIds = Array.from(this.wallClientMap.entries())
                .filter(x => x[1].find(c => c.clientId === clientId) !== null)
                .map(x => x[0]);
            resolve(wallIds);
        });
    }

    public async removeClient(identity: WebSocketIdentity): Promise<[string, Array<WebSocketIdentity>]> {
        return new Promise((resolve, reject) => {
            for (let [wall, clients] of this.wallClientMap) {
                if (clients.find(x => x.uuid === identity.uuid)) {
                    this.wallClientMap.set(wall, clients.filter(c => c.uuid !== identity.uuid));
                    resolve([wall, this.wallClientMap.get(wall)]);
                }
            }
            resolve();
        });
    }
}