import { logger } from '@/core/common/logger';
import { LayerGroupFloorBinder } from './floor';
import {
    calNeedRenderOf,
    ILayerGroupRenderExtends,
    Layer,
    LayerGroup
} from './layer';
import { ESpriteEvent, Sprite } from '../sprite';
import { BlockCacher } from './block';
import type {
    DamageEnemy,
    EnemyCollection,
    MapDamage
} from '@/game/enemy/damage';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { isNil } from 'lodash-es';
import { getDamageColor } from '@/plugin/utils';
import { transformCanvas } from '../item';
import EventEmitter from 'eventemitter3';
import { Transform } from '../transform';

const ensureFloorDamage = Mota.require('fn', 'ensureFloorDamage');

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
        if (!this.sprite) return;
        const map = core.status.maps[floor];
        this.sprite.setMapSize(map.width, map.height);
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
        this.group.appendChild(sprite);
        this.sprite = sprite;
    }

    private onUpdate = (floor: FloorIds) => {
        this.sprite.requestBeforeFrame(() => {
            this.update(floor);
        });
    };

    private onSetBlock = (x: number, y: number, floor: FloorIds) => {
        this.sprite.enemy?.once('extract', () => {
            if (floor !== this.sprite.enemy?.floorId) return;
            this.sprite.updateEnemyOn(x, y);
        });
    };

    /**
     * 进行楼层更新监听
     */
    private listen() {
        this.floorBinder.on('update', this.onUpdate);
        this.floorBinder.on('setBlock', this.onSetBlock);
    }

    awake(group: LayerGroup): void {
        group.requestBeforeFrame(() => {
            const ex = group.getExtends('floor-binder');
            if (ex instanceof LayerGroupFloorBinder) {
                this.floorBinder = ex;
                this.group = group;
                this.create();
                this.listen();
            } else {
                logger.warn(
                    17,
                    `Floor-damage extends needs 'floor-binder' extends as dependency.`
                );
                group.removeExtends('floor-damage');
            }
        });
    }

    onDestroy(group: LayerGroup): void {
        this.floorBinder.off('update', this.onUpdate);
        this.floorBinder.off('setBlock', this.onSetBlock);
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

interface DamageCache {
    canvas: MotaOffscreenCanvas2D;
    symbol: number;
}

interface EDamageEvent extends ESpriteEvent {
    setMapSize: [width: number, height: number];
    beforeDamageRender: [need: Set<number>, transform: Transform];
}

export class Damage extends Sprite<EDamageEvent> {
    mapWidth: number = 0;
    mapHeight: number = 0;

    block: BlockCacher<DamageCache>;
    /** 键表示分块索引，值表示在这个分块上的渲染信息（当然实际渲染位置可以不在这个分块上） */
    renderable: Map<number, Set<DamageRenderable>> = new Map();

    /** 当前渲染怪物列表 */
    enemy?: EnemyCollection;
    /** 每个分块中包含的怪物集合 */
    blockData: Map<number, Map<number, DamageEnemy>> = new Map();
    /** 单元格大小 */
    cellSize: number = 32;

    /** 伤害渲染层 */
    damageMap: MotaOffscreenCanvas2D = new MotaOffscreenCanvas2D();
    /** 默认伤害字体 */
    font: string = "14px 'normal'";
    /** 默认描边样式，当伤害文字不存在描边属性时会使用此属性 */
    strokeStyle: CanvasStyle = '#000';
    /** 默认描边宽度 */
    strokeWidth: number = 2;

    /** 单个点的懒更新 */
    private needUpdateBlock: boolean = false;
    /** 要懒更新的所有分块 */
    private needUpdateBlocks: Set<number> = new Set();

    constructor() {
        super('absolute', false);

        this.block = new BlockCacher(0, 0, core._WIDTH_, 1);
        this.type = 'absolute';
        this.size(core._PX_, core._PY_);
        this.damageMap.withGameScale(true);
        this.damageMap.setHD(true);
        this.damageMap.setAntiAliasing(true);
        this.damageMap.size(core._PX_, core._PY_);

        this.setRenderFn((canvas, camera) => {
            const { ctx } = canvas;
            const { width, height } = canvas.canvas;
            ctx.imageSmoothingEnabled = false;
            this.renderDamage(camera);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(this.damageMap.canvas, 0, 0, width, height);
        });
    }

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
        }

        this.emit('setMapSize', width, height);
    }

    /**
     * 更新怪物列表。更新后，{@link Damage.enemy} 会丢失原来的怪物列表引用，换为传入的列表引用
     * @param enemy 怪物列表
     */
    updateCollection(enemy: EnemyCollection) {
        if (this.enemy === enemy) return;
        this.enemy = enemy;
        this.blockData.forEach(v => v.clear());
        this.renderable.forEach(v => v.clear());
        this.block.clearAllCache();

        enemy.list.forEach(v => {
            if (isNil(v.x) || isNil(v.y)) return;
            const index = this.block.getIndexByLoc(v.x, v.y);
            this.blockData.get(index)?.set(v.y * this.mapWidth + v.x, v);
        });
        this.updateBlocks();

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
     */
    updateBlocks(blocks?: Set<number>) {
        if (blocks) {
            blocks.forEach(v => this.updateBlock(v));
        } else {
            this.blockData.forEach((_, k) => this.updateBlock(k, false));
            this.extractAllMapDamage();
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
        if (!this.needUpdateBlock) {
            this.needUpdateBlocks.add(block);
            this.requestBeforeFrame(() => {
                this.needUpdateBlock = false;
                this.needUpdateBlocks.forEach(v => this.updateBlock(v, false));
                // todo: 阻击夹域等地图伤害检测是否必要更新，例如不包含阻击夹域的怪就不必要更新这个怪物信息
                // this.extractAllMapDamage();
            });
            this.needUpdateBlock = true;
        }
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
    private extract(enemy: DamageEnemy, block: Set<DamageRenderable>) {
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
        let color = '#fa3';
        if (dam.damage > 0) {
            text = core.formatBigNumber(dam.damage, true);
        } else if (dam.mockery) {
            dam.mockery.sort((a, b) =>
                a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]
            );
            const [tx, ty] = dam.mockery[0];
            const dir = x > tx ? '←' : x < tx ? '→' : y > ty ? '↑' : '↓';
            text = '嘲' + dir;
            color = '#fd4';
        } else if (dam.hunt) {
            text = '猎';
            color = '#fd4';
        } else {
            return;
        }

        const mapDam: DamageRenderable = {
            align: 'center',
            baseline: 'middle',
            text,
            color,
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
    renderDamage(transform: Transform) {
        // console.time('damage');
        const { ctx } = this.damageMap;
        ctx.save();
        transformCanvas(this.damageMap, transform, true);

        const { res: render } = this.calNeedRender(transform);
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
            const cache = block.cache.get(v * block.cacheDepth);
            if (cache && cache.symbol === cache.canvas.symbol) {
                ctx.drawImage(cache.canvas.canvas, px, py, size, size);
                return;
            }

            // 否则依次渲染并写入缓存
            const temp = cache?.canvas ?? new MotaOffscreenCanvas2D();
            temp.clear();
            temp.setHD(true);
            temp.setAntiAliasing(true);
            temp.withGameScale(true);
            temp.size(size, size);
            const { ctx: ct } = temp;

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
            block.cache.set(v, {
                canvas: temp,
                symbol: temp.symbol
            });
        });
        ctx.restore();
        // console.timeEnd('damage');
    }
}
