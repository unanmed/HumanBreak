import { Container } from '@/core/render/container';
import { FloorDamageExtends } from '@/core/render/preset/damage';
import { LayerGroupFloorBinder } from '@/core/render/preset/floor';
import { HeroRenderer } from '@/core/render/preset/hero';
import { FloorLayer, LayerGroup } from '@/core/render/preset/layer';
import { FloorViewport } from '@/core/render/preset/viewport';
import { MotaRenderer } from '@/core/render/render';
import { Transform } from '@/core/render/transform';
import { FloorItemDetail } from '@/plugin/fx/itemDetail';

const loopMaps = Mota.require('module', 'Mechanism').MiscData.loopMaps;

let loopLayer: LayerGroup;
let show: boolean = false;
/** 循环式地图中，更新视角的委托ticker */
let delegation: number = -1;

const hook = Mota.require('var', 'hook');
hook.on('changingFloor', (floorId, heroLoc) => {
    enableLoopMapElement(floorId);
});

function createLayer() {
    const group = new LayerGroup();
    ['bg', 'bg2', 'event', 'fg', 'fg2'].forEach(v => {
        group.addLayer(v as FloorLayer);
    });

    const damage = new FloorDamageExtends();
    const detail = new FloorItemDetail();
    group.extends(damage);
    group.extends(detail);

    loopLayer = group;
    group.setZIndex(20);
    group.id = 'layer-loop';
}

function enableLoopMapElement(floorId: FloorIds) {
    if (!loopMaps.has(floorId)) {
        disableLoopMapElement();
        return;
    }
    if (!loopLayer) createLayer();
    const render = MotaRenderer.get('render-main');
    const draw = render?.getElementById('map-draw') as Container;
    const group = render?.getElementById('layer-main') as LayerGroup;
    if (!draw || !group) return;
    const ex = loopLayer.getExtends('floor-binder') as LayerGroupFloorBinder;
    const viewport = group.getExtends('viewport') as FloorViewport;
    if (!ex || !viewport) return;
    ex.bindFloor(floorId);

    draw.appendChild(loopLayer);
    show = true;

    const floor = core.status.maps[floorId];
    viewport.setAutoBound(false);
    const transform = group.camera;
    const width = floor.width;
    const testPos = width * loopLayer.cellSize;

    loopLayer.removeTicker(delegation);
    delegation = loopLayer.delegateTicker(() => {
        const [x1] = Transform.transformed(transform, 0, 0);
        const camera = loopLayer.camera;
        if (x1 > 0) {
            // 这个是计算循环地图应该显示在哪
            const [, y2] = Transform.transformed(transform, x1 - testPos, 0);
            camera.reset();
            camera.translate(core._PX_ - testPos, y2);
            loopLayer.pos(transform.x - core._PX_, 0);
            loopLayer.show();
            loopLayer.update(loopLayer);
        } else {
            const [x2, y2] = Transform.transformed(transform, testPos, 0);
            if (x2 < core._PX_) {
                // 这个不用做其他运算，可以直接显示
                camera.reset();
                camera.translate(0, y2);
                loopLayer.pos(x2, 0);
                loopLayer.show();
                loopLayer.update(loopLayer);
            } else {
                loopLayer.hide();
            }
        }
    });
}

function disableLoopMapElement() {
    if (!show) return;
    show = false;
    loopLayer.remove();

    const render = MotaRenderer.get('render-main');
    const group = render?.getElementById('layer-main') as LayerGroup;
    if (!group) return;
    const viewport = group.getExtends('viewport') as FloorViewport;
    if (!viewport) return;

    viewport.setAutoBound(true);
    loopLayer.removeTicker(delegation);
}
