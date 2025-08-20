export class Point {
    x: number;
    y: number;
    constructor(x?: number, y?: number) {
        this.x = x ?? 0;
        this.y = y ?? 0;
    }
}
export class Bounds extends Point {
    w: number;
    h: number;
    constructor(x?: number, y?: number, w?: number, h?: number) {
        super(x, y);
        this.w = w ?? 0;
        this.h = h ?? 0;
    }
}
export class ImageMap {
    map: Array<HTMLImageElement | ImageBitmap> = [];
    state = 0;
    constructor(list: Array<HTMLImageElement | ImageBitmap>) {
        this.map = list;
        this.state = 0;
    }
    init(st?: number) {
        this.state = st ?? 0;
    }
    get(delta: number) {
        const mix: number = window.global.mix;
        const res = this.map[this.state];
        this.state += Math.round(delta / mix);
        if (this.state >= this.map.length) {
            this.state = 0;
        }
        return res;
    }
}
// 渲染图
export type ImageTexure = ImageBitmap | HTMLImageElement | ImageMap;

export type Role = {
    id: string;
    hasRarity6: boolean;
    type: string;
};
