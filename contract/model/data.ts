import { Id } from './id';


export class Data implements Id {    
    constructor(
        public _id: string,
        public data: string
    ) {}
}