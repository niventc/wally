import { Store } from './store';
import { Data } from 'wally-contract';

export class DataStore extends Store<Data> {
    constructor() {
        super("data", 30);
    }
}