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
import { PopText } from '@/plugin/fx/pop';
import { FloorChange } from '@/plugin/fallback';
import { onTick, render } from './renderer';
import { MotaOffscreenCanvas2D } from '../fx/canvas2d';
import { SpriteComponent } from './renderer/elements';
import { defineComponent, onActivated, onMounted, ref } from 'vue';
import { Ticker } from 'mutate-animate';
import { Sprite } from './sprite';

let main: MotaRenderer;

Mota.require('var', 'loading').once('coreInit', () => {
    main = new MotaRenderer();

    const Com = defineComponent(props => {
        const group = ref<LayerGroup>();

        return () => (
            <container
                id="map-draw"
                hd
                antiAliasing={false}
                width={core._PX_}
                height={core._PY_}
            >
                <layer-group
                    id="layer-main"
                    ref={group}
                    ex={[
                        new FloorDamageExtends(),
                        new FloorItemDetail(),
                        new LayerGroupFilter(),
                        new LayerGroupPortal(),
                        new LayerGroupHalo(),
                        new LayerGroupAnimate(),
                        new FloorViewport()
                    ]}
                >
                    <layer layer="bg" zIndex={10}></layer>
                    <layer layer="bg2" zIndex={20}></layer>
                    <layer
                        layer="event"
                        zIndex={30}
                        ex={[
                            new HeroRenderer(),
                            new LayerDoorAnimate(),
                            new LayerShadowExtends()
                        ]}
                    ></layer>
                    <layer layer="fg" zIndex={40}></layer>
                    <layer layer="fg2" zIndex={50}></layer>
                    <PopText id="pop-main" zIndex={80}></PopText>
                </layer-group>
                <FloorChange id="floor-change" zIndex={50}></FloorChange>
            </container>
        );
    });

    main.hide();
    render(<Com></Com>, main);

    // const mapDraw = new Container();
    // const layer = new LayerGroup();
    // const pop = new PopText('static');
    // const floorChange = new FloorChange('static');
    // mapDraw.id = 'map-draw';
    // layer.id = 'layer-main';
    // pop.id = 'pop-main';
    // floorChange.id = 'floor-change';

    // mapDraw.setHD(true);
    // mapDraw.setAntiAliasing(false);
    // mapDraw.size(core._PX_, core._PY_);
    // floorChange.size(480, 480);
    // floorChange.setHD(true);
    // floorChange.setZIndex(50);
    // floorChange.setTips(tips);
    // pop.setZIndex(80);

    // ['bg', 'bg2', 'event', 'fg', 'fg2'].forEach(v => {
    //     layer.addLayer(v as FloorLayer);
    // });

    // const damage = new FloorDamageExtends();
    // const hero = new HeroRenderer();
    // const detail = new FloorItemDetail();
    // const door = new LayerDoorAnimate();
    // const shadow = new LayerShadowExtends();
    // const filter = new LayerGroupFilter();
    // const animate = new LayerGroupAnimate();
    // const portal = new LayerGroupPortal();
    // const halo = new LayerGroupHalo();
    // const viewport = new FloorViewport();
    // layer.extends(damage);
    // layer.extends(detail);
    // layer.extends(filter);
    // layer.extends(portal);
    // layer.extends(halo);
    // layer.getLayer('event')?.extends(hero);
    // layer.getLayer('event')?.extends(door);
    // layer.getLayer('event')?.extends(shadow);
    // layer.extends(animate);
    // layer.extends(viewport);

    // main.appendChild(mapDraw);
    // mapDraw.appendChild(layer);
    // layer.appendChild(pop);
    // mapDraw.appendChild(floorChange);
    console.log(main);
});

Mota.require('var', 'hook').on('reset', () => {
    main.show();
});

Mota.require('var', 'hook').on('restart', () => {
    main.hide();
});

export * from './preset';
export * from './renderer';
export * from './adapter';
export * from './cache';
export * from './camera';
export * from './container';
export * from './gl2';
export * from './item';
export * from './render';
export * from './shader';
export * from './sprite';
export * from './transform';
export * from './utils';
