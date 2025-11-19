import {
    MotaOffscreenCanvas2D,
    RenderItem,
    Transform
} from '@motajs/render-core';
import { ILayerState, state } from '@user/data-state';
import { IMapRenderer } from './types';
import { MapRenderer } from './renderer';
import { materials } from '@user/client-base';
import { ElementNamespace, ComponentInternalInstance } from 'vue';
import { CELL_HEIGHT, CELL_WIDTH, MAP_HEIGHT, MAP_WIDTH } from '../shared';

export class MapRender extends RenderItem {
    /** 地图渲染器 */
    readonly renderer: IMapRenderer;

    constructor(readonly layerState: ILayerState) {
        super('static');

        this.renderer = new MapRenderer(materials, state.layer);
        this.renderer.setLayerState(layerState);
        this.renderer.useAsset(materials.trackedAsset);
        this.renderer.setCanvasSize(this.width, this.height);
        this.renderer.setCellSize(CELL_WIDTH, CELL_HEIGHT);
        this.renderer.setRenderSize(MAP_WIDTH, MAP_HEIGHT);

        this.delegateTicker(time => {
            this.renderer.tick(time);
            if (this.renderer.needUpdate()) {
                this.update();
            }
        });
    }

    private sizeGL(width: number, height: number) {
        const ratio = this.highResolution ? devicePixelRatio : 1;
        const scale = ratio * this.scale;
        const w = width * scale;
        const h = height * scale;
        this.renderer.setCanvasSize(w, h);
        this.renderer.setViewport(0, 0, w, h);
    }

    onResize(scale: number): void {
        super.onResize(scale);
        this.sizeGL(this.width, this.height);
    }

    size(width: number, height: number): void {
        super.size(width, height);
        this.sizeGL(width, height);
    }

    updateTransform(transform: Transform): void {
        super.updateTransform(transform);
    }

    protected render(canvas: MotaOffscreenCanvas2D): void {
        this.renderer.clear(true, true);
        const map = this.renderer.render();
        canvas.ctx.drawImage(map, 0, 0, canvas.width, canvas.height);
    }

    patchProp(
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        switch (key) {
            case 'layerState': {
                this.renderer.setLayerState(nextValue);
                break;
            }
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}
