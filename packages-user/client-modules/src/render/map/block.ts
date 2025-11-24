import { clamp } from 'lodash-es';
import {
    IBlockData,
    IBlockIndex,
    IBlockInfo,
    IBlockSplitter,
    IBlockSplitterConfig
} from './types';

export class BlockSplitter<T> implements IBlockSplitter<T> {
    blockWidth: number = 0;
    blockHeight: number = 0;
    dataWidth: number = 0;
    dataHeight: number = 0;
    width: number = 1;
    height: number = 1;

    /** 分块映射 */
    readonly blockMap: Map<number, IBlockData<T>> = new Map();

    /** 数据宽度配置 */
    private splitDataWidth: number = 0;
    /** 数据高度配置 */
    private splitDataHeight: number = 0;
    /** 单个分块的宽度配置 */
    private splitBlockWidth: number = 0;
    /** 单个分块的高度配置 */
    private splitBlockHeight: number = 0;

    /**
     * 检查坐标范围
     * @param x 分块横坐标
     * @param y 分块纵坐标
     */
    private checkLocRange(x: number, y: number) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    getBlockByLoc(x: number, y: number): IBlockData<T> | null {
        if (!this.checkLocRange(x, y)) return null;
        const index = y * this.width + x;
        return this.blockMap.get(index) ?? null;
    }

    getBlockByIndex(index: number): IBlockData<T> | null {
        return this.blockMap.get(index) ?? null;
    }

    setBlockByLoc(data: T, x: number, y: number): IBlockData<T> | null {
        if (!this.checkLocRange(x, y)) return null;
        const index = y * this.width + x;
        const block = this.blockMap.get(index);
        if (!block) return null;
        block.data = data;
        return block;
    }

    setBlockByIndex(data: T, index: number): IBlockData<T> | null {
        const block = this.blockMap.get(index);
        if (!block) return null;
        block.data = data;
        return block;
    }

    *iterateBlockByLoc(x: number, y: number): Generator<IBlockIndex, void> {
        if (!this.checkLocRange(x, y)) return;
        const index = y * this.width + x;
        yield* this.iterateBlockByIndex(index);
    }

    *iterateBlockByIndex(index: number): Generator<IBlockIndex, void> {
        const block = this.blockMap.get(index);
        if (!block) return;
        const startX = block.x * this.blockWidth;
        const startY = block.y * this.blockHeight;
        const endX = startX + block.width;
        const endY = startY + block.height;
        for (let ny = startY; ny < endY; ny++) {
            for (let nx = startX; nx < endX; nx++) {
                const index: IBlockIndex = {
                    x: nx,
                    y: ny,
                    dataX: nx * this.blockWidth,
                    dataY: ny * this.blockHeight,
                    index: ny * this.dataWidth + nx
                };
                yield index;
            }
        }
    }

    *iterateBlockByIndices(
        indices: Iterable<number>
    ): Generator<IBlockIndex, void> {
        for (const index of indices) {
            yield* this.iterateBlockByIndex(index);
        }
    }

    iterateBlocks(): Iterable<IBlockData<T>> {
        return this.blockMap.values();
    }

    *iterateBlocksOfDataArea(
        x: number,
        y: number,
        width: number,
        height: number
    ): Generator<IBlockData<T>> {
        const r = this.width - 1;
        const b = this.height - 1;
        const rx = x + width;
        const by = y + height;
        const left = clamp(Math.floor(x / this.blockWidth), 0, r);
        const top = clamp(Math.floor(y / this.blockHeight), 0, b);
        const right = clamp(Math.floor(rx / this.blockWidth), 0, r);
        const bottom = clamp(Math.floor(by / this.blockHeight), 0, b);
        for (let ny = left; ny <= right; ny++) {
            for (let nx = top; nx <= bottom; nx++) {
                const index = ny * this.width + nx;
                const block = this.blockMap.get(index);
                if (!block) continue;
                yield block;
            }
        }
    }

    getIndexByLoc(x: number, y: number): number {
        if (!this.checkLocRange(x, y)) return -1;
        return y * this.width + x;
    }

    getLocByIndex(index: number): Loc | null {
        if (index >= this.width * this.height) return null;
        return {
            x: index % this.width,
            y: Math.floor(index / this.width)
        };
    }

    getIndicesByLocList(list: Iterable<Loc>): Iterable<number> {
        const res: number[] = [];
        for (const { x, y } of list) {
            res.push(this.getIndexByLoc(x, y));
        }
        return res;
    }

    getLocListByIndices(list: Iterable<number>): Iterable<Loc | null> {
        const res: (Loc | null)[] = [];
        for (const index of list) {
            res.push(this.getLocByIndex(index));
        }
        return res;
    }

    getBlockByDataLoc(x: number, y: number): IBlockData<T> | null {
        const bx = Math.floor(x / this.blockWidth);
        const by = Math.floor(y / this.blockHeight);
        if (!this.checkLocRange(bx, by)) return null;
        const index = by * this.width + bx;
        return this.blockMap.get(index) ?? null;
    }

    getBlockByDataIndex(index: number): IBlockData<T> | null {
        const x = index % this.dataWidth;
        const y = Math.floor(index / this.dataWidth);
        return this.getBlockByDataLoc(x, y);
    }

    getIndicesByDataLocList(list: Iterable<Loc>): Set<number> {
        const res = new Set<number>();
        for (const { x, y } of list) {
            const bx = Math.floor(x / this.blockWidth);
            const by = Math.floor(y / this.blockHeight);
            if (!this.checkLocRange(bx, by)) continue;
            res.add(bx + by * this.width);
        }
        return res;
    }

    getIndicesByDataIndices(list: Iterable<number>): Set<number> {
        const res = new Set<number>();
        for (const index of list) {
            const x = index % this.dataWidth;
            const y = Math.floor(index / this.dataWidth);
            const bx = Math.floor(x / this.blockWidth);
            const by = Math.floor(y / this.blockHeight);
            if (!this.checkLocRange(bx, by)) continue;
            res.add(bx + by * this.width);
        }
        return res;
    }

    getBlocksByDataLocList(list: Iterable<Loc>): Set<IBlockData<T>> {
        const res = new Set<IBlockData<T>>();
        for (const { x, y } of list) {
            const bx = Math.floor(x / this.blockWidth);
            const by = Math.floor(y / this.blockHeight);
            if (!this.checkLocRange(bx, by)) continue;
            const index = bx + by * this.width;
            const data = this.blockMap.get(index);
            if (data) res.add(data);
        }
        return res;
    }

    getBlocksByDataIndices(list: Iterable<number>): Set<IBlockData<T>> {
        const res = new Set<IBlockData<T>>();
        for (const index of list) {
            const x = index % this.dataWidth;
            const y = Math.floor(index / this.dataWidth);
            const bx = Math.floor(x / this.blockWidth);
            const by = Math.floor(y / this.blockHeight);
            if (!this.checkLocRange(bx, by)) continue;
            const blockIndex = bx + by * this.width;
            const data = this.blockMap.get(blockIndex);
            if (data) res.add(data);
        }
        return res;
    }

    configSplitter(config: IBlockSplitterConfig): void {
        this.splitDataWidth = config.dataWidth;
        this.splitDataHeight = config.dataHeight;
        this.splitBlockWidth = config.blockWidth;
        this.splitBlockHeight = config.blockHeight;
    }

    private mapBlock(
        x: number,
        y: number,
        realWidth: number,
        width: number,
        height: number,
        fn: (block: IBlockInfo) => T
    ) {
        const index = y * realWidth + x;
        const block: IBlockInfo = {
            index,
            x,
            y,
            dataX: x * this.blockWidth,
            dataY: y * this.blockHeight,
            width,
            height
        };
        const data = fn(block);
        const blockData = new SplittedBlockData(this, block, data);
        this.blockMap.set(index, blockData);
    }

    splitBlocks(mapFn: (block: IBlockInfo) => T): void {
        this.blockMap.clear();
        this.blockWidth = this.splitBlockWidth;
        this.blockHeight = this.splitBlockHeight;
        this.dataWidth = this.splitDataWidth;
        this.dataHeight = this.splitDataHeight;
        const restX = this.splitDataWidth % this.splitBlockWidth;
        const restY = this.splitDataHeight % this.splitBlockHeight;
        const width = Math.floor(this.splitDataWidth / this.splitBlockWidth);
        const height = Math.floor(this.splitDataHeight / this.splitBlockHeight);
        const hasXRest = restX > 0;
        const hasYRest = restY > 0;
        const realWidth = hasXRest ? width + 1 : width;
        const bw = this.blockWidth;
        const bh = this.blockHeight;
        this.width = realWidth;
        this.height = hasYRest ? height + 1 : height;
        for (let ny = 0; ny < height; ny++) {
            for (let nx = 0; nx < width; nx++) {
                this.mapBlock(nx, ny, realWidth, bw, bh, mapFn);
            }
        }
        if (hasXRest) {
            for (let ny = 0; ny < height; ny++) {
                this.mapBlock(width, ny, realWidth, restX, bh, mapFn);
            }
        }
        if (hasYRest) {
            for (let nx = 0; nx < width; nx++) {
                this.mapBlock(nx, height, realWidth, bw, restY, mapFn);
            }
        }
        if (hasXRest && hasYRest) {
            this.mapBlock(width, height, realWidth, restX, restY, mapFn);
        }
    }
}

class SplittedBlockData<T> implements IBlockData<T> {
    width: number;
    height: number;
    x: number;
    y: number;
    dataX: number;
    dataY: number;
    index: number;
    data: T;

    constructor(
        readonly splitter: BlockSplitter<T>,
        info: IBlockInfo,
        data: T
    ) {
        this.width = info.width;
        this.height = info.height;
        this.x = info.x;
        this.y = info.y;
        this.dataX = info.dataX;
        this.dataY = info.dataY;
        this.index = info.index;
        this.data = data;
    }

    left(): IBlockData<T> | null {
        return this.splitter.getBlockByLoc(this.x - 1, this.y);
    }

    right(): IBlockData<T> | null {
        return this.splitter.getBlockByLoc(this.x + 1, this.y);
    }

    up(): IBlockData<T> | null {
        return this.splitter.getBlockByLoc(this.x, this.y - 1);
    }

    down(): IBlockData<T> | null {
        return this.splitter.getBlockByLoc(this.x, this.y + 1);
    }

    leftUp(): IBlockData<T> | null {
        return this.splitter.getBlockByLoc(this.x - 1, this.y - 1);
    }

    leftDown(): IBlockData<T> | null {
        return this.splitter.getBlockByLoc(this.x - 1, this.y + 1);
    }

    rightUp(): IBlockData<T> | null {
        return this.splitter.getBlockByLoc(this.x + 1, this.y - 1);
    }

    rightDown(): IBlockData<T> | null {
        return this.splitter.getBlockByLoc(this.x + 1, this.y + 1);
    }

    next(): IBlockData<T> | null {
        return this.splitter.getBlockByIndex(this.index + 1);
    }
}
