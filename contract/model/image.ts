import { Id } from 'model';

export class Image implements Id {    
    constructor(
        public _id: string,
        public zIndex: number,
        public x: number,
        public y: number,
        public width: number,
        public height: number,
        public value: string
    ) {}
}