import * as  DataStore from 'nedb';
import { Line } from 'wally-contract';

export class LineStore {
    private dataStore: DataStore<Line>;

    constructor() {
        this.dataStore = new DataStore({ filename: (process.env.NEDB_ROOT_DIR ? process.env.NEDB_ROOT_DIR : "./store") + "/lines.db", autoload: true });
        this.dataStore.persistence.setAutocompactionInterval(15 * 60 * 1000); // try compacting every 15 minutes
    }

    public async addLine(line: Line): Promise<void> {
        return new Promise((resolve, reject) => {
            this.dataStore.insert(line, (error, line) => {
                if (error) {
                    console.error("Error inserting line", error);
                    reject(error);
                } else {
                    console.log(`Inserted line ${line._id}`);
                    resolve();
                }
            });
        });        
    }

    public async getLines(lineIds: Array<string>): Promise<Array<Line>> {
        return new Promise<Array<Line>>((resolve, reject) => {
            this.dataStore.find({ _id: { $in: lineIds }}, (error, lines) => {
                if (error) {
                    console.error("Failed to get lines", error);
                    reject(error);
                } else {
                    resolve(lines);
                }
            })
        });        
    }

    public async addPointsToLine(lineId: string, points: Array<[number, number]>): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.dataStore.update({ _id: lineId }, { $push: { points: { $each: points } } }, {}, (error, numUpdated, upsert) => {
                if (error) {
                    console.error("Failed to update line", error);
                    reject(error);
                } else {
                    console.log("Added points to line");
                    resolve();
                }
            });
        });
    }
}