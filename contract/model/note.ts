import { Id } from 'model';

export class Note implements Id {    
    constructor(
        public _id: string,
        public zIndex: number,
        public x: number,
        public y: number,
        public colour: string,
        public text: string
    ) {}
}