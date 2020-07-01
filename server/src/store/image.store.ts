import { Image } from 'wally-contract';
import { Store } from './store';

export class ImageStore extends Store<Image> {
    constructor() {
        super("image", 15);
    }
}
