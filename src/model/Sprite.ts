import { Panel } from './Panel';
import { Drawer } from '../components/Drawer';
import { ImageTexure, Point } from './base';
export class Sprite extends Panel {
    constructor(size: Point, parent?: Panel, texture?: ImageTexure) {
        super(size, parent);
        if (texture) this.addComponent(new Drawer(this, texture));
    }
}
