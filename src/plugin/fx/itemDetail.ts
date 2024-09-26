import { logger } from '@/core/common/logger';
import { mainSetting } from '@/core/main/setting';
import {
    Damage,
    DamageRenderable,
    FloorDamageExtends
} from '@/core/render/preset/damage';
import { LayerGroupFloorBinder } from '@/core/render/preset/floor';
import {
    ILayerGroupRenderExtends,
    LayerGroup
} from '@/core/render/preset/layer';

interface ItemDetailData {
    x: number;
    y: number;
    diff: Record<string | symbol, number | undefined>;
}

interface ItemData {
    id: AllIdsOf<'items'>;
    x: number;
    y: number;
}

const ItemState = Mota.require('module', 'State').ItemState;
Mota.require('var', 'hook').on('setBlock', (x, y, floorId, block) => {
    FloorItemDetail.listened.forEach(v => {
        v.setBlock(block, x, y);
    });
});

export class FloorItemDetail implements ILayerGroupRenderExtends {
    id: string = 'item-detail';

    group!: LayerGroup;
    floorBinder!: LayerGroupFloorBinder;
    damage!: FloorDamageExtends;
    sprite!: Damage;

    /** 每个分块中包含的物品信息 */
    blockData: Map<number, Map<number, ItemData>> = new Map();

    /** 需要更新的分块 */
    private dirtyBlock: Set<number> = new Set();
    /** 道具详细信息 */
    private detailData: Map<number, Map<number, ItemDetailData>> = new Map();

    static detailColor: Record<string, CanvasStyle> = {
        atk: '#FF7A7A',
        atkper: '#FF7A7A',
        def: '#00E6F1',
        defper: '#00E6F1',
        mdef: '#6EFF83',
        mdefper: '#6EFF83',
        hp: '#A4FF00',
        hpmax: '#F9FF00',
        hpmaxper: '#F9FF00',
        mana: '#c66',
        manaper: '#c66'
    };

    static listened: Set<FloorItemDetail> = new Set();

    private onBeforeDamageRender = (block: number) => {
        if (!mainSetting.getValue('screen.itemDetail')) return;
        if (this.dirtyBlock.has(block)) {
            this.sprite.block.clearCache(block, 1);
            this.render(block);
        }
    };

    private onUpdateMapSize = (width: number, height: number) => {
        this.updateMapSize(width, height);
    };

    private onUpdate = () => {
        this.updateItems();
    };

    private onUpdateBlocks = (blocks: Set<number>) => {
        blocks.forEach(v => {
            this.dirtyBlock.add(v);
        });
    };

    private listen() {
        this.sprite.on('dirtyUpdate', this.onBeforeDamageRender);
        this.sprite.on('setMapSize', this.onUpdateMapSize);
        this.sprite.on('updateBlocks', this.onUpdateBlocks);
        this.damage.on('update', this.onUpdate);
    }

    /**
     * 更新地图大小
     */
    updateMapSize(width: number, height: number) {
        this.blockData.clear();

        // 预留blockData
        const [x, y] = this.sprite.block.getBlockXY(width, height);
        const num = x * y;
        for (let i = 0; i < num; i++) {
            this.blockData.set(i, new Map());
            this.detailData.set(i, new Map());
            this.dirtyBlock.add(i);
        }
    }

    /**
     * 更新全地图的物品，并进行分块存储
     */
    updateItems() {
        const floor = this.floorBinder.getFloor();
        if (!floor) return;
        core.extractBlocks(floor);

        core.status.maps[floor].blocks.forEach(v => {
            if (v.event.cls !== 'items' || v.disable) return;
            const id = v.event.id as AllIdsOf<'items'>;
            const item = core.material.items[id];
            if (item.cls === 'constants' || item.cls === 'tools') return;
            const x = v.x;
            const y = v.y;
            const block = this.sprite.block.getIndexByLoc(x, y);
            const index = x + y * this.sprite.mapWidth;
            const blockData = this.blockData.get(block);
            blockData?.set(index, { x, y, id });
        });
    }

    /**
     * 设置图块
     * @param block 图块数字
     * @param x 横坐标
     * @param y 纵坐标
     */
    setBlock(block: AllNumbers, x: number, y: number) {
        const map = maps_90f36752_8815_4be8_b32b_d7fad1d0542e;
        const index = this.sprite.block.getIndexByLoc(x, y);
        const itemIndex = x + y * this.sprite.mapWidth;
        const blockData = this.blockData.get(index);
        this.dirtyBlock.add(index);
        if (block === 0) {
            blockData?.delete(itemIndex);
            return;
        }
        const cls = map[block].cls;
        if (cls !== 'items') {
            blockData?.delete(itemIndex);
            return;
        }
        const id = map[block].id;
        blockData?.set(itemIndex, { x, y, id });
    }

    /**
     * 计算指定分块中的物品信息
     * @param block 要计算的分块
     */
    calAllItems(block: Set<number>) {
        if (this.dirtyBlock.size === 0 || block.size === 0) return;
        let diff: Record<string | symbol, number | undefined> = {};
        const before = core.status.hero;
        const hero = structuredClone(core.status.hero);
        const handler: ProxyHandler<any> = {
            set(target, key, v) {
                diff[key] = v - (target[key] || 0);
                if (!diff[key]) diff[key] = void 0;
                return true;
            }
        };
        core.status.hero = new Proxy(hero, handler);

        core.setFlag('__statistics__', true);
        block.forEach(v => {
            if (!this.dirtyBlock.has(v)) return;
            const data = this.blockData.get(v);
            const detail = this.detailData.get(v);
            detail?.clear();
            if (!data) return;
            data.forEach(v => {
                const { id, x, y } = v;
                const index = x + y * this.sprite.mapWidth;
                diff = {};

                const item = core.material.items[id];
                if (item.cls === 'equips') {
                    // 装备也显示
                    const diff: Record<string, any> = {
                        ...(item.equip.value ?? {})
                    };
                    const per = item.equip.percentage ?? {};
                    for (const name of Object.keys(per)) {
                        const n = name as SelectKey<HeroStatus, number>;
                        diff[name + 'per'] = per[n].toString() + '%';
                    }
                    detail?.set(index, { x, y, diff });
                    return;
                }

                // @ts-ignore
                ItemState.item(id)?.itemEffectFn();
                detail?.set(index, { x, y, diff });
            });
        });
        core.status.hero = before;
        window.hero = before;
        window.flags = before.flags;
    }

    /**
     * 计算并渲染指定格子里面的物品
     * @param block 需要渲染的格子
     */
    render(block: number) {
        this.calAllItems(new Set([block]));
        const data = this.detailData;

        if (!this.dirtyBlock.has(block)) return;
        this.dirtyBlock.delete(block);
        const info = data.get(block);
        if (!info) return;

        info.forEach(({ x, y, diff }) => {
            let n = 0;
            for (const [key, value] of Object.entries(diff)) {
                if (!value) continue;
                const color = FloorItemDetail.detailColor[key] ?? '#fff';
                const text = core.formatBigNumber(value, 4);
                const renderable: DamageRenderable = {
                    x: x * this.sprite.cellSize + 2,
                    y: y * this.sprite.cellSize + 31 - n * 10,
                    text,
                    color,
                    align: 'left',
                    baseline: 'alphabetic'
                };
                this.sprite.renderable.get(block)?.add(renderable);
                n++;
            }
        });
    }

    awake(group: LayerGroup): void {
        this.group = group;

        const binder = group.getExtends('floor-binder');
        const damage = group.getExtends('floor-damage');
        if (
            binder instanceof LayerGroupFloorBinder &&
            damage instanceof FloorDamageExtends
        ) {
            this.floorBinder = binder;
            this.damage = damage;
            this.sprite = damage.sprite;
            this.listen();
            FloorItemDetail.listened.add(this);
        } else {
            logger.warn(1001);
            group.removeExtends('item-detail');
        }
    }

    onDestroy(group: LayerGroup): void {
        this.sprite.off('beforeDamageRender', this.onBeforeDamageRender);
        this.sprite.off('setMapSize', this.onUpdateMapSize);
        FloorItemDetail.listened.delete(this);
    }
}
