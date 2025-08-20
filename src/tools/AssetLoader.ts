import { Role } from '../model/base';
export class AssetLoader {
    static baseUrl = '';
    static toLoad = 0;
    static loaded = 0;
    static assetManager = new spine.canvas.AssetManager();
    static flashImg: Array<Promise<any>> = [];
    static waitFlash: Array<any> = [];
    static maxImg = 6;
    static imageBitMap: { [index: string]: Array<ImageBitmap> } = {};
    // 加载角色资源
    static loadRole(url: string, roles: Array<Role>) {
        // 角色二进制、切片、图片文件加载
        const assetUrls = roles.reduce((pre: Array<string>, role) => {
            const _pre = role.id.substring(0, 4);
            const _assets = [
                `${url}${_pre}11.atlas`,
                `${url}${_pre}31.atlas`,
                `${url}${_pre}11.png`,
                `${url}${_pre}31.png`,
                `${url}${_pre}01_BATTLE.cysp`,
            ];
            if (role.hasRarity6) {
                _assets.push(`${url}${_pre}61.atlas`);
                _assets.push(`${url}${_pre}61.png`);
            }
            pre.push(..._assets);
            return pre;
        }, []);
        // 角色通用二进制-攻击动作
        this.commonClass.forEach((v) => {
            assetUrls.push(`/assets/type-skel/${v}_COMMON_BATTLE.cysp`);
        });
        // 角色通用二进制-通常动作
        this.commonAction.forEach((v) => {
            assetUrls.push(`/assets/common-skel/${v}.cysp`);
        });
        // 角色基本skel
        assetUrls.push('/assets/common-skel/CHARA_BASE.cysp');

        const promises = assetUrls.map((url) => {
            new Promise((res) => this.load(url, (path: string) => res(path)));
        });
        return Promise.allSettled(promises);
    }
    // 通用加载资源
    static load(url: string, call: (path: string, data: any) => void) {
        const suffix = url.split('.').pop();
        switch (suffix) {
            case 'png':
            case 'jpg':
            case 'bmp': {
                this.waitFlash.push({
                    url,
                    call,
                });
                this.loadImg();
                break;
            }
            case 'cysp':
            case 'skel': {
                this.assetManager.loadBinary(url, call, call);
                break;
            }
            case 'json':
            case 'atlas': {
                this.assetManager.loadText(url, call, call);
                break;
            }
        }
    }
    // 限流加载图片
    static loadImg() {
        if (this.flashImg.length < this.maxImg) {
            const p = new Promise((res) => {
                const item = this.waitFlash.shift();
                this.assetManager.loadTexture(
                    item.url,
                    (p, d) => {
                        item.call(p, d);
                        res(1);
                    },
                    (p, e) => {
                        item.call(p, e);
                        res(0);
                    }
                );
            });
            this.flashImg.push(p);
            p.then(() => {
                const _index = this.flashImg.findIndex((item) => item === p);
                if (_index !== -1) {
                    this.flashImg = this.flashImg.splice(_index, 1);
                }
                if (this.waitFlash.length) {
                    this.loadImg();
                }
            });
        }
    }
    // 预加载动画
    static loadAnim(id: string, type: string, call?: Function) {
        const pre = id[0];
        const roleId = id.substring(0, 4) + '01';
        switch (pre) {
            case '1': {
                const base: Uint8Array = this.assetManager.get(
                    '/assets/common-skel/CHARA_BASE.cysp'
                );
                const actions = this.commonAction
                    .map((v) =>
                        this.assetManager.get(`/assets/common-skel/${v}.cysp`)
                    )
                    .map((binary: Uint8Array) => dealAnim(binary));
                const classMap = this.commonClass
                    .filter((item) => item === type)
                    .map((v) =>
                        this.assetManager.get(
                            `/assets/type-skel/${v}_COMMON_BATTLE.cysp`
                        )
                    )
                    .map((binary: Uint8Array) => dealAnim(binary))
                    .pop() as any;
                const roleSkel = dealAnim(
                    this.assetManager.get(
                        `/assets/role-assets/${roleId}_BATTLE.cysp`
                    )
                );
                let count = classMap.count;
                count += roleSkel.count;
                actions.forEach((item) => {
                    count += item.count;
                });
                let total =
                    base.byteLength -
                    64 +
                    1 +
                    classMap.data.byteLength +
                    roleSkel.data.byteLength;
                actions.forEach((item) => {
                    total += item.data.byteLength;
                });
                let binary = new Uint8Array(total);
                let index = 0;
                binary.set(new Uint8Array(base.slice(64)), 0);
                index += base.byteLength - 64;
                binary[index] = count;
                index++;
                binary.set(new Uint8Array(classMap.data), index);
                index += classMap.data.byteLength;
                binary.set(new Uint8Array(roleSkel.data), index);
                index += roleSkel.data.byteLength;
                actions.forEach((item) => {
                    binary.set(new Uint8Array(item.data), index);
                    index += item.data.byteLength;
                });
                // 获取切图
                const atlas = new spine.TextureAtlas(
                    this.assetManager.get(`/assets/role-assets/${id}.atlas`),
                    (path: string) =>
                        this.assetManager.get(`/assets/role-assets/${path}`)
                );
                const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
                const skeletonBinary = new spine.SkeletonBinary(atlasLoader);
                skeletonBinary.scale = window.global.spine.roleScale;
                const skeletonData = skeletonBinary.readSkeletonData(
                    binary.buffer
                );

                const skeleton = new spine.Skeleton(skeletonData);
                const state = new spine.AnimationState(
                    new spine.AnimationStateData(skeletonData)
                );
                const anims: Array<string> = [];
                const promises: Array<Promise<any>> = [];
                skeleton.flipY = true;
                const { offset, size } = getBounds(skeleton);
                skeleton.setSkinByName('default');
                skeletonData.animations.forEach((item) => {
                    anims.push(item.name);
                    this.imageBitMap[`${id}_${item.name}`] = [];
                });
                let flag = true;
                function loadAnim() {
                    if (!anims.length) {
                        return true;
                    }
                    flag = true;
                    const animName = anims.pop() as string;
                    state.setAnimation(0, animName, false);
                    const offCanvas = new OffscreenCanvas(size.x, size.y);
                    const ctx: any = offCanvas.getContext('2d');
                    const render = new spine.canvas.SkeletonRenderer(
                        ctx as any
                    );
                    render.triangleRendering = true;

                    const _listener = {
                        event: () => {},
                        complete: () => {
                            flag = false;
                            state.removeListener(_listener);
                        },
                        start: () => {},
                        end: () => {},
                        interrupt: () => {},
                        dispose: () => {},
                    };
                    state.addListener(_listener);
                    while (flag) {
                        ctx.clearRect(0, 0, offCanvas.width, offCanvas.height);
                        ctx.save();
                        resize(offCanvas, offset, size, ctx);
                        state.update(window.global.mix / 1000);
                        state.apply(skeleton);
                        skeleton.updateWorldTransform();
                        render.draw(skeleton);
                        ctx.restore();
                        const img = ctx.getImageData(
                            0,
                            0,
                            offCanvas.width,
                            offCanvas.height
                        );
                        promises.push(
                            new Promise((res) => {
                                createImageBitmap(img).then((data) => {
                                    res({
                                        key: `${id}_${animName}`,
                                        data,
                                    });
                                });
                            })
                        );
                    }
                    if (anims.length) {
                        loadAnim();
                    }
                }
                if (anims.length) {
                    loadAnim();
                }
                Promise.allSettled(promises).then((list: any) => {
                    window.global.stash.roles = this.imageBitMap;
                    list.forEach(({ value }: { value: any }) => {
                        this.imageBitMap[value.key].push(value.data);
                    });
                    if (call) {
                        call();
                    }
                });
            }
        }
    }

    static commonAction = [
        'DEAR',
        'SMILE',
        'NO_WEAPON',
        'POSING',
        'RUN_JUMP',
        'RACE',
    ];
    static commonClass = [
        '01',
        '02',
        '03',
        '04',
        '05',
        '06',
        '07',
        '08',
        '09',
        '10',
        '21',
        '22',
        '23',
        '24',
        '25',
        '26',
        '27',
        '28',
        '29',
        '31',
        '32',
        '33',
        '34',
        '35',
        '36',
        '37',
        '38',
        '39',
        '40',
        '41',
        '42',
        '43',
        '44',
        '46',
        '48',
    ];
}

function dealAnim(u: Uint8Array) {
    const a = new DataView(u.buffer).getInt32(12, !0);
    return {
        count: a,
        data: u.slice(32 * (a + 1)),
    };
}

function getBounds(skeleton: spine.Skeleton) {
    skeleton.setToSetupPose();
    skeleton.updateWorldTransform();
    const offset = new spine.Vector2();
    const size = new spine.Vector2();
    skeleton.getBounds(offset, size, []);
    return { offset: offset, size: size };
}
function resize(canvas: any, offset: any, size: any, ctx: any) {
    const centerX = offset.x + size.x / 2;
    const centerY = offset.y + size.y / 2;
    const scaleX = size.x / canvas.width;
    const scaleY = size.y / canvas.height;
    let scale = Math.max(scaleX, scaleY) * 1.2;
    if (scale < 1) scale = 1;
    const width = canvas.width * scale;
    const height = canvas.height * scale;
    ctx.scale(1 / scale, 1 / scale);
    ctx.translate(-centerX, -centerY);
    ctx.translate(width / 2, height / 2);
}
