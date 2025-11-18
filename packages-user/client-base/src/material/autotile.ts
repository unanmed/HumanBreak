import {
    IRect,
    ITextureRenderable,
    SizedCanvasImageSource
} from '@motajs/render-assets';
import {
    AutotileConnection,
    AutotileType,
    BlockCls,
    IAutotileConnection,
    IAutotileProcessor,
    IMaterialFramedData,
    IMaterialManager
} from './types';
import { isNil } from 'lodash-es';

interface ConnectedAutotile {
    readonly lt: Readonly<IRect>;
    readonly rt: Readonly<IRect>;
    readonly rb: Readonly<IRect>;
    readonly lb: Readonly<IRect>;
}

export interface IAutotileData {
    /** 图像源 */
    readonly source: SizedCanvasImageSource;
    /** 自动元件帧数 */
    readonly frames: number;
}

/** 3x4 自动元件的连接映射，元组表示将对应大小的自动元件按照格子 1/4 大小切分后对应的索引位置 */
const connectionMap3x4 = new Map<number, [number, number, number, number]>();
/** 2x3 自动元件的连接映射，元组表示将对应大小的自动元件按照格子 1/4 大小切分后对应的索引位置 */
const connectionMap2x3 = new Map<number, [number, number, number, number]>();
/** 3x4 自动元件各方向连接的矩形映射 */
const rectMap3x4 = new Map<number, ConnectedAutotile>();
/** 2x3 自动元件各方向连接的矩形映射 */
const rectMap2x3 = new Map<number, ConnectedAutotile>();
/** 不重复连接映射，用于平铺自动元件，一共 48 种 */
const distinctConnectionMap = new Map<number, number>();

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

    setConnection(autotile: number, parent: number): void {
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
                return 0b1110_1111;
            } else if (index === length - 1) {
                return 0b1111_1110;
            } else {
                return 0b1110_1110;
            }
        }
        // 如果地图宽度只有 1
        if (width === 1) {
            if (index === 0) {
                return 0b1111_1011;
            } else if (index === length - 1) {
                return 0b1011_1111;
            } else {
                return 0b1011_1011;
            }
        }

        // 正常地图

        const lastLine = length - width;
        const x = index % width;

        // 四个角，左上，右上，右下，左下
        if (index === 0) {
            return 0b1110_0011;
        } else if (index === width - 1) {
            return 0b1111_1000;
        } else if (index === length - 1) {
            return 0b0011_1110;
        } else if (index === lastLine) {
            return 0b1000_1111;
        }
        // 四条边，上，右，下，左
        else if (index < width) {
            return 0b1110_0000;
        } else if (x === width - 1) {
            return 0b0011_1000;
        } else if (index > lastLine) {
            return 0b0000_1110;
        } else if (x === 0) {
            return 0b1000_0011;
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
        const block = array[index];
        if (block === 0) {
            return {
                connection: 0,
                center: 0
            };
        }
        let res: number = this.connectEdge(array.length, index, width);
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

        if (!childList || childList.size === 0) {
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

    updateConnectionFor(
        connection: number,
        center: number,
        target: number,
        direction: AutotileConnection
    ): number {
        const childList = this.childMap.get(center);
        if (!childList || !childList.has(target)) {
            return connection & ~direction;
        } else {
            return connection | direction;
        }
    }

    /**
     * 检查贴图是否是一个自动元件
     * @param tile 贴图数据
     */
    private checkAutotile(tile: IMaterialFramedData) {
        if (tile.cls !== BlockCls.Autotile) return false;
        const { texture, frames } = tile;
        if (texture.width !== 96 * frames) return false;
        if (texture.height === 128 || texture.height === 144) return true;
        else return false;
    }

    render(autotile: number, connection: number): ITextureRenderable | null {
        const tile = this.manager.getTile(autotile);
        if (!tile) return null;
        if (!this.checkAutotile(tile)) return null;
        return this.renderWithoutCheck(tile, connection);
    }

    renderWith(
        tile: IMaterialFramedData,
        connection: number
    ): ITextureRenderable | null {
        if (!this.checkAutotile(tile)) return null;
        return this.renderWithoutCheck(tile, connection);
    }

    renderWithoutCheck(
        tile: IMaterialFramedData,
        connection: number
    ): ITextureRenderable | null {
        const { texture } = tile;
        const size = texture.height === 32 * 48 ? 32 : 48;
        const index = distinctConnectionMap.get(connection);
        if (isNil(index)) return null;
        const { rect } = texture.render();
        return {
            source: texture.source,
            rect: { x: rect.x, y: rect.y + size * index, w: size, h: size }
        };
    }

    *renderAnimated(
        autotile: number,
        connection: number
    ): Generator<ITextureRenderable, void> {
        const tile = this.manager.getTile(autotile);
        if (!tile) return;
        yield* this.renderAnimatedWith(tile, connection);
    }

    *renderAnimatedWith(
        tile: IMaterialFramedData,
        connection: number
    ): Generator<ITextureRenderable, void> {
        if (!this.checkAutotile(tile)) return;
        const { texture, frames } = tile;
        const size = texture.height === 128 ? 32 : 48;
        const index = distinctConnectionMap.get(connection);
        if (isNil(index)) return;
        for (let i = 0; i < frames; i++) {
            yield {
                source: texture.source,
                rect: { x: i * size, y: size * index, w: size, h: size }
            };
        }
    }

    /**
     * 将自动元件图片展平，平铺存储 48 种样式，此时可以只通过一次绘制来绘制出自动元件，不需要四次绘制
     * @param image 原始自动元件图片
     */
    static flatten(image: IAutotileData): SizedCanvasImageSource | null {
        const { source, frames } = image;
        if (source.width !== frames * 96) return null;
        if (source.height !== 128 && source.height !== 144) return null;
        const type =
            source.height === 128 ? AutotileType.Big3x4 : AutotileType.Small2x3;
        const size = type === AutotileType.Big3x4 ? 32 : 48;
        const width = frames * size;
        const height = 48 * size;
        // 画到画布上
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        const half = size / 2;
        const map = type === AutotileType.Big3x4 ? rectMap3x4 : rectMap2x3;
        const used = new Set<number>();
        // 遍历每个组合
        distinctConnectionMap.forEach((index, conn) => {
            if (used.has(conn)) return;
            used.add(conn);
            const { lt, rt, rb, lb } = map.get(conn)!;
            const y = index * size;
            for (let i = 0; i < frames; i++) {
                const x = i * size;
                // prettier-ignore
                ctx.drawImage(source, lt.x + i * 96, lt.y, lt.w, lt.h, x, y, half, half);
                // prettier-ignore
                ctx.drawImage(source, rt.x + i * 96, rt.y, rt.w, rt.h, x + half, y, half, half);
                // prettier-ignore
                ctx.drawImage(source, rb.x + i * 96, rb.y, rb.w, rb.h, x + half, y + half, half, half);
                // prettier-ignore
                ctx.drawImage(source, lb.x + i * 96, lb.y, lb.w, lb.h, x, y + half, half, half);
            }
        });

        return canvas;
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
    const usedRect: [number, number, number, number][] = [];
    let flag = 0;
    // 2x3 和 3x4 的自动元件连接方式一样，因此没必要映射两次
    connectionMap2x3.forEach((conn, num) => {
        const index = usedRect.findIndex(
            used =>
                used[0] === conn[0] &&
                used[1] === conn[1] &&
                used[2] === conn[2] &&
                used[3] === conn[3]
        );
        if (index === -1) {
            distinctConnectionMap.set(num, flag);
            usedRect.push(conn.slice() as [number, number, number, number]);
            flag++;
        } else {
            distinctConnectionMap.set(num, index);
        }
    });
}
