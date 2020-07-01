import { Id } from './id';

export class Image implements Id {    
    constructor(
        public _id: string,
        public name: string,
        public zIndex: number,
        public x: number,
        public y: number,
        public originalWidth: number,
        public originalHeight: number,
        public width: number,
        public height: number
    ) {}
}