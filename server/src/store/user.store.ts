import * as  DataStore from 'nedb';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'wally-contract';

// Wrap the user and add the private clientId
class StoredUser {
    constructor(
        public clientId: string,
        public user: User
    ) { }
}

export class UserStore {

    private dataStore: DataStore<StoredUser>;

    constructor() {
        this.dataStore = new DataStore({ filename: (process.env.NEDB_ROOT_DIR ? process.env.NEDB_ROOT_DIR : "./store") + "/users.db", autoload: true });
        this.dataStore.persistence.setAutocompactionInterval(60 * 60 * 1000); // try compacting every 60 minutes
    }

    private static getRandomRgbColour(): string {
        return `rgb(${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)})`;
    }

    public async getOrCreateUser(clientId: string): Promise<User> {
        return new Promise((resolve, reject) => {
            this.dataStore.findOne({ clientId: clientId }, (error, user) => {
                if (error) {
                    console.error("Failed to find user", error);
                    reject(error);
                } else {
                    if (user === null) {
                        const newUser = new User(uuidv4(), UserStore.getRandomRgbColour(), true);
                        this.dataStore.insert(new StoredUser(clientId, newUser), (error, storedUser) => {
                            if (error) {
                                console.error("Failed create user", error);
                                reject(error);
                            } else {
                                console.log("Created new user");
                                resolve(storedUser.user);
                            }
                        });
                    } else {
                        console.log("Found user");
                        resolve(user.user);
                    }
                }
            });
        });
    }

    public async getUser(userId: string): Promise<User> {
        return new Promise((resolve, reject) => {
            this.dataStore.findOne({ "user.id": userId }, (error, user) => {
                if (error) {
                    console.error("Failed to find user", error);
                    reject(error);
                } else {
                    resolve(user?.user);
                }
            });
        });
    }

    public async getClientUser(clientId: string): Promise<User> {
        return new Promise((resolve, reject) => {
            this.dataStore.findOne({ clientId: clientId }, (error, user) => {
                if (error) {
                    console.error("Unable to find client user", error);
                    reject(error);
                } else {
                    resolve(user?.user);
                }
            });
        });
    }

    public async getClientsUsers(clientIds: Array<string>): Promise<Array<User>> {
        return new Promise((resolve, reject) => {
            this.dataStore.find({ clientId: { $in: clientIds } }, (error, users) => {
                if (error) {
                    console.error("Unable to find client user", error);
                    reject(error);
                } else {
                    resolve(users.map(u => u.user));
                }
            });
        });
    }

    public async updateUser(userId: string, user: Partial<User>): Promise<void> {
        const existingUser = await this.getUser(userId);
        const updatedUser = Object.assign({}, existingUser, user);
        return new Promise((resolve, reject) => {
            this.dataStore.update({ "user.id": userId }, { $set: { user: updatedUser } }, {}, (error, numUpdated, upsert) => {
                if (error) {
                    console.error("Error updating user", error);
                    reject(error);
                } else if (numUpdated) {
                    console.log(`Updated ${numUpdated} user record`);
                    resolve();
                }
            });
        });
    }
}