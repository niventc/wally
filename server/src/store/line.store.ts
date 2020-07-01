import { Line } from 'wally-contract';
import { Store } from './store';

export class LineStore extends Store<Line> {

    constructor() {
        super("lines", 15);
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

    // Cheap hack to replace all but the first points for a line, for straight lines
    public async replacePoints(lineId: string, points: Array<[number, number]>): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            const line = await this.getItem(lineId);
            if (line) {
                this.dataStore.update({ _id: lineId }, { $set: { points: [line.points[0], ...points] } }, {}, (error, numUpdated, upsert) => {
                    if (error) {
                        console.error("Failed to update line", error);
                        reject(error);
                    } else {
                        console.log("Replaced points on line");
                        resolve();
                    }
                });
            } else {
                reject("Line doesn't exist!");
            }
        });
    }
}
