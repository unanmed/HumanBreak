import EventEmitter from 'eventemitter3';
import {
    FloorLayer,
    ILayerGroupRenderExtends,
    ILayerRenderExtends,
    Layer,
    LayerGroup
} from './layer';
import { texture } from '../cache';

const hook = Mota.require('var', 'hook');

hook.on('setBlock', (x, y, floor, block) => {
    const isNow = floor === core.status.floorId;
    LayerGroupFloorBinder.activedBinder.forEach(v => {
        if (floor === v.floor || (isNow && v.bindThisFloor)) {
            v.setBlock('event', block, x, y);
        }
    });
    LayerFloorBinder.listenedBinder.forEach(v => {
        if (v.layer.layer === 'event') {
            if (v.floor === floor || (isNow && v.bindThisFloor)) {
                v.setBlock(block, x, y);
            }
        }
    });
});
hook.on('changingFloor', floor => {
    // 潜在隐患：如果putRenderData改成异步，那么会变成两帧后才能真正刷新并渲染
    // 考虑到楼层转换一般不会同时执行很多次，因此这里改为立刻更新
    LayerGroupFloorBinder.activedBinder.forEach(v => {
        if (v.bindThisFloor) v.updateBindData();
    });
    LayerFloorBinder.listenedBinder.forEach(v => {
        if (v.bindThisFloor) v.updateBindData();
    });
});

interface LayerGroupBinderEvent {
    update: [floor: FloorIds];
    setBlock: [x: number, y: number, floor: FloorIds, block: AllNumbers];
}

/**
 * 楼层绑定拓展，用于LayerGroup，将楼层数据传输到渲染系统。
 * 添加后，会自动在LayerGroup包含的子Layer上添加LayerFloorBinder拓展，用于后续处理。
 * 当移除这个拓展时，其附属的所有子拓展也会一并被移除。
 */
export class LayerGroupFloorBinder
    extends EventEmitter<LayerGroupBinderEvent>
    implements ILayerGroupRenderExtends
{
    id: string = 'floor-binder';

    bindThisFloor: boolean = true;
    floor?: FloorIds;
    group!: LayerGroup;

    /** 附属的子LayerFloorBinder拓展 */
    layerBinders: Set<LayerFloorBinder> = new Set();

    private needUpdate: boolean = false;

    static activedBinder: Set<LayerGroupFloorBinder> = new Set();

    /**
     * 绑定楼层为当前楼层，并跟随变化
     */
    bindThis() {
        this.floor = void 0;
        this.bindThisFloor = true;
        this.updateBind();
    }

    /**
     * 绑定楼层为指定楼层
     * @param floorId 楼层id
     */
    bindFloor(floorId: FloorIds) {
        this.bindThisFloor = false;
        this.floor = floorId;
        this.updateBind();
    }

    /**
     * 在下一帧进行绑定数据更新
     */
    updateBind() {
        if (this.needUpdate) return;
        this.needUpdate = true;
        this.group.requestBeforeFrame(() => {
            this.needUpdate = false;
            this.updateBindData();
        });
    }

    /**
     * 立刻进行数据绑定更新
     */
    updateBindData() {
        this.layerBinders.forEach(v => {
            v.updateBindData();
        });

        const floor = this.bindThisFloor ? core.status.floorId : this.floor!;
        this.emit('update', floor);
    }

    /**
     * 设置图块
     */
    setBlock(layer: FloorLayer, block: AllNumbers, x: number, y: number) {
        const ex = this.group
            .getLayer(layer)
            ?.getExtends('floor-binder') as LayerFloorBinder;
        if (!ex) return;
        ex.setBlock(block, x, y);

        const floor = this.bindThisFloor ? core.status.floorId : this.floor!;
        this.emit('setBlock', x, y, floor, block);
    }

    private checkLayerExtends(layer: Layer) {
        const ex = layer.getExtends('floor-binder');
        if (!ex) {
            const extend = new LayerFloorBinder(this);
            layer.extends(extend);
            this.layerBinders.add(extend);
        } else {
            if (ex instanceof LayerFloorBinder) {
                ex.setParent(this);
                this.layerBinders.add(ex);
            }
        }
    }

    awake(group: LayerGroup) {
        this.group = group;
        for (const layer of group.layers.values()) {
            this.checkLayerExtends(layer);
        }
        LayerGroupFloorBinder.activedBinder.add(this);
    }

    onLayerAdd(group: LayerGroup, layer: Layer): void {
        this.checkLayerExtends(layer);
    }

    onDestroy(group: LayerGroup) {
        LayerGroupFloorBinder.activedBinder.delete(this);
        group.layers.forEach(v => {
            v.removeExtends('floor-binder');
        });
        this.removeAllListeners();
    }
}

/**
 * 楼层绑定拓展，用于Layer的楼层渲染。
 * 注意，如果目标Layer是LayerGroup的子元素，那么会自动检测父元素是否包含LayerGroupFloorBinder拓展，
 * 如果包含，那么会自动将此拓展附加至父元素的拓展。当父元素的拓展被移除时，此拓展也会一并被移除。
 */
export class LayerFloorBinder implements ILayerRenderExtends {
    id: string = 'floor-binder';

    parent?: LayerGroupFloorBinder;
    layer!: Layer;
    bindThisFloor: boolean = true;
    floor?: FloorIds;

    static listenedBinder: Set<LayerFloorBinder> = new Set();

    private needUpdate: boolean = false;

    constructor(parent?: LayerGroupFloorBinder) {
        this.parent = parent;
    }

    /**
     * 绑定楼层为当前楼层，并跟随变化
     */
    bindThis() {
        this.floor = void 0;
        this.bindThisFloor = true;
    }

    /**
     * 绑定楼层为指定楼层
     * @param floorId 楼层id
     */
    bindFloor(floorId: FloorIds) {
        this.bindThisFloor = false;
        this.floor = floorId;
    }

    /**
     * 设置这个拓展附属至的父拓展（LayerGroupFloorBinder拓展）
     * @param parent 父拓展
     */
    setParent(parent?: LayerGroupFloorBinder) {
        this.parent = parent;
        this.checkListen();
    }

    private checkListen() {
        if (this.parent) LayerFloorBinder.listenedBinder.delete(this);
        else LayerFloorBinder.listenedBinder.add(this);
    }

    /**
     * 在下一帧进行绑定数据更新
     */
    updateBind() {
        if (this.needUpdate) return;
        this.needUpdate = true;
        this.layer.requestBeforeFrame(() => {
            this.needUpdate = false;
            this.updateBindData();
        });
    }

    /**
     * 设置图块
     */
    setBlock(block: AllNumbers, x: number, y: number) {
        this.layer.putRenderData([block], 1, x, y);
    }

    /**
     * 立刻更新绑定数据，而非下一帧
     */
    updateBindData() {
        const floor = this.bindThisFloor ? core.status.floorId : this.floor;
        if (!floor) return;
        core.extractBlocks(floor);
        const map = core.status.maps[floor];
        this.layer.setMapSize(map.width, map.height);
        if (this.layer.layer === 'event') {
            const m = map.map;
            this.layer.putRenderData(m.flat(), map.width, 0, 0);
        } else {
            const m = core.maps._getBgFgMapArray(this.layer.layer!, floor);
            this.layer.putRenderData(m.flat(), map.width, 0, 0);
        }
        if (this.layer.layer === 'bg') {
            // 别忘了背景图块
            this.layer.setBackground(texture.idNumberMap[map.defaultGround]);
        }
    }

    awake(layer: Layer) {
        this.layer = layer;
        if (!this.parent) {
            const group = layer.parent;
            if (group instanceof LayerGroup) {
                const ex = group.getExtends('floor-binder');
                if (ex instanceof LayerGroupFloorBinder) {
                    this.parent = ex;
                }
            }
        }
        this.checkListen();
    }

    onDestroy(layer: Layer) {
        LayerFloorBinder.listenedBinder.delete(this);
        this.parent?.layerBinders.delete(this);
    }
}
