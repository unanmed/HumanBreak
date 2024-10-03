import { FloorItemDetail } from '@/plugin/fx/itemDetail';
import { FloorDamageExtends } from './preset/damage';
import { LayerDoorAnimate } from './preset/floor';
import { HeroRenderer } from './preset/hero';
import { LayerGroup, FloorLayer } from './preset/layer';
import { MotaRenderer } from './render';
import { LayerShadowExtends } from '../fx/shadow';
import { LayerGroupFilter } from '@/plugin/fx/gameCanvas';
import { LayerGroupAnimate } from './preset/animate';
import { LayerGroupPortal } from '@/plugin/fx/portal';
import { LayerGroupHalo } from '@/plugin/fx/halo';
import { FloorViewport } from './preset/viewport';
import { Container } from './container';

let main: MotaRenderer;

Mota.require('var', 'loading').once('loaded', () => {
    const render = new MotaRenderer();
    main = render;
    render.mount();
    render.hide();

    const mapDraw = new Container();
    const layer = new LayerGroup();
    mapDraw.id = 'map-draw';
    layer.id = 'layer-main';

    mapDraw.setHD(true);
    mapDraw.setAntiAliasing(false);
    mapDraw.size(core._PX_, core._PY_);

    ['bg', 'bg2', 'event', 'fg', 'fg2'].forEach(v => {
        layer.addLayer(v as FloorLayer);
    });

    const damage = new FloorDamageExtends();
    const hero = new HeroRenderer();
    const detail = new FloorItemDetail();
    const door = new LayerDoorAnimate();
    const shadow = new LayerShadowExtends();
    const filter = new LayerGroupFilter();
    const animate = new LayerGroupAnimate();
    const portal = new LayerGroupPortal();
    const halo = new LayerGroupHalo();
    const viewport = new FloorViewport();
    layer.extends(damage);
    layer.extends(detail);
    layer.extends(filter);
    layer.extends(portal);
    layer.extends(halo);
    layer.getLayer('event')?.extends(hero);
    layer.getLayer('event')?.extends(door);
    layer.getLayer('event')?.extends(shadow);
    layer.extends(animate);
    layer.extends(viewport);

    render.appendChild(mapDraw);
    mapDraw.appendChild(layer);
    console.log(render);
});

Mota.require('var', 'hook').on('reset', () => {
    main.show();
});

Mota.require('var', 'hook').on('restart', () => {
    main.hide();
});
