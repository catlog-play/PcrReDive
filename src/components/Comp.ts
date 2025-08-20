import { Panel } from '../model/Panel';
export class Comp {
    owner: Panel;
    constructor(o: Panel) {
        this.owner = o;
    }
}
