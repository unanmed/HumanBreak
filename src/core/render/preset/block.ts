import { EventEmitter } from '@/core/common/eventEmitter';
import { logger } from '@/core/common/logger';

interface BlockCacherEvent {
    split: () => void;
}

interface BlockData {
    /** 横向宽度，包括rest的那一个块 */
    width: number;
    /** 纵向宽度，包括rest的那一个块 */
    height: number;
    /** 横向最后一个块的宽度 */
    restWidth: number;
    /** 纵向最后一个块的高度 */
    restHeight: number;
}

export class BlockCacher<T> extends EventEmitter<BlockCacherEvent> {
    /** 区域宽度 */
    width: number;
    /** 区域高度 */
    height: number;
    /** 分块大小 */
    blockSize: number;
    /** 分块信息 */
    blockData: BlockData = {
        width: 0,
        height: 0,
        restWidth: 0,
        restHeight: 0
    };
    /** 缓存深度，例如填4的时候表示每格包含4个缓存 */
    cacheDepth: number = 1;

    /** 缓存内容，计算公式为 (x + y * width) * depth + deep */
    cache: Map<number, T> = new Map();

    constructor(
        width: number,
        height: number,
        size: number,
        depth: number = 1
    ) {
        super();
        this.width = width;
        this.height = height;
        this.blockSize = size;
        this.cacheDepth = depth;
    }

    /**
     * 设置区域大小
     * @param width 区域宽度
     * @param height 区域高度
     */
    size(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.split();
    }

    /**
     * 设置分块大小
     */
    setBlockSize(size: number) {
        this.blockSize = size;
        this.split();
    }

    /**
     * 设置缓存深度，设置后会自动将旧缓存移植到新缓存中，最大值为31
     * @param depth 缓存深度
     */
    setCacheDepth(depth: number) {
        if (depth > 31) {
            logger.error(11, `Cache depth cannot larger than 31.`);
            return;
        }
        const old = this.cache;
        const before = this.cacheDepth;
        this.cache = new Map();
        old.forEach((v, k) => {
            const index = Math.floor(k / before);
            const deep = k % before;
            this.cache.set(index * depth + deep, v);
        });
        old.clear();
        this.cacheDepth = depth;
    }

    /**
     * 执行分块
     */
    split() {
        this.blockData = {
            width: Math.ceil(this.width / this.blockSize),
            height: Math.ceil(this.height / this.blockSize),
            restWidth: this.width % this.blockSize,
            restHeight: this.height % this.blockSize
        };
        this.emit('split');
    }

    /**
     * 清除指定块的索引
     * @param index 要清除的缓存索引
     * @param deep 清除哪些深度的缓存，至多31位二进制数，例如填0b111就是清除前三层的索引
     */
    clearCache(index: number, deep: number) {
        const depth = this.cacheDepth;
        for (let i = 0; i < depth; i++) {
            if (deep & (1 << i)) {
                this.cache.delete(index * this.cacheDepth + i);
            }
        }
    }

    /**
     * 清空指定索引的缓存，与 {@link clearCache} 不同的是，这里会直接清空对应索引的缓存，而不是指定分块的缓存
     */
    clearCacheByIndex(index: number) {
        this.cache.delete(index);
    }

    /**
     * 清空所有缓存
     */
    clearAllCache() {
        this.cache.clear();
    }

    /**
     * 根据分块的横纵坐标获取其索引
     */
    getIndex(x: number, y: number) {
        return x + y * this.blockData.width;
    }

    /**
     * 根据元素位置获取分块索引（注意是单个元素的位置，而不是分块的位置）
     */
    getIndexByLoc(x: number, y: number) {
        return this.getIndex(
            Math.floor(x / this.blockSize),
            Math.floor(y / this.blockSize)
        );
    }

    /**
     * 根据块的索引获取其位置
     */
    getBlockXYByIndex(index: number): LocArr {
        const width = this.blockData.width;
        return [index % width, Math.floor(index / width)];
    }

    /**
     * 获取一个元素位置所在的分块位置（即使它不在任何分块内）
     */
    getBlockXY(x: number, y: number): LocArr {
        return [Math.floor(x / this.blockSize), Math.floor(y / this.blockSize)];
    }

    /**
     * 根据分块坐标与deep获取一个分块的精确索引
     */
    getPreciseIndex(x: number, y: number, deep: number) {
        return (x + y * this.blockSize) * this.cacheDepth + deep;
    }

    /**
     * 根据元素坐标及deep获取元素所在块的精确索引
     */
    getPreciseIndexByLoc(x: number, y: number, deep: number) {
        return this.getPreciseIndex(...this.getBlockXY(x, y), deep);
    }

    /**
     * 更新一个区域内的缓存
     * @param deep 缓存清除深度，默认全部清空
     */
    updateArea(
        x: number,
        y: number,
        width: number,
        height: number,
        deep: number = 2 ** 31 - 1
    ) {
        this.getIndexOf(x, y, width, height).forEach(v => {
            this.clearCache(v, deep);
        });
    }

    /**
     * 获取一个区域内包含的所有分块索引
     */
    getIndexOf(x: number, y: number, width: number, height: number) {
        const res = new Set<number>();
        const sx = Math.max(x, 0);
        const sy = Math.max(y, 0);
        const ex = Math.min(x + width, this.blockData.width);
        const ey = Math.min(y + height, this.blockData.height);

        for (let nx = sx; nx < ex; nx++) {
            for (let ny = sy; ny < ey; ny++) {
                const index = this.getIndexByLoc(nx, ny);
                if (res.has(index)) continue;
                res.add(index);
            }
        }

        return res;
    }
}
