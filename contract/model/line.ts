import { Id } from './id';

export class Line implements Id  {    
    constructor(
        public _id: string,
        public points: Array<[number, number]>,
        public colour: string,
        public width: number
    ) {}
}