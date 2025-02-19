import { FloorItemDetail } from '@/plugin/fx/itemDetail';
import { FloorDamageExtends, LayerGroup } from '@/core/render';
import { LayerDoorAnimate } from '@/core/render';
import { HeroRenderer } from '@/core/render';
import { MotaRenderer } from '@/core/render';
import { LayerShadowExtends } from '@/core/fx/shadow';
import { LayerGroupFilter } from '@/plugin/fx/gameCanvas';
import { LayerGroupAnimate } from '@/core/render';
import { LayerGroupPortal } from '@/plugin/fx/portal';
import { LayerGroupHalo } from '@/plugin/fx/halo';
import { FloorViewport } from '@/core/render';
import { PopText } from '@/plugin/fx/pop';
import { FloorChange } from '@/plugin/fallback';
import { createApp } from '@/core/render';
import { defineComponent, onMounted, ref } from 'vue';
import { Textbox } from './components';
import { ILayerGroupRenderExtends, ILayerRenderExtends } from '@/core/render';
import { Props } from '@/core/render';
import { WeatherController } from '../weather';
import { UIController } from '@/core/system';

export function create() {
    const main = new MotaRenderer();

    const App = defineComponent(_props => {
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
            fontFamily: 'normal',
            titleFont: '700 20px normal',
            winskin: 'winskin2.png',
            interval: 100,
            lineHeight: 6
        };

        const map = ref<LayerGroup>();
        const weather = new WeatherController('main');

        onMounted(() => {
            weather.bind(map.value);
        });

        const ui = new UIController('main-ui');

        return () => (
            <container id="map-draw" {...mapDrawProps}>
                <container width={480} height={480}>
                    {ui.render()}
                </container>
                <layer-group id="layer-main" ex={layerGroupExtends} ref={map}>
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

    Mota.require('var', 'hook').on('reset', () => {
        main.show();
    });

    Mota.require('var', 'hook').on('restart', () => {
        main.hide();
    });

    console.log(main);
}

export * from './components';
