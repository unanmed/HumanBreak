import { FloorItemDetail } from '@/plugin/fx/itemDetail';
import { FloorDamageExtends } from './preset/damage';
import { LayerDoorAnimate } from './preset/floor';
import { HeroRenderer } from './preset/hero';
import { MotaRenderer } from './render';
import { LayerShadowExtends } from '../fx/shadow';
import { LayerGroupFilter } from '@/plugin/fx/gameCanvas';
import { LayerGroupAnimate } from './preset/animate';
import { LayerGroupPortal } from '@/plugin/fx/portal';
import { LayerGroupHalo } from '@/plugin/fx/halo';
import { FloorViewport } from './preset/viewport';
import { PopText } from '@/plugin/fx/pop';
import { FloorChange } from '@/plugin/fallback';
import { render } from './renderer';
import { defineComponent, ref } from 'vue';

let main: MotaRenderer;

Mota.require('var', 'loading').once('coreInit', () => {
    main = new MotaRenderer();

    const Com = defineComponent(props => {
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
