import './index.css';
import { AssetLoader } from './tools/AssetLoader';
import { Panel } from './model/Panel';
import { Point, ImageMap } from './model/base';
import { Drawer } from './components/Drawer';
const dom = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = dom.getContext('2d') as CanvasRenderingContext2D;
const fpsDom = document.getElementById('fps') as HTMLDivElement;
dom.width = dom.clientWidth;
dom.height = dom.clientHeight;
let lastDateTime = Date.now();
window.global = {
    canvas: dom,
    context: ctx,
    mix: 1000 / 60,
    width: 1280,
    height: 720,
    percent: 1,
    spRender: new spine.canvas.SkeletonRenderer(ctx),
    spine: {
        roleScale: 0.3,
    },
    metadata: {
        roles: [],
    },
    stash: {
        roles: null,
    },
};

requestAnimationFrame(render);
function render() {
    const now = Date.now();
    const delta = now - lastDateTime;
    lastDateTime = now;
    const fps = 1000 / delta;
    ctx.clearRect(0, 0, dom.width, dom.height);
    Drawer.Draw(delta);
    fpsDom.innerText = `FPS:${Math.round(fps)}`;
    requestAnimationFrame(render);
}
window.addEventListener('resize', () => resize());
function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const _p = window.global.width / window.global.height;
    const canvas = window.global.canvas;
    if (h * _p < w) {
        canvas.width = h * _p;
        canvas.height = h;
    } else {
        canvas.width = w;
        canvas.height = w / _p;
    }
    window.global.percent = canvas.width / window.global.width;
}
resize();
AssetLoader.load('/assets/role-assets/133511.skel', () => {});
function test() {
    AssetLoader.load('/assets/role.json', (_, data) => {
        const _data = JSON.parse(data);
        window.global.metadata.roles = _data;
        AssetLoader.loadRole('/assets/role-assets/', _data).then(() => {
            console.log(AssetLoader.assetManager);
            check();
            function check() {
                if (AssetLoader.assetManager.isLoadingComplete()) {
                    AssetLoader.loadAnim('133511', '22', () => {
                        const img: Array<ImageBitmap> = window.global.stash
                            .roles['133511_22_idle'] as any;
                        for (let i = 0; i < 20000; i++) {
                            const p = new Panel(new Point(200, 200));
                            p.position = new Point(
                                Math.floor(i % 18) * 100,
                                Math.floor(i / 18) * 100
                            );
                            p.addComponent(new Drawer(p, new ImageMap(img)));
                            //p.components.Drawer.showDebug = true;
                        }
                    });
                } else {
                    requestAnimationFrame(check);
                }
            }
        });
    });
}
test();
