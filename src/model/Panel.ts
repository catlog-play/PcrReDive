import { Point } from './base';
export class Panel {
    // 大小
    size: Point;
    // 父级面板 渲染时相对于父级
    parent: Panel | null;
    children: Array<Panel> = [];
    // 位置
    position: Point = new Point();
    // 偏移量 不为空时position将无效
    offset: Point = new Point();
    zIndex = 0;
    // 子级超出部分是否展示
    overflow = false;
    components: { [index: string]: any } = {};
    constructor(size: Point, parent?: Panel) {
        this.size = size ?? new Point();
        this.parent = parent ?? null;
    }
    setParent(p?: Panel) {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        this.parent = p ?? null;
    }
    addChild(p: Panel) {
        this.children.push(p);
    }
    removeChild(p: Panel) {
        const index = this.children.findIndex((item) => item === p);
        if (index !== -1) {
            this.children = this.children.splice(index, 1);
        }
    }
    // 根据顺序排序
    static Sort(list: Array<Panel>) {
        return list.sort((a, b) => a.zIndex - b.zIndex);
    }
    addComponent(comp: any) {
        this.components[comp.constructor.name] = comp;
    }
    removeComponent(name: string) {
        if (this.components[name].distroy instanceof Function) {
            this.components[name].distroy();
        }
        delete this.components[name];
    }
    getPosition(): Point {
        if (this.parent) {
            const p = this.parent.getPosition();
            p.x += this.offset.x;
            p.y += this.offset.y;
            return p;
        } else {
            return { ...this.position };
        }
    }
    destroy() {
        // 移除父级列表中的自己
        if (this.parent) {
            const index = this.parent.children.findIndex(
                (item) => item === this
            );
            if (index !== -1) {
                this.parent.children = this.parent.children.splice(index, 1);
            }
        }

        // 销毁所有组件
        const comps = Object.keys(this.components);
        comps.forEach((item) => {
            this.removeComponent(item);
        });
    }
}
