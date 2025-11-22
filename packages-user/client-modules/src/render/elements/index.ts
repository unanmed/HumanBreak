import { standardElementNoCache, tagMap } from '@motajs/render-vue';
import { createCache } from './cache';
import { createFrame } from './frame';
import { createLayer, Layer, LayerGroup } from './layer';
import { createViewport } from './viewport';
import { Icon, Winskin } from './misc';
import { Animate } from './animate';
import { createItemDetail } from './itemDetail';
import { logger } from '@motajs/common';
import { MapRender, MapRenderer } from '../map';
import { state } from '@user/data-state';
import { materials } from '@user/client-base';

export function createElements() {
    createCache();
    createFrame();
    createLayer();
    createViewport();
    createItemDetail();

    // ----- 注册标签

    tagMap.register('winskin', (_0, _1, props) => {
        if (!props)
            return new Winskin(core.material.images.images['winskin.png']);
        else {
            const {
                image = core.material.images.images['winskin.png'],
                type = 'static'
            } = props;
            return new Winskin(image, type);
        }
    });
    tagMap.register('layer', (_0, _1, props) => {
        if (!props) return new Layer();
        else {
            const { ex } = props;
            const l = new Layer();

            if (ex) {
                (ex as any[]).forEach(v => {
                    l.extends(v);
                });
            }

            return l;
        }
    });
    tagMap.register('layer-group', (_0, _1, props) => {
        if (!props) return new LayerGroup();
        else {
            const { ex, layers } = props;
            const l = new LayerGroup();

            if (ex) {
                (ex as any[]).forEach(v => {
                    l.extends(v);
                });
            }
            if (layers) {
                (layers as any[]).forEach(v => {
                    l.addLayer(v);
                });
            }

            return l;
        }
    });
    tagMap.register('animation', (_0, _1, _props) => {
        return new Animate();
    });
    tagMap.register('icon', standardElementNoCache(Icon));
    tagMap.register('map-render', (_0, _1, props) => {
        if (!props) {
            logger.error(42);
            return new MapRender(
                state.layer,
                new MapRenderer(materials, state.layer)
            );
        }
        const { layerState, renderer } = props;
        if (!layerState) {
            logger.error(42, 'layerState');
            return new MapRender(
                state.layer,
                new MapRenderer(materials, state.layer)
            );
        }
        if (!renderer) {
            logger.error(42, 'renderer');
            return new MapRender(
                state.layer,
                new MapRenderer(materials, state.layer)
            );
        }
        return new MapRender(layerState, renderer);
    });
}

export * from './animate';
export * from './block';
export * from './cache';
export * from './camera';
export * from './damage';
export * from './frame';
export * from './hero';
export * from './itemDetail';
export * from './layer';
export * from './misc';
export * from './props';
export * from './utils';
export * from './viewport';
