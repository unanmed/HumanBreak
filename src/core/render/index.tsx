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
import { createApp } from './renderer';
import { defineComponent } from 'vue';
import { Textbox } from './components';
import { ILayerGroupRenderExtends, ILayerRenderExtends } from './preset';
import { Props } from './utils';

let main: MotaRenderer;

Mota.require('var', 'loading').once('coreInit', () => {
    main = new MotaRenderer();

    const App = defineComponent(props => {
        const layerGroupExtends: ILayerGroupRenderExtends[] = [
            new FloorDamageExtends(),
            new FloorItemDetail(),
            new LayerGroupFilter(),
            new LayerGroupPortal(),
            new LayerGroupHalo(),
            new LayerGroupAnimate(),
            new FloorViewport()
        ];
        const eventExtends: ILayerRenderExtends[] = [
            new HeroRenderer(),
            new LayerDoorAnimate(),
            new LayerShadowExtends()
        ];
        const mapDrawProps: Props<'container'> = {
            width: core._PX_,
            height: core._PY_
        };
        const mainTextboxProps: Props<typeof Textbox> = {
            text: '',
            hidden: true,
            width: 480,
            height: 150,
            y: 330,
            zIndex: 30,
            fillStyle: '#fff',
            titleFill: 'gold',
            font: '16px normal',
            titleFont: '700 20px normal',
            winskin: 'winskin2.png',
            interval: 25,
            lineHeight: 6
        };

        return () => (
            <container id="map-draw" {...mapDrawProps}>
                <layer-group id="layer-main" ex={layerGroupExtends}>
                    <layer layer="bg" zIndex={10}></layer>
                    <layer layer="bg2" zIndex={20}></layer>
                    <layer layer="event" zIndex={30} ex={eventExtends}></layer>
                    <layer layer="fg" zIndex={40}></layer>
                    <layer layer="fg2" zIndex={50}></layer>
                    <PopText id="pop-main" zIndex={80}></PopText>
                </layer-group>
                <Textbox id="main-textbox" {...mainTextboxProps}></Textbox>
                <FloorChange id="floor-change" zIndex={50}></FloorChange>
            </container>
        );
    });

    main.hide();
    createApp(App).mount(main);
    // render(<Com></Com>, main);

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
export * from './components';
