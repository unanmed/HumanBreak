import { FloorItemDetail } from '@/plugin/fx/itemDetail';
import { FloorDamageExtends } from './preset/damage';
import { LayerGroupFloorBinder } from './preset/floor';
import { HeroRenderer } from './preset/hero';
import { LayerGroup, FloorLayer } from './preset/layer';
import { MotaRenderer } from './render';

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
    layer.extends(damage);
    layer.extends(detail);
    layer.getLayer('event')?.extends(hero);

    render.appendChild(layer);
});

Mota.require('var', 'hook').on('reset', () => {
    main.show();
});

Mota.require('var', 'hook').on('restart', () => {
    main.hide();
});
