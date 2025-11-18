import { isNil } from 'lodash-es';
import {
    IMapLayer,
    IMapLayerData,
    IMapLayerExtends,
    IMapLayerExtendsController
} from './types';
import { logger } from '@motajs/common';

interface IExtendsData {
    readonly ex: IMapLayerExtends;
    readonly controller: IMapLayerExtendsController;
}

export class MapLayer implements IMapLayer {
    width: number;
    height: number;
    empty: boolean = true;

    /** 已经加载完毕的图层拓展 */
    private loadedExtends: Set<IExtendsData> = new Set();
    /** 添加的图层拓展 */
    private addedExtends: Map<string, IExtendsData> = new Map();

    /** 地图图块数组 */
    private mapArray: Uint32Array;
    /** 地图数据引用 */
    private mapData: IMapLayerData;

    constructor(array: Uint32Array, width: number, height: number) {
        this.width = width;
        this.height = height;
        const area = width * height;
        this.mapArray = new Uint32Array(area);
        // 超出的裁剪，不足的补零
        this.mapArray.set(array);
        this.mapData = {
            expired: false,
            array: this.mapArray
        };
    }

    resize(width: number, height: number): void {
        if (this.width === width && this.height === height) {
            this.loadedExtends.forEach(v => {
                v.ex.onResize?.(v.controller, width, height);
            });
            return;
        }
        this.mapData.expired = true;
        const before = this.mapArray;
        const beforeWidth = this.width;
        const beforeHeight = this.height;
        const beforeArea = beforeWidth * beforeHeight;
        this.width = width;
        this.height = height;
        const area = width * height;
        const newArray = new Uint32Array(area);
        this.mapArray = newArray;
        // 将原来的地图数组赋值给现在的
        if (beforeArea > area) {
            // 如果地图变小了，那么直接设置，不需要补零
            for (let ny = 0; ny < height; ny++) {
                const begin = ny * beforeWidth;
                newArray.set(before.subarray(begin, begin + width), ny * width);
            }
        } else {
            // 如果地图变大了，那么需要补零。因为新数组本来就是用 0 填充的，实际上只要赋值就可以了
            for (let ny = 0; ny < beforeHeight; ny++) {
                const begin = ny * beforeWidth;
                newArray.set(
                    before.subarray(begin, begin + beforeWidth),
                    ny * width
                );
            }
        }
        this.mapData = {
            expired: false,
            array: this.mapArray
        };
        this.loadedExtends.forEach(v => {
            v.ex.onResize?.(v.controller, width, height);
        });
    }

    resize2(width: number, height: number): void {
        if (this.width === width && this.height === height) {
            this.mapArray.fill(0);
            this.loadedExtends.forEach(v => {
                v.ex.onResize?.(v.controller, width, height);
            });
            return;
        }
        this.mapData.expired = true;
        this.width = width;
        this.height = height;
        this.mapArray = new Uint32Array(width * height);
        this.mapData = {
            expired: false,
            array: this.mapArray
        };
        this.loadedExtends.forEach(v => {
            v.ex.onResize?.(v.controller, width, height);
        });
        this.empty = true;
    }

    setBlock(block: number, x: number, y: number): void {
        const index = y * this.width + x;
        this.mapArray[index] = block;
        this.loadedExtends.forEach(v => {
            v.ex.onUpdateBlock?.(v.controller, block, x, y);
        });
        if (block !== 0) {
            this.empty = false;
        }
    }

    getBlock(x: number, y: number): number {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            // 不在地图内，返回 -1
            return -1;
        }
        return this.mapArray[y * this.width + x];
    }

    putMapData(array: Uint32Array, x: number, y: number, width: number): void {
        if (array.length % width !== 0) {
            logger.warn(8);
        }
        const height = Math.ceil(array.length / width);
        if (width === this.width && height === this.height) {
            this.mapArray.set(array);
            this.loadedExtends.forEach(v => {
                v.ex.onUpdateArea?.(v.controller, x, y, width, height);
            });
            return;
        }
        const w = this.width;
        const r = x + width;
        const b = y + height;
        if (x < 0 || y < 0 || r > w || b > this.height) {
            logger.warn(9);
        }
        const nl = Math.max(x, 0);
        const nt = Math.max(y, 0);
        const nr = Math.min(r, w);
        const nb = Math.min(b, this.height);
        const nw = nr - nl;
        const nh = nb - nt;
        let empty = true;
        for (let ny = 0; ny < nh; ny++) {
            const start = ny * nw;
            const offset = (ny + nt) * w + nl;
            const sub = array.subarray(start, start + nw);
            if (empty && sub.some(v => v !== 0)) {
                // 空地图判断
                empty = false;
            }
            this.mapArray.set(array.subarray(start, start + nw), offset);
        }
        this.loadedExtends.forEach(v => {
            v.ex.onUpdateArea?.(v.controller, x, y, width, height);
        });
        this.empty &&= empty;
    }

    getMapData(): Uint32Array;
    getMapData(
        x: number,
        y: number,
        width: number,
        height: number
    ): Uint32Array;
    getMapData(
        x?: number,
        y?: number,
        width?: number,
        height?: number
    ): Uint32Array {
        if (isNil(x)) {
            return new Uint32Array(this.mapArray);
        }
        if (isNil(y) || isNil(width) || isNil(height)) {
            logger.warn(80);
            return new Uint32Array();
        }
        const w = this.width;
        const h = this.height;
        const r = x + width;
        const b = y + height;
        if (x < 0 || y < 0 || r > w || b > h) {
            logger.warn(81);
        }
        const res = new Uint32Array(width * height);
        const arr = this.mapArray;
        const nr = Math.min(r, w);
        const nb = Math.min(b, h);
        for (let nx = x; nx < nr; nx++) {
            for (let ny = y; ny < nb; ny++) {
                const origin = ny * w + nx;
                const target = (ny - y) * width + (nx - x);
                res[target] = arr[origin];
            }
        }
        return res;
    }

    /**
     * 获取地图数据的内部存储直接引用
     */
    getMapRef(): IMapLayerData {
        return this.mapData;
    }

    loadExtends(ex: IMapLayerExtends): boolean {
        if (!this.addedExtends.has(ex.id)) return false;
        ex.awake?.();
        const data = this.addedExtends.get(ex.id)!;
        this.loadedExtends.add(data);
        return true;
    }

    addExtends(ex: IMapLayerExtends): IMapLayerExtendsController {
        const controller = new MapLayerExtendsController(this, ex);
        this.addedExtends.set(ex.id, {
            ex,
            controller
        });
        return controller;
    }

    removeExtends(ex: IMapLayerExtends | string): void {
        const id = typeof ex === 'string' ? ex : ex.id;
        const data = this.addedExtends.get(id);
        if (!data) return;
        data.ex.destroy?.();
        this.addedExtends.delete(id);
        this.loadedExtends.delete(data);
    }
}

class MapLayerExtendsController implements IMapLayerExtendsController {
    loaded: boolean = false;

    constructor(
        readonly layer: MapLayer,
        readonly ex: IMapLayerExtends
    ) {}

    load(): void {
        this.loaded = this.layer.loadExtends(this.ex);
    }

    getMapData(): Readonly<IMapLayerData> {
        return this.layer.getMapRef();
    }

    unload(): void {
        this.layer.removeExtends(this.ex);
        this.loaded = false;
    }
}
