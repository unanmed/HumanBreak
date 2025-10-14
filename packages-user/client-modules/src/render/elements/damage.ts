import {
    ERenderItemEvent,
    RenderItem,
    MotaOffscreenCanvas2D,
    Transform,
    transformCanvas
} from '@motajs/render-core';
import { logger } from '@motajs/common';
import EventEmitter from 'eventemitter3';
import { isNil } from 'lodash-es';
import { IDamageEnemy, IEnemyCollection, MapDamage } from '@motajs/types';
import { BlockCacher, ICanvasCacheItem, CanvasCacheItem } from './block';
import {
    ILayerGroupRenderExtends,
    LayerGroupFloorBinder,
    LayerGroup,
    Layer,
    calNeedRenderOf
} from './layer';
import { MAP_BLOCK_WIDTH, MAP_HEIGHT, MAP_WIDTH } from '../shared';

/**
 * 根据伤害大小获取颜色
 * @param damage 伤害大小
 */
export function getDamageColor(damage: number): string {
    if (typeof damage !== 'number') return '#f00';
    if (damage === 0) return '#2f2';
    if (damage < 0) return '#7f7';
    if (damage < core.status.hero.hp / 3) return '#fff';
    if (damage < (core.status.hero.hp * 2) / 3) return '#ff4';
    if (damage < core.status.hero.hp) return '#f93';
    return '#f22';
}

interface EFloorDamageEvent {
    update: [floor: FloorIds];
}

export class FloorDamageExtends
    extends EventEmitter<EFloorDamageEvent>
    implements ILayerGroupRenderExtends
{
    id: string = 'floor-damage';

    floorBinder!: LayerGroupFloorBinder;
    group!: LayerGroup;
    sprite!: Damage;

    /**
     * 立刻刷新伤害渲染
     */
    update(floor: FloorIds) {
        if (!this.sprite || !floor) return;
        const map = core.status.maps[floor];
        this.sprite.setMapSize(map.width, map.height);
        const { ensureFloorDamage } = Mota.require('@user/data-state');
        ensureFloorDamage(floor);
        const enemy = core.status.maps[floor].enemy;

        this.sprite.updateCollection(enemy);
        this.emit('update', floor);
    }

    /**
     * 创建显伤层
     */
    private create() {
        if (this.sprite) return;
        const sprite = new Damage();
        sprite.setZIndex(80);
        this.group.appendChild(sprite);
        this.sprite = sprite;
    }

    private onUpdate = (floor: FloorIds) => {
        if (!this.floorBinder.bindThisFloor) {
            const { ensureFloorDamage } = Mota.require('@user/data-state');
            ensureFloorDamage(floor);
            core.status.maps[floor].enemy.calRealAttribute();
        }
        this.update(floor);
    };

    // private onSetBlock = (x: number, y: number, floor: FloorIds) => {
    //     this.sprite.enemy?.once('extract', () => {
    //         if (floor !== this.sprite.enemy?.floorId) return;
    //         this.sprite.updateBlocks();
    //     });
    //     if (!this.floorBinder.bindThisFloor) {
    //         this.sprite.enemy?.extract();
    //     }
    // };

    /**
     * 进行楼层更新监听
     */
    private listen() {
        this.floorBinder.on('update', this.onUpdate);
        // this.floorBinder.on('setBlock', this.onSetBlock);
    }

    awake(group: LayerGroup): void {
        const ex = group.getExtends('floor-binder');
        if (ex instanceof LayerGroupFloorBinder) {
            this.floorBinder = ex;
            this.group = group;
            this.create();
            this.listen();
        } else {
            logger.warn(17);
            group.removeExtends('floor-damage');
        }
    }

    onDestroy(_group: LayerGroup): void {
        this.floorBinder.off('update', this.onUpdate);
        // this.floorBinder.off('setBlock', this.onSetBlock);
    }
}

export interface DamageRenderable {
    x: number;
    y: number;
    align: CanvasTextAlign;
    baseline: CanvasTextBaseline;
    text: string;
    color: CanvasStyle;
    font?: string;
    stroke?: CanvasStyle;
    strokeWidth?: number;
}

export interface EDamageEvent extends ERenderItemEvent {
    setMapSize: [width: number, height: number];
    beforeDamageRender: [need: Set<number>, transform: Transform];
    updateBlocks: [blocks: Set<number>];
    dirtyUpdate: [block: number];
}

export class Damage extends RenderItem<EDamageEvent> {
    mapWidth: number = 0;
    mapHeight: number = 0;

    block: BlockCacher<ICanvasCacheItem>;
    /** 键表示分块索引，值表示在这个分块上的渲染信息（当然实际渲染位置可以不在这个分块上） */
    renderable: Map<number, Set<DamageRenderable>> = new Map();

    /** 当前渲染怪物列表 */
    enemy?: IEnemyCollection;
    /** 每个分块中包含的怪物集合 */
    blockData: Map<number, Map<number, IDamageEnemy>> = new Map();
    /** 单元格大小 */
    cellSize: number = 32;

    /** 默认伤害字体 */
    font: string = '300 9px Verdana';
    /** 默认描边样式，当伤害文字不存在描边属性时会使用此属性 */
    strokeStyle: CanvasStyle = '#000';
    /** 默认描边宽度 */
    strokeWidth: number = 2;

    /** 要懒更新的所有分块 */
    private dirtyBlocks: Set<number> = new Set();

    constructor() {
        super('absolute', false, true);

        this.block = new BlockCacher(0, 0, MAP_BLOCK_WIDTH, 1);
        this.type = 'absolute';
        this.size(MAP_WIDTH, MAP_HEIGHT);
        this.setHD(true);
        this.setAntiAliasing(true);
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        this.renderDamage(canvas, transform);
    }

    private onExtract = () => {
        if (this.enemy) this.updateCollection(this.enemy);
    };

    /**
     * 设置地图大小，后面应紧跟更新怪物列表
     */
    setMapSize(width: number, height: number) {
        this.mapWidth = width;
        this.mapHeight = height;
        this.enemy = void 0;
        this.blockData.clear();
        this.renderable.clear();
        this.block.size(width, height);

        // 预留blockData
        const w = this.block.blockData.width;
        const h = this.block.blockData.height;
        const num = w * h;
        for (let i = 0; i < num; i++) {
            this.blockData.set(i, new Map());
            this.renderable.set(i, new Set());
            this.dirtyBlocks.add(i);
        }

        this.emit('setMapSize', width, height);
    }

    /**
     * 设置每个图块的大小
     */
    setCellSize(size: number) {
        this.cellSize = size;
        this.update();
    }

    /**
     * 更新怪物列表。更新后，{@link Damage.enemy} 会丢失原来的怪物列表引用，换为传入的列表引用
     * @param enemy 怪物列表
     */
    updateCollection(enemy: IEnemyCollection) {
        if (this.enemy !== enemy) {
            this.enemy?.off('calculated', this.onExtract);
            enemy.on('calculated', this.onExtract);
        }
        this.enemy = enemy;
        this.blockData.forEach(v => v.clear());
        this.renderable.forEach(v => v.clear());
        this.block.clearAllCache();
        const w = this.block.blockData.width;
        const h = this.block.blockData.height;
        const num = w * h;
        for (let i = 0; i < num; i++) {
            this.dirtyBlocks.add(i);
        }

        enemy.list.forEach(v => {
            if (isNil(v.x) || isNil(v.y)) return;
            const index = this.block.getIndexByLoc(v.x, v.y);
            this.blockData.get(index)?.set(v.y * this.mapWidth + v.x, v);
        });
        // this.updateBlocks();

        this.update(this);
    }

    /**
     * 更新指定矩形区域内的渲染信息
     * @param x 左上角横坐标
     * @param y 左上角纵坐标
     * @param width 宽度
     * @param height 高度
     */
    updateRenderable(x: number, y: number, width: number, height: number) {
        this.updateBlocks(this.block.updateElementArea(x, y, width, height));
    }

    /**
     * 更新指定分块
     * @param blocks 要更新的分块集合
     * @param map 是否更新地图伤害
     */
    updateBlocks(blocks?: Set<number>) {
        if (blocks) {
            blocks.forEach(v => this.dirtyBlocks.add(v));
            this.emit('updateBlocks', blocks);
        } else {
            this.blockData.forEach((_v, i) => {
                this.dirtyBlocks.add(i);
            });
            this.emit('updateBlocks', new Set(this.blockData.keys()));
        }
        this.update(this);
    }

    /**
     * 更新指定位置的怪物信息
     */
    updateEnemyOn(x: number, y: number) {
        const enemy = this.enemy?.get(x, y);
        const block = this.block.getIndexByLoc(x, y);
        const data = this.blockData.get(block);
        const index = x + y * this.mapWidth;
        if (!data) return;
        if (!enemy) {
            data.delete(index);
        } else {
            data.set(index, enemy);
        }

        this.update(this);

        // 渲染懒更新，优化性能表现
        this.dirtyBlocks.add(block);
    }

    /**
     * 更新单个分块
     * @param block 更新的分块
     * @param map 是否更新地图伤害
     */
    private updateBlock(block: number, map: boolean = true) {
        const data = this.blockData.get(block);
        if (!data) return;

        this.block.clearCache(block, 1);
        const renderable = this.renderable.get(block)!;

        renderable.clear();
        data.forEach(v => this.extract(v, renderable));
        if (map) this.extractMapDamage(block, renderable);
    }

    /**
     * 将怪物解析为renderable的伤害
     * @param enemy 怪物
     * @param block 怪物所属分块
     */
    private extract(enemy: IDamageEnemy, block: Set<DamageRenderable>) {
        if (enemy.progress !== 4) return;
        const x = enemy.x!;
        const y = enemy.y!;
        const { damage } = enemy.calDamage();
        const cri = enemy.calCritical(1)[0]?.atkDelta ?? Infinity;

        const dam1: DamageRenderable = {
            align: 'left',
            baseline: 'alphabetic',
            text: isFinite(damage) ? core.formatBigNumber(damage, true) : '???',
            color: getDamageColor(damage),
            x: x * this.cellSize + 1,
            y: y * this.cellSize + this.cellSize - 1
        };
        const dam2: DamageRenderable = {
            align: 'left',
            baseline: 'alphabetic',
            text: isFinite(cri) ? core.formatBigNumber(cri, true) : '?',
            color: '#fff',
            x: x * this.cellSize + 1,
            y: y * this.cellSize + this.cellSize - 11
        };
        block.add(dam1).add(dam2);
    }

    /**
     * 解析指定分块的地图伤害
     * @param block 分块索引
     */
    private extractMapDamage(block: number, renderable: Set<DamageRenderable>) {
        if (!this.enemy) return;
        const damage = this.enemy.mapDamage;
        const [sx, sy, ex, ey] = this.block.getRectOfIndex(block);
        for (let x = sx; x < ex; x++) {
            for (let y = sy; y < ey; y++) {
                const loc = `${x},${y}`;
                const dam = damage[loc];
                if (!dam) continue;
                this.pushMapDamage(x, y, renderable, dam);
            }
        }
    }

    /**
     * 解析所有地图伤害
     */
    private extractAllMapDamage() {
        // todo: 测试性能，这样真的会更快吗？或许能更好的优化？或者是根本不需要这个函数？
        if (!this.enemy) return;
        for (const [loc, enemy] of Object.entries(this.enemy.mapDamage)) {
            const [sx, sy] = loc.split(',');
            const x = Number(sx);
            const y = Number(sy);
            const block = this.renderable.get(this.block.getIndexByLoc(x, y))!;
            this.pushMapDamage(x, y, block, enemy);
        }
    }

    private pushMapDamage(
        x: number,
        y: number,
        block: Set<DamageRenderable>,
        dam: MapDamage
    ) {
        // todo: 这个应当可以自定义，通过地图伤害注册实现
        let text = '';
        const color = '#fa3';
        const font = '300 9px Verdana';
        if (dam.damage > 0) {
            text = core.formatBigNumber(dam.damage, true);
        } else if (dam.ambush) {
            text = `!`;
        } else if (dam.repulse) {
            text = '阻';
        }

        const mapDam: DamageRenderable = {
            align: 'center',
            baseline: 'middle',
            text,
            color,
            font,
            x: x * this.cellSize + this.cellSize / 2,
            y: y * this.cellSize + this.cellSize / 2
        };
        block.add(mapDam);
    }

    /**
     * 计算需要渲染哪些块
     */
    calNeedRender(transform: Transform) {
        if (this.parent instanceof LayerGroup) {
            // 如果处于地图组中，每个地图的渲染区域应该是一样的，因此可以缓存优化
            return this.parent.cacheNeedRender(transform, this.block);
        } else if (this.parent instanceof Layer) {
            // 如果是地图的子元素，直接调用Layer的计算函数
            return this.parent.calNeedRender(transform);
        } else {
            return calNeedRenderOf(transform, this.cellSize, this.block);
        }
    }

    /**
     * 渲染伤害层
     * @param transform 变换矩阵
     */
    renderDamage(canvas: MotaOffscreenCanvas2D, transform: Transform) {
        // console.time('damage');
        const { ctx } = canvas;
        ctx.save();
        transformCanvas(canvas, transform);

        const render = this.calNeedRender(transform);
        const block = this.block;
        const cell = this.cellSize;
        const size = cell * block.blockSize;

        this.emit('beforeDamageRender', render, transform);

        render.forEach(v => {
            const [x, y] = block.getBlockXYByIndex(v);
            const bx = x * block.blockSize;
            const by = y * block.blockSize;
            const px = bx * cell;
            const py = by * cell;

            // todo: 是否真的需要缓存
            // 检查有没有缓存
            const cache = block.cache.get(v);
            if (cache && cache.symbol === cache.canvas.symbol) {
                ctx.drawImage(cache.canvas.canvas, px, py, size, size);
                return;
            }

            if (this.dirtyBlocks.has(v)) {
                this.updateBlock(v, true);
            }
            this.emit('dirtyUpdate', v);

            // 否则依次渲染并写入缓存
            const temp = block.cache.get(v)?.canvas ?? this.requireCanvas();
            temp.clear();
            temp.setHD(true);
            temp.setAntiAliasing(true);
            temp.size(size, size);
            const { ctx: ct } = temp;

            ct.translate(-px, -py);
            ct.lineJoin = 'round';
            ct.lineCap = 'round';

            const render = this.renderable.get(v);

            render?.forEach(v => {
                if (!v) return;
                ct.fillStyle = v.color;
                ct.textAlign = v.align;
                ct.textBaseline = v.baseline;
                ct.font = v.font ?? this.font;
                ct.strokeStyle = v.stroke ?? this.strokeStyle;
                ct.lineWidth = v.strokeWidth ?? this.strokeWidth;

                ct.strokeText(v.text, v.x, v.y);
                ct.fillText(v.text, v.x, v.y);
            });

            ctx.drawImage(temp.canvas, px, py, size, size);
            block.cache.set(v, new CanvasCacheItem(temp, temp.symbol, this));
        });
        ctx.restore();
        // console.timeEnd('damage');
    }

    protected handleProps(
        key: string,
        _prevValue: any,
        nextValue: any
    ): boolean {
        switch (key) {
            case 'mapWidth':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setMapSize(nextValue, this.mapHeight);
                return true;
            case 'mapHeight':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setMapSize(this.mapWidth, nextValue);
                return true;
            case 'cellSize':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.setCellSize(nextValue);
                return true;
            case 'enemy':
                if (!this.assertType(nextValue, 'object', key)) return false;
                this.updateCollection(nextValue);
                return true;
            case 'font':
                if (!this.assertType(nextValue, 'string', key)) return false;
                this.font = nextValue;
                this.update();
                return true;
            case 'strokeStyle':
                this.strokeStyle = nextValue;
                this.update();
                return true;
            case 'strokeWidth':
                if (!this.assertType(nextValue, 'number', key)) return false;
                this.strokeWidth = nextValue;
                this.update();
                return true;
        }
        return false;
    }

    destroy(): void {
        super.destroy();
        this.block.destroy();
        this.enemy?.off('extract', this.onExtract);
    }
}

// const adapter = new RenderAdapter<Damage>('damage');
