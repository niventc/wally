import * as  DataStore from 'nedb';
import { Id } from 'wally-contract';

export class Store<T extends Id> {
    public dataStore: DataStore<T>;

    constructor(private name: string, private compactionIntervalSeconds: number) {
        const directory = (process.env.NEDB_ROOT_DIR ? process.env.NEDB_ROOT_DIR : "./store");
        this.dataStore = new DataStore({ filename: `${directory}/${name}.db`, autoload: true });
        this.dataStore.persistence.setAutocompactionInterval(compactionIntervalSeconds * 1000);
    }

    public async addItem(addItem: T): Promise<void> {
        return new Promise((resolve, reject) => {
            this.dataStore.insert(addItem, (error, item) => {
                if (error) {
                    console.error(`Error inserting ${this.name}`, error);
                    reject(error);
                } else {
                    console.log(`Inserted ${this.name} with id ${item._id}`);
                    resolve();
                }
            });
        });
    }

    public async getItem(id: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.dataStore.findOne({ _id: id }, (error, item) => {
                if (error) {
                    console.error(`Failed to get ${this.name}s`, error);
                    reject(error);
                } else {
                    resolve(item);
                }
            })
        });        
    }
    
    public async getItems(ids: Array<string>): Promise<Array<T>> {
        return new Promise<Array<T>>((resolve, reject) => {
            this.dataStore.find({ _id: { $in: ids }}, (error, notes) => {
                if (error) {
                    console.error(`Failed to get ${this.name}s`, error);
                    reject(error);
                } else {
                    resolve(notes);
                }
            })
        });        
    }

    public updateItem(itemId: string, item: Partial<T>): void {
        this.dataStore.update({ _id: itemId }, { $set: item }, {}, (error, numUpdated, upsert) => {
            if (error) {
                console.error(`Error inserting ${this.name}`, error);
            } else if (numUpdated) {
                console.log(`Updated ${numUpdated} record`);
            }
        });
    }

    public deleteItem(itemId: string): void {
        this.dataStore.remove({ _id: itemId }, {}, (error, numDeleted) => {
            if (error) {
                console.error(`Error deleting ${this.name}`, error);
            } else if (numDeleted) {
                console.log(`Deleted ${numDeleted} records`);
            }
        });
    }
}