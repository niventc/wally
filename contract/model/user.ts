
export class User {    
    constructor(
        public id: string,
        public colour: string,
        public useNightMode: boolean,
        public name?: string
    ) {}
  }