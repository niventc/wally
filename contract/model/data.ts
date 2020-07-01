import { Id } from 'model';

export class Data implements Id {    
    constructor(
        public _id: string,
        public data: string
    ) {}
}