import { FloorItemDetail } from '@/plugin/fx/itemDetail';
import { FloorDamageExtends } from './preset/damage';
import { LayerDoorAnimate, LayerGroupFloorBinder } from './preset/floor';
import { HeroRenderer } from './preset/hero';
import { LayerGroup, FloorLayer } from './preset/layer';
import { MotaRenderer } from './render';
import { LayerShadowExtends } from '../fx/shadow';

let main: MotaRenderer;

export function getMainRenderer() {
    return main;
}

Mota.require('var', 'loading').once('loaded', () => {
    const render = new MotaRenderer();
    main = render;
    render.mount();
    render.hide();

    const layer = new LayerGroup();

    ['bg', 'bg2', 'event', 'fg', 'fg2'].forEach(v => {
        layer.addLayer(v as FloorLayer);
    });

    const damage = new FloorDamageExtends();
    const hero = new HeroRenderer();
    const detail = new FloorItemDetail();
    const door = new LayerDoorAnimate();
    const shadow = new LayerShadowExtends();
    layer.extends(damage);
    layer.extends(detail);
    layer.getLayer('event')?.extends(hero);
    layer.getLayer('event')?.extends(door);
    layer.getLayer('event')?.extends(shadow);

    render.appendChild(layer);
});

Mota.require('var', 'hook').on('reset', () => {
    main.show();
});

Mota.require('var', 'hook').on('restart', () => {
    main.hide();
});
