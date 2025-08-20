import { ImageTexure, ImageMap, Bounds } from '../model/base';
import { Comp } from './Comp';
import { Panel } from '../model/Panel';
// 绘制图形
export class Drawer extends Comp {
    static drawList: Array<Panel> = [];
    static Draw(delta: number) {
        const list = Panel.Sort(this.drawList);
        list.forEach((item) => {
            item.components.Drawer.draw(delta);
        });
    }

    texture: ImageTexure;
    show = true;
    showDebug = false;
    constructor(owner: Panel, texture: ImageTexure) {
        super(owner);
        this.texture = texture;
        Drawer.drawList.push(owner);
    }
    draw(d: number) {
        const scale = window.global.percent;
        const ctx = window.global.context as CanvasRenderingContext2D;
        let img = null;
        if (this.texture instanceof ImageMap) {
            img = this.texture.get(d);
        } else {
            img = this.texture;
        }
        const bounds: Bounds = {
            ...this.owner.getPosition(),
            w: this.owner.size.x,
            h: this.owner.size.y,
        };
        ctx.drawImage(
            img,
            bounds.x * scale,
            bounds.y * scale,
            bounds.w * scale,
            bounds.h * scale
        );

        if (this.showDebug) {
            ctx.save();
            ctx.strokeStyle = 'red';
            ctx.strokeRect(
                bounds.x * scale,
                bounds.y * scale,
                bounds.w * scale,
                bounds.h * scale
            );
            ctx.restore();
        }
    }
    destroy() {
        const index = Drawer.drawList.findIndex((item) => item === this.owner);
        if (index !== -1) {
            Drawer.drawList = Drawer.drawList.splice(index, 1);
        }
    }
}
