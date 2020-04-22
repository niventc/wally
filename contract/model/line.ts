
export class Line {    
    constructor(
        public _id: string,
        public points: Array<[number, number]>,
        public colour: string,
        public width: string
    ) {}
}