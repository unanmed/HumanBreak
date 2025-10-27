import { IRect, ITexture, ITextureRenderable } from '@motajs/render-assets';
import {
    AutotileType,
    BlockCls,
    IAutotileConnection,
    IAutotileProcessor,
    IAutotileRenderable,
    IMaterialManager
} from './types';
import { logger } from '@motajs/common';

interface ConnectedAutotile {
    readonly lt: Readonly<IRect>;
    readonly rt: Readonly<IRect>;
    readonly rb: Readonly<IRect>;
    readonly lb: Readonly<IRect>;
}

/** 3x4 自动元件的连接映射，元组表示将对应大小的自动元件按照格子 1/4 大小切分后对应的索引位置 */
const connectionMap3x4 = new Map<number, [number, number, number, number]>();
/** 2x3 自动元件的连接映射，元组表示将对应大小的自动元件按照格子 1/4 大小切分后对应的索引位置 */
const connectionMap2x3 = new Map<number, [number, number, number, number]>();
/** 3x4 自动元件各方向连接矩形映射 */
const rectMap3x4 = new Map<number, ConnectedAutotile>();
/** 2x3 自动元件各方向连接的矩形映射 */
const rectMap2x3 = new Map<number, ConnectedAutotile>();

interface AutotileFrameList {
    type: AutotileType;
    rects: Readonly<IRect>[];
}

export class AutotileProcessor implements IAutotileProcessor {
    /** 自动元件父子关系映射，子元件 -> 父元件 */
    readonly parentMap: Map<number, number> = new Map();
    /** 自动元件父子关系映射，父元件 -> 子元件列表 */
    readonly childMap: Map<number, Set<number>> = new Map();

    constructor(readonly manager: IMaterialManager) {}

    private ensureChildSet(num: number) {
        const set = this.childMap.get(num);
        if (set) return set;
        const ensure = new Set<number>();
        this.childMap.set(num, ensure);
        return ensure;
    }

    setParent(autotile: number, parent: number): void {
        this.parentMap.set(autotile, parent);
        const child = this.ensureChildSet(parent);
        child.add(autotile);
    }

    private connectEdge(length: number, index: number, width: number): number {
        // 最高位表示左上，低位依次顺时针旋转

        // 如果地图大小只有 1
        if (length === 1) {
            return 0b1111_1111;
        }
        // 如果地图高度只有 1
        if (length === width) {
            if (index === 0) {
                return 0b1100_0111;
            } else if (index === length - 1) {
                return 0b0111_1100;
            } else {
                return 0b0100_0100;
            }
        }
        // 如果地图宽度只有 1
        if (width === 1) {
            if (index === 0) {
                return 0b1111_0001;
            } else if (index === length - 1) {
                return 0b0001_1111;
            } else {
                return 0b0001_0001;
            }
        }

        // 正常地图

        const lastLine = length - width;
        const x = index % width;

        // 四个角，左上，右上，右下，左下
        if (index === 0) {
            return 0b1100_0001;
        } else if (index === width - 1) {
            return 0b0111_0000;
        } else if (index === length - 1) {
            return 0b0001_1100;
        } else if (index === lastLine) {
            return 0b0000_0111;
        }
        // 四条边，上，右，下，左
        else if (index < width) {
            return 0b0100_0000;
        } else if (x === width - 1) {
            return 0b0001_0000;
        } else if (index > lastLine) {
            return 0b0000_0100;
        } else if (x === 0) {
            return 0b0000_0001;
        }
        // 不在边缘
        else {
            return 0b0000_0000;
        }
    }

    connect(
        array: Uint32Array,
        index: number,
        width: number
    ): IAutotileConnection {
        let res: number = this.connectEdge(array.length, index, width);
        const block = array[index];
        const childList = this.childMap.get(block);

        // 最高位表示左上，低位依次顺时针旋转
        const a7 = array[index - width - 1] ?? 0;
        const a6 = array[index - width] ?? 0;
        const a5 = array[index - width + 1] ?? 0;
        const a4 = array[index + 1] ?? 0;
        const a3 = array[index + width + 1] ?? 0;
        const a2 = array[index + width] ?? 0;
        const a1 = array[index + width - 1] ?? 0;
        const a0 = array[index - 1] ?? 0;

        // Benchmark https://www.measurethat.net/Benchmarks/Show/35271/0/convert-boolean-to-number

        if (!childList) {
            // 不包含子元件，那么直接跟相同的连接
            res |=
                +(a0 === block) |
                (+(a1 === block) << 1) |
                (+(a2 === block) << 2) |
                (+(a3 === block) << 3) |
                (+(a4 === block) << 4) |
                (+(a5 === block) << 5) |
                (+(a6 === block) << 6) |
                (+(a7 === block) << 7);
        } else {
            res |=
                +childList.has(a0) |
                (+childList.has(a1) << 1) |
                (+childList.has(a2) << 2) |
                (+childList.has(a3) << 3) |
                (+childList.has(a4) << 4) |
                (+childList.has(a5) << 5) |
                (+childList.has(a6) << 6) |
                (+childList.has(a7) << 7);
        }

        return {
            connection: res,
            center: block
        };
    }

    render(
        autotile: number,
        connection: number
    ): Generator<IAutotileRenderable, void> | null {
        const cls = this.manager.getBlockCls(autotile);
        if (cls !== BlockCls.Autotile) return null;
        const tile = this.manager.getTile(autotile)!;
        return this.fromStaticRenderable(tile.static(), connection);
    }

    private getStaticRectList(
        renderable: ITextureRenderable
    ): AutotileFrameList {
        const { x, y, w, h } = renderable.rect;
        const type = h === 128 ? AutotileType.Big3x4 : AutotileType.Small2x3;
        if (w === 96) {
            return {
                type,
                rects: [renderable.rect]
            };
        } else {
            return {
                type,
                rects: [
                    { x: x + 0, y, w, h },
                    { x: x + 96, y, w, h },
                    { x: x + 192, y, w, h },
                    { x: x + 288, y, w, h }
                ]
            };
        }
    }

    private getConnectedRect(
        ox: number,
        oy: number,
        connection: ConnectedAutotile
    ): ConnectedAutotile | null {
        const { lt, rt, rb, lb } = connection;

        return {
            lt: { x: ox + lt.x, y: oy + lt.y, w: lt.w, h: lt.h },
            rt: { x: ox + rt.x, y: oy + rt.y, w: rt.w, h: rt.h },
            rb: { x: ox + rb.x, y: oy + rb.y, w: rb.w, h: rb.h },
            lb: { x: ox + lb.x, y: oy + lb.y, w: lb.w, h: lb.h }
        };
    }

    *fromStaticRenderable(
        renderable: ITextureRenderable,
        connection: number
    ): Generator<IAutotileRenderable, void> | null {
        const { type, rects } = this.getStaticRectList(renderable);
        const map = type === AutotileType.Big3x4 ? rectMap3x4 : rectMap2x3;
        const data = map.get(connection);
        if (!data) {
            logger.error(27);
            return null;
        }
        if (rects.length === 1) {
            const { x, y } = rects[0];
            const connected = this.getConnectedRect(x, y, data);
            if (!connected) return null;
            const res: IAutotileRenderable = {
                source: renderable.source,
                lt: connected.lt,
                rt: connected.rt,
                rb: connected.rb,
                lb: connected.lb
            };
            yield res;
        } else {
            for (const { x, y } of rects) {
                const connected = this.getConnectedRect(x, y, data);
                if (!connected) return null;
                const res: IAutotileRenderable = {
                    source: renderable.source,
                    lt: connected.lt,
                    rt: connected.rt,
                    rb: connected.rb,
                    lb: connected.lb
                };
                yield res;
            }
        }
    }

    fromAnimatedRenderable(
        renderable: ITextureRenderable,
        connection: number
    ): IAutotileRenderable | null {
        const { x, y, h } = renderable.rect;
        const type = h === 128 ? AutotileType.Big3x4 : AutotileType.Small2x3;
        const map = type === AutotileType.Big3x4 ? rectMap3x4 : rectMap2x3;
        const data = map.get(connection);
        if (!data) {
            logger.error(27);
            return null;
        }
        const connected = this.getConnectedRect(x, y, data);
        if (!connected) return null;
        const res: IAutotileRenderable = {
            source: renderable.source,
            lt: connected.lt,
            rt: connected.rt,
            rb: connected.rb,
            lb: connected.lb
        };
        return res;
    }

    *fromAnimatedGenerator(
        texture: ITexture,
        generator: Generator<ITextureRenderable> | null,
        connection: number
    ): Generator<IAutotileRenderable, void> | null {
        if (!generator) return null;
        const h = texture.height;
        const type = h === 128 ? AutotileType.Big3x4 : AutotileType.Small2x3;
        const map = type === AutotileType.Big3x4 ? rectMap3x4 : rectMap2x3;
        const data = map.get(connection);
        if (!data) {
            logger.error(27);
            return null;
        }
        while (true) {
            const value = generator.next();
            if (value.done) break;
            const renderable = value.value;
            const { x, y } = renderable.rect;
            const connected = this.getConnectedRect(x, y, data);
            if (!connected) return null;
            const res: IAutotileRenderable = {
                source: renderable.source,
                lt: connected.lt,
                rt: connected.rt,
                rb: connected.rb,
                lb: connected.lb
            };
            yield res;
        }
    }
}

/**
 * 映射自动元件连接
 * @param target 输出映射对象
 * @param mode 自动元件类型，1 表示 3x4，2 表示 2x3
 */
function mapAutotile(
    target: Map<number, [number, number, number, number]>,
    mode: 1 | 2
) {
    const h = mode === 1 ? 2 : 1; // 横向偏移因子
    const v = mode === 1 ? 12 : 4; // 纵向偏移因子
    const luo = mode === 1 ? 12 : 8; // leftup origin
    const ruo = mode === 1 ? 17 : 11; // rightup origin
    const ldo = mode === 1 ? 42 : 20; // leftdown origin
    const rdo = mode === 1 ? 47 : 23; // rightdown origin
    const luc = mode === 1 ? 4 : 2; // leftup corner
    const ruc = mode === 1 ? 5 : 3; // rightup corner
    const rdc = mode === 1 ? 11 : 7; // rightdown corner
    const ldc = mode === 1 ? 10 : 6; // leftdown corner

    for (let i = 0; i <= 0b1111_1111; i++) {
        // 自动元件由四个更小的矩形组合而成
        // 初始状态下，四个矩形分别处在四个角的位置
        // 而且对应角落的矩形只可能出现在每个大区块的对应角落

        let lu = luo; // leftup
        let ru = ruo; // rightup
        let ld = ldo; // leftdown
        let rd = rdo; // rightdown

        // 先看四个方向，最后看斜角方向
        if (i & 0b0000_0001) {
            // 左侧有连接，左侧两个矩形向右偏移两个因子
            lu += h * 2;
            ld += h * 2;
            // 如果右侧还有连接，那么右侧矩形和左侧矩形需要移动至中间
            // 但是由于后面还处理了先右侧再左侧的情况，因此需要先向右偏移一个因子
            // 结果就是先向右移动了一个因子，在后面又向左移动了两个因子，因此相当于向左移动了一个因子
            if (i & 0b0001_0000) {
                ru += h;
                rd += h;
            }
        }
        if (i & 0b0000_0100) {
            // 下侧有连接，下侧两个矩形向上偏移两个因子
            ld -= v * 2;
            rd -= v * 2;
            if (i & 0b0100_0000) {
                lu -= v;
                ru -= v;
            }
        }
        if (i & 0b0001_0000) {
            // 右侧有连接，右侧矩形向左移动两个因子
            ru -= h * 2;
            rd -= h * 2;
            if (i & 0b0000_0001) {
                lu -= h;
                ld -= h;
            }
        }
        if (i & 0b0100_0000) {
            // 上侧有链接，上侧矩形向下移动两个因子
            lu += v * 2;
            ru += v * 2;
            if (i & 0b0000_0100) {
                ld += v;
                rd += v;
            }
        }
        // 斜角
        // 如果左上仅与上和左连接
        if ((i & 0b1100_0001) === 0b0100_0001) {
            lu = luc;
        }
        // 如果右上仅与上和右连接
        if ((i & 0b0111_0000) === 0b0101_0000) {
            ru = ruc;
        }
        // 如果右下仅与右和下连接
        if ((i & 0b0001_1100) === 0b0001_0100) {
            rd = rdc;
        }
        // 如果左下仅与左和下连接
        if ((i & 0b0000_0111) === 0b0000_0101) {
            ld = ldc;
        }
        target.set(i, [lu, ru, rd, ld]);
    }
}

export function createAutotile() {
    mapAutotile(connectionMap3x4, 1);
    mapAutotile(connectionMap2x3, 2);

    connectionMap3x4.forEach((data, connection) => {
        const [ltd, rtd, rbd, lbd] = data;
        const ltx = (ltd % 6) * 16;
        const lty = Math.floor(ltd / 6) * 16;
        const rtx = (rtd % 6) * 16;
        const rty = Math.floor(rtd / 6) * 16;
        const rbx = (rbd % 6) * 16;
        const rby = Math.floor(rbd / 6) * 16;
        const lbx = (lbd % 6) * 16;
        const lby = Math.floor(lbd / 6) * 16;
        rectMap3x4.set(connection, {
            lt: { x: ltx, y: lty, w: 16, h: 16 },
            rt: { x: rtx, y: rty, w: 16, h: 16 },
            rb: { x: rbx, y: rby, w: 16, h: 16 },
            lb: { x: lbx, y: lby, w: 16, h: 16 }
        });
    });
    connectionMap2x3.forEach((data, connection) => {
        const [ltd, rtd, rbd, lbd] = data;
        const ltx = (ltd % 4) * 24;
        const lty = Math.floor(ltd / 4) * 24;
        const rtx = (rtd % 4) * 24;
        const rty = Math.floor(rtd / 4) * 24;
        const rbx = (rbd % 4) * 24;
        const rby = Math.floor(rbd / 4) * 24;
        const lbx = (lbd % 4) * 24;
        const lby = Math.floor(lbd / 4) * 24;
        rectMap2x3.set(connection, {
            lt: { x: ltx, y: lty, w: 24, h: 24 },
            rt: { x: rtx, y: rty, w: 24, h: 24 },
            rb: { x: rbx, y: rby, w: 24, h: 24 },
            lb: { x: lbx, y: lby, w: 24, h: 24 }
        });
    });
}
