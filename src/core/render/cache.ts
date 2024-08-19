import { EventEmitter } from '../common/eventEmitter';
import { logger } from '../common/logger';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { SizedCanvasImageSource } from './preset/misc';

// 经过测试（https://www.measurethat.net/Benchmarks/Show/30741/1/drawimage-img-vs-canvas-vs-bitmap-cropping-fix-loading）
// 得出结论，ImageBitmap和Canvas的绘制性能不如Image，于是直接画Image就行，所以缓存基本上就是存Image

type ImageMapKeys = Exclude<Cls, 'tileset' | 'autotile'>;
type ImageMap = Record<ImageMapKeys, HTMLImageElement>;

const i = (img: ImageMapKeys) => {
    return core.material.images[img];
};

const imageMap: Partial<ImageMap> = {};

Mota.require('var', 'loading').once('loaded', () => {
    [
        'enemys',
        'enemy48',
        'npcs',
        'npc48',
        'terrains',
        'items',
        'animates'
    ].forEach(v => (imageMap[v as ImageMapKeys] = i(v as ImageMapKeys)));
});

interface AutotileCache {
    parent?: Set<AllNumbersOf<'autotile'>>;
    frame: number;
    cache: Record<string, HTMLCanvasElement>;
}
type AutotileCaches = Record<AllNumbersOf<'autotile'>, AutotileCache>;

interface TextureRequire {
    tileset: Record<string, HTMLImageElement>;
    material: Record<ImageMapKeys, HTMLImageElement>;
    autotile: AutotileCaches;
    images: Record<ImageIds, HTMLImageElement>;
}

interface RenderableDataBase {
    /** 图块的总帧数 */
    frame: number;
    /** 对应图块属性的动画帧数，-1表示没有设定，0表示第一帧 */
    animate: number;
    /** 是否是大怪物 */
    bigImage: boolean;
    render: [x: number, y: number, width: number, height: number][];
}

export interface RenderableData extends RenderableDataBase {
    image: SizedCanvasImageSource;
    autotile: false;
}

export interface AutotileRenderable extends RenderableDataBase {
    image: Record<string, SizedCanvasImageSource>;
    autotile: true;
    bigImage: false;
}

interface TextureCacheEvent {}

class TextureCache extends EventEmitter<TextureCacheEvent> {
    tileset!: Record<string, HTMLImageElement>;
    material: Record<ImageMapKeys, HTMLImageElement>;
    autotile!: AutotileCaches;
    images!: Record<ImageIds, HTMLImageElement>;

    idNumberMap!: IdToNumber;

    /** 渲染信息 */
    renderable: Map<number, RenderableData | AutotileRenderable> = new Map();
    /** 自动元件额外连接信息，用于对非自身图块进行连接 */
    autoConn: Map<number, Set<number>> = new Map();
    /** 行走图朝向绑定 */
    characterDirection: Record<Dir, number> = {
        down: 0,
        left: 1,
        right: 2,
        up: 3
    };
    /** 行走图转向顺序 */
    characterTurn: Dir[] = ['up', 'right', 'down', 'left'];

    constructor() {
        super();
        this.material = imageMap as Record<ImageMapKeys, HTMLImageElement>;

        Mota.require('var', 'loading').once('loaded', () => {
            const map = maps_90f36752_8815_4be8_b32b_d7fad1d0542e;
            // @ts-ignore
            this.idNumberMap = {};
            for (const [key, { id }] of Object.entries(map)) {
                // @ts-ignore
                this.idNumberMap[id] = parseInt(key) as AllNumbers;
            }
            this.tileset = core.material.images.tilesets;
            this.autotile = splitAutotiles(this.idNumberMap);
            this.images = core.material.images.images;
            this.calRenderable();
            this.calAutotileConnections();
        });
    }

    /**
     * 获取纹理
     * @param type 纹理类型
     * @param key 纹理名称
     */
    require<T extends keyof TextureRequire, K extends keyof TextureRequire[T]>(
        type: T,
        key: K
    ): TextureRequire[T][K] {
        return this[type][key];
    }

    /**
     * 计算每个图块的可渲染信息
     */
    private calRenderable() {
        const map = maps_90f36752_8815_4be8_b32b_d7fad1d0542e;
        for (const [key, data] of Object.entries(map)) {
            this.calRenderableByNum(parseInt(key));
        }
    }

    /**
     * 根据图块数字计算出它的渲染信息
     * @param num 图块数字
     */
    calRenderableByNum(
        num: number
    ): RenderableData | AutotileRenderable | null {
        const map = maps_90f36752_8815_4be8_b32b_d7fad1d0542e;
        const enemys = enemys_fcae963b_31c9_42b4_b48c_bb48d09f3f80;
        const icons = icons_4665ee12_3a1f_44a4_bea3_0fccba634dc1;

        /** 特判空图块与空气墙 */
        if (num === 0 || num === 17) return null;

        // 额外素材
        if (num >= 10000) {
            const offset = core.getTilesetOffset(num);
            if (!offset) return null;
            const { image, x, y } = offset;
            const data: RenderableData = {
                image: this.tileset[image],
                frame: 1,
                render: [[x * 32, y * 32, 32, 32]],
                animate: 0,
                autotile: false,
                bigImage: false
            };
            this.renderable.set(num, data);
            return data;
        }

        const data = map[num as Exclude<AllNumbers, 0>];
        // 地狱般的分支if
        if (data) {
            let { cls, faceIds, bigImage, id, animate } = data;
            if (cls === 'enemys' || cls === 'enemy48') {
                // 怪物需要特殊处理，因为它的大怪物信息不在 maps 里面
                ({ bigImage, faceIds } = enemys[id as EnemyIds]);
            }
            if (bigImage) {
                const image = core.material.images.images[bigImage];
                if (!image) {
                    logger.warn(
                        10,
                        `Cannot resolve big image of enemy '${id}'.`
                    );
                    return null;
                }
                let line = 0;
                if (faceIds) {
                    const arr = ['down', 'left', 'right', 'up'];
                    for (let i = 0; i < arr.length; i++) {
                        if (faceIds[arr[i] as Dir] === id) {
                            line = i;
                            break;
                        }
                    }
                }
                const totalLines = image.width / image.height >= 2 ? 1 : 4;
                const w = Math.round(image.width / 4);
                const h = Math.round(image.height / totalLines);
                const y = h * line;
                const data: RenderableData = {
                    image,
                    frame: 4,
                    render: [
                        [0, y, w, h],
                        [w, y, w, h],
                        [w * 2, y, w, h],
                        [w * 3, y, w, h]
                    ],
                    animate: (animate ?? 0) - 1,
                    autotile: false,
                    bigImage: true
                };
                this.renderable.set(num, data);
                return data;
            }
            // enemy48和npc48都应该视为大怪物
            if (cls === 'enemy48' || cls === 'npc48') {
                const img = core.material.images[cls];
                // @ts-ignore
                const line = icons[cls][id];
                const w = 32;
                const h = 48;
                const y = h * line;
                const data: RenderableData = {
                    image: img,
                    frame: 4,
                    render: [
                        [0, y, w, h],
                        [w, y, w, h],
                        [w * 2, y, w, h],
                        [w * 3, y, w, h]
                    ],
                    animate: (animate ?? 0) - 1,
                    autotile: false,
                    bigImage: true
                };
                this.renderable.set(num, data);
                return data;
            }
            // 自动元件
            if (cls === 'autotile') {
                const auto = this.autotile[num as AllNumbersOf<'autotile'>];
                const cell = 32;
                const render: [number, number, number, number][] = [];
                if (auto.frame >= 1) {
                    render.push([0, 0, cell, cell]);
                }
                if (auto.frame >= 3) {
                    render.push(
                        [cell, 0, cell, cell],
                        [cell * 2, 0, cell, cell]
                    );
                }
                if (auto.frame >= 4) {
                    render.push([cell * 3, 0, cell, cell]);
                }
                const data: AutotileRenderable = {
                    image: auto.cache,
                    frame: auto.frame,
                    render,
                    autotile: true,
                    bigImage: false,
                    animate: (animate ?? 0) - 1
                };
                this.renderable.set(num, data);
                return data;
            } else {
                const image =
                    core.material.images[
                        cls as Exclude<Cls, 'tileset' | 'autotile'>
                    ];
                const frame = core.getAnimateFrames(cls);
                const cell = 32;
                // @ts-ignore
                const offset = (icons[cls][id] as number) * cell;
                const render: [number, number, number, number][] = [
                    [0, offset, cell, cell]
                ];
                if (frame === 2) {
                    render.push([cell, offset, cell, cell]);
                }
                if (frame === 4) {
                    render.push(
                        [cell, offset, cell, cell],
                        [cell * 2, offset, cell, cell],
                        [cell * 3, offset, cell, cell]
                    );
                }
                const data: RenderableData = {
                    image,
                    frame: frame,
                    render,
                    autotile: false,
                    bigImage: false,
                    animate: (animate ?? 0) - 1
                };
                this.renderable.set(num, data);
                return data;
            }
        } else {
            logger.warn(
                11,
                `Cannot resolve material ${num}. Material not exists.`
            );
            return null;
        }
    }

    /**
     * 获取一个图块的渲染信息，自动元件会特别标明autotile属性
     * @param num 图块数字
     */
    getRenderable(num: number) {
        return this.renderable.get(num) ?? this.calRenderableByNum(num);
    }

    /**
     * 计算自动元件的额外连接
     */
    private calAutotileConnections() {
        const icons = icons_4665ee12_3a1f_44a4_bea3_0fccba634dc1;
        const maps = maps_90f36752_8815_4be8_b32b_d7fad1d0542e;

        Object.keys(icons.autotile).forEach(v => {
            const num = this.idNumberMap[v as AllIdsOf<'autotile'>];
            const data = maps[num];
            const { autotileConnection } = data;
            if (!autotileConnection) return;
            const list = new Set<AllNumbers>();
            autotileConnection.forEach(v => {
                if (typeof v === 'number') {
                    list.add(v);
                } else {
                    list.add(this.idNumberMap[v]);
                }
            });
            this.autoConn.set(num, list);
        });
    }

    /**
     * 获取自动元件的额外连接情况
     * @param num 自动元件的图块数字
     */
    getAutotileConnections(num: number) {
        return this.autoConn.get(num);
    }
}

export const texture = new TextureCache();

// 3x4 与 2x3 的自动元件信息
// 将自动元件按 16x16 切分后，数组分别表示 左上 右上 右下 左下 所在图块位置
const bigAutotile: Record<number, [number, number, number, number]> = {};
const smallAutotile: Record<number, [number, number, number, number]> = {};

function getAutotileIndices() {
    // 应当从 0 - 255 进行枚举
    // 二进制从高位到低位依次是 左上 上 右上 右 右下 下 左下 左
    // 有兴趣可以研究下这个算法
    const get = (
        target: Record<number, [number, number, number, number]>,
        mode: 1 | 2
    ) => {
        const h = mode === 1 ? 4 : 2;
        const v = mode === 1 ? 24 : 8;
        const luo = mode === 1 ? 12 : 8; // leftup origin
        const ruo = mode === 1 ? 17 : 11; // rightup origin
        const ldo = mode === 1 ? 42 : 20; // leftdown origin
        const rdo = mode === 1 ? 47 : 23; // rightdown origin
        const luc = mode === 1 ? 4 : 2; // leftup corner
        const ruc = mode === 1 ? 5 : 3; // rightup corner
        const rdc = mode === 1 ? 11 : 7; // rightdown corner
        const ldc = mode === 1 ? 10 : 6; // leftdown corner

        for (let i = 0; i <= 0b11111111; i++) {
            let lu = luo; // leftup
            let ru = ruo; // rightup
            let ld = ldo; // leftdown
            let rd = rdo; // rightdown

            // 先看四个方向，最后看斜角方向
            if (i & 0b00000001) {
                lu += h;
                ld += h;
                if (i & 0b00010000) {
                    ru += h / 2;
                    rd += h / 2;
                }
            }
            if (i & 0b00000100) {
                ld -= v;
                rd -= v;
                if (i & 0b01000000) {
                    lu -= v / 2;
                    ru -= v / 2;
                }
            }
            if (i & 0b00010000) {
                ru -= h;
                rd -= h;
                if (i & 0b00000001) {
                    lu -= h / 2;
                    ld -= h / 2;
                }
            }
            if (i & 0b01000000) {
                lu += v;
                ru += v;
                if (i & 0b00000100) {
                    ld += v / 2;
                    rd += v / 2;
                }
            }
            // 斜角
            if ((i & 0b11000001) === 0b01000001) {
                lu = luc;
            }
            if ((i & 0b01110000) === 0b01010000) {
                ru = ruc;
            }
            if ((i & 0b00011100) === 0b00010100) {
                rd = rdc;
            }
            if ((i & 0b00000111) === 0b00000101) {
                ld = ldc;
            }
            target[i] = [lu, ru, rd, ld];
        }
    };

    get(bigAutotile, 1);
    get(smallAutotile, 2);
}
getAutotileIndices();

function getRepeatMap() {
    // 实际上3x4与2x3的重复映射是一致的，因此只需要计算一个就行了
    // 这里使用2x3的进行计算
    const calculated: Record<string, number> = {};
    const repeatMap: Record<number, number> = {};
    for (const [num, [lu, ru, rd, ld]] of Object.entries(smallAutotile)) {
        const n = lu + ru * 24 + rd * 24 ** 2 + ld * 24 ** 3;
        calculated[num] = n;
        for (const [num2, n2] of Object.entries(calculated)) {
            if (n2 === n) {
                repeatMap[Number(num)] = Number(num2);
                break;
            }
        }
    }

    return repeatMap;
}

function splitAutotiles(map: IdToNumber): AutotileCaches {
    const cache: Partial<AutotileCaches> = {};
    /** 重复映射，由于自动元件只有48种，其余的208种是重复的，因此需要获取重复映射 */
    const repeatMap: Record<number, number> = getRepeatMap();
    /** 每个自动元件左上角32*32的内容，用于判断父子关系 */
    const masterMap: Partial<Record<AllNumbersOf<'autotile'>, string>> = {};

    for (const [key, img] of Object.entries(core.material.images.autotile)) {
        const auto = map[key as AllIdsOf<'autotile'>];

        // 判断自动元件类型
        let mode: 1 | 2 = 1;
        let frame = 1;
        if (img.width === 384) {
            frame = 4;
        } else if (img.width === 192) {
            mode = 2;
            frame = 3;
        } else if (img.width === 64) {
            mode = 2;
        }

        cache[auto] = {
            frame,
            cache: {}
        };

        // 父子关系，截取本图块的左上角存入map
        const master = new MotaOffscreenCanvas2D();
        master.setHD(false);
        master.setAntiAliasing(false);
        master.withGameScale(false);
        master.size(32, 32);
        master.ctx.drawImage(img, 0, 0, 32, 32, 0, 0, 32, 32);
        masterMap[auto] = master.canvas.toDataURL('image/png');

        // 自动图块的绘制信息
        for (let i = 0; i <= 0b11111111; i++) {
            const re = repeatMap[i];
            if (re) {
                const cached = cache[auto]!.cache[re];
                if (cached) {
                    cache[auto]!.cache[i] = cached;
                    continue;
                }
            }

            const data = (mode === 1 ? bigAutotile : smallAutotile)[i];
            const row = mode === 1 ? 6 : 4;
            const info: [number, number][] = data.map(v => [
                (v % row) * 16,
                Math.floor(v / row) * 16
            ]);

            const canvas = new MotaOffscreenCanvas2D();
            canvas.setHD(false);
            canvas.setAntiAliasing(false);
            canvas.withGameScale(false);
            canvas.size(32 * frame, 32);
            const ctx = canvas.ctx;
            for (let i = 0; i < frame; i++) {
                const dx = 32 * i;
                const sx1 = info[0][0] + (i * row * 32) / 2;
                const sx2 = info[1][0] + (i * row * 32) / 2;
                const sx3 = info[2][0] + (i * row * 32) / 2;
                const sx4 = info[3][0] + (i * row * 32) / 2;
                const sy1 = info[0][1];
                const sy2 = info[1][1];
                const sy3 = info[2][1];
                const sy4 = info[3][1];

                ctx.drawImage(img, sx1, sy1, 16, 16, dx, 0, 16, 16);
                ctx.drawImage(img, sx2, sy2, 16, 16, dx + 16, 0, 16, 16);
                ctx.drawImage(img, sx3, sy3, 16, 16, dx + 16, 16, 16, 16);
                ctx.drawImage(img, sx4, sy4, 16, 16, dx, 16, 16, 16);
            }
            cache[auto]!.cache[i] = canvas.canvas;
        }
    }

    // 进行父子关系判断
    for (const [key, img] of Object.entries(core.material.images.autotile)) {
        const auto = map[key as AllIdsOf<'autotile'>];

        // 只针对3*4的图块进行，截取第一行中间的，然后判断
        const judge = new MotaOffscreenCanvas2D();
        judge.setHD(false);
        judge.setAntiAliasing(false);
        judge.withGameScale(false);
        judge.size(32, 32);
        judge.ctx.drawImage(img, 32, 0, 32, 32, 0, 0, 32, 32);
        const data = judge.canvas.toDataURL('image/png');

        for (const [key, data2] of Object.entries(masterMap)) {
            const auto2 = map[key as AllIdsOf<'autotile'>];

            if (data === data2) {
                cache[auto]!.parent ??= new Set();
                cache[auto]!.parent!.add(auto2);
            }
        }
    }

    return cache as AutotileCaches;
}
