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
import { cloneDeep } from 'lodash-es';

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

class FloorItemDetail implements ILayerGroupRenderExtends {
    id: string = 'item-detail';

    group!: LayerGroup;
    floorBinder!: LayerGroupFloorBinder;
    damage!: FloorDamageExtends;
    sprite!: Damage;

    /** 每个分块中包含的物品信息 */
    blockData: Map<number, Set<ItemData>> = new Map();

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

    private onBeforeRender = (need: Set<number>) => {
        if (!mainSetting.getValue('screen.itemDetail')) return;
        this.render(need);
    };

    private onUpdateMapSize = (width: number, height: number) => {
        this.updateMapSize(width, height);
    };

    private listen() {
        this.sprite.on('beforeDamageRender', this.onBeforeRender);
        this.sprite.on('setMapSize', this.onUpdateMapSize);
    }

    /**
     * 更新地图大小
     */
    updateMapSize(width: number, height: number) {
        this.blockData.clear();

        // 预留blockData
        const num = width * height;
        for (let i = 0; i < num; i++) {
            this.blockData.set(i, new Set());
        }
    }

    /**
     * 更新全地图的物品，并进行分块存储
     */
    updateItems() {
        const floor = this.floorBinder.getFloor();
        core.extractBlocks(floor);

        core.status.maps[floor].blocks.forEach(v => {
            if (v.event.cls !== 'items' || v.disable) return;
            const id = v.event.id as AllIdsOf<'items'>;
            const item = core.material.items[id];
            if (item.cls === 'constants' || item.cls === 'tools') return;
            const x = v.x;
            const y = v.y;
            const block = this.sprite.block.getIndexByLoc(x, y);
            this.blockData.get(block)?.add({ x, y, id });
        });
    }

    /**
     * 计算指定分块中的物品信息
     * @param block 要计算的分块
     */
    calAllItems(block: Set<number>) {
        let diff: Record<string | symbol, number | undefined> = {};
        const before = core.status.hero;
        const hero = cloneDeep(core.status.hero);
        const handler: ProxyHandler<any> = {
            set(target, key, v) {
                diff[key] = v - (target[key] || 0);
                if (!diff[key]) diff[key] = void 0;
                return true;
            }
        };
        core.status.hero = new Proxy(hero, handler);

        const res: Map<number, Set<ItemDetailData>> = new Map();
        core.setFlag('__statistics__', true);
        block.forEach(v => {
            const data = this.blockData.get(v);
            if (!data) return;
            const info: Set<ItemDetailData> = new Set();
            data.forEach(v => {
                const { x, y, id } = v;
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
                    info.add({ x, y, diff });
                    return;
                }

                // @ts-ignore
                ItemState.item(id)?.itemEffectFn();
                info.add({ x, y, diff });
            });
            res.set(v, info);
        });
        core.status.hero = before;
        window.hero = before;
        window.flags = before.flags;

        return res;
    }

    /**
     * 计算并渲染指定格子里面的物品
     * @param block 需要渲染的格子
     */
    render(block: Set<number>) {
        const data = this.calAllItems(block);
        data.forEach((info, k) => {
            info.forEach(({ x, y, diff }) => {
                let n = 0;
                for (const [key, value] of Object.entries(diff)) {
                    if (!value) continue;
                    const color = FloorItemDetail.detailColor[key] ?? '#fff';
                    const text = value.toString();
                    const renderable: DamageRenderable = {
                        x: x * this.sprite.cellSize + 2,
                        y: y * this.sprite.cellSize + 31 - n * 10,
                        text,
                        color,
                        align: 'left',
                        baseline: 'alphabetic'
                    };
                    this.sprite.renderable.get(k)?.add(renderable);
                    n++;
                }
            });
        });
    }

    awake(group: LayerGroup): void {
        this.group = group;
        group.requestBeforeFrame(() => {
            const binder = group.getExtends('floor-binder');
            const damage = group.getExtends('floor-damage');
            if (
                binder instanceof LayerGroupFloorBinder &&
                damage instanceof FloorDamageExtends
            ) {
                this.floorBinder = binder;
                this.damage = damage;
                group.requestAfterFrame(() => {
                    this.sprite = damage.sprite;
                    this.listen();
                });
            } else {
                logger.warn(
                    1001,
                    `Item-detail extends needs 'floor-binder' and 'floor-damage' as dependency`
                );
                group.removeExtends('item-detail');
            }
        });
    }

    onDestroy(group: LayerGroup): void {
        this.sprite.off('beforeDamageRender', this.onBeforeRender);
        this.sprite.off('setMapSize', this.onUpdateMapSize);
    }
}
