import {
    MotaOffscreenCanvas2D,
    RenderItem,
    Transform
} from '@motajs/render-core';
import { ILayerState, state } from '@user/data-state';
import { IMapRenderer, IMapRendererHooks } from './types';
import { MapRenderer } from './renderer';
import { materials } from '@user/client-base';
import { ElementNamespace, ComponentInternalInstance } from 'vue';
import { CELL_HEIGHT, CELL_WIDTH, MAP_HEIGHT, MAP_WIDTH } from '../shared';
import { IHookController } from '@motajs/common';

export class MapRender extends RenderItem {
    /** 地图渲染器 */
    readonly renderer: IMapRenderer;
    /** 地图视角变换矩阵 */
    readonly camera: Transform = new Transform();

    /** 地图画布 */
    readonly canvas: HTMLCanvasElement;
    /** 画布上下文 */
    readonly gl: WebGL2RenderingContext;

    private rendererHook: IHookController<IMapRendererHooks>;

    constructor(readonly layerState: ILayerState) {
        super('static');

        this.canvas = document.createElement('canvas');
        const gl = this.canvas.getContext('webgl2')!;
        this.gl = gl;

        this.renderer = new MapRenderer(
            materials,
            this.gl,
            this.camera,
            state.layer
        );
        this.renderer.setLayerState(layerState);
        this.renderer.useAsset(materials.trackedAsset);
        this.rendererHook = this.renderer.addHook(new RendererUpdateHook(this));
        this.rendererHook.load();
        this.renderer.setCellSize(CELL_WIDTH, CELL_HEIGHT);
        this.renderer.setRenderSize(MAP_WIDTH, MAP_HEIGHT);

        this.delegateTicker(time => this.renderer.tick(time));

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    private sizeGL(width: number, height: number) {
        const ratio = this.highResolution ? devicePixelRatio : 1;
        const scale = ratio * this.scale;
        this.canvas.width = width * scale;
        this.canvas.height = height * scale;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
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
        if (transform === this.camera) {
            this.update();
        }
    }

    protected render(canvas: MotaOffscreenCanvas2D): void {
        console.time('map-element-render');
        this.renderer.render(this.gl);

        canvas.ctx.drawImage(this.canvas, 0, 0, canvas.width, canvas.height);
        console.timeEnd('map-element-render');
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

class RendererUpdateHook implements Partial<IMapRendererHooks> {
    constructor(readonly element: MapRender) {}

    onUpdate(): void {
        this.element.update();
    }
}
