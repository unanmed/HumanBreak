import {
    MotaOffscreenCanvas2D,
    RenderItem,
    Transform
} from '@motajs/render-core';
import { IMapLayer } from '@user/data-state';
import {
    IMapRenderer,
    IMapRendererExtends,
    MapTileAlign,
    MapTileBehavior
} from './types';
import { MapRenderer } from './renderer';
import { materials } from '@user/client-base';
import { ElementNamespace, ComponentInternalInstance } from 'vue';
import { CELL_HEIGHT, CELL_WIDTH, MAP_HEIGHT, MAP_WIDTH } from '../shared';

export interface IRenderLayerData {
    /** 图层对象 */
    readonly layer: IMapLayer;
    /** 图层纵深 */
    readonly zIndex: number;
    /** 图层别名 */
    readonly alias?: string;
}

export class MapRender extends RenderItem {
    /** 地图渲染器 */
    readonly renderer: IMapRenderer;
    /** 地图视角变换矩阵 */
    readonly camera: Transform = new Transform();

    /** 地图画布 */
    readonly canvas: HTMLCanvasElement;
    /** 画布上下文 */
    readonly gl: WebGL2RenderingContext;

    constructor(layerList: Iterable<IRenderLayerData>) {
        super('static');

        this.canvas = document.createElement('canvas');
        const gl = this.canvas.getContext('webgl2')!;
        this.gl = gl;

        this.renderer = new MapRenderer(materials, this.gl, this.camera);
        for (const layer of layerList) {
            this.renderer.addLayer(layer.layer, layer.alias);
            this.renderer.setZIndex(layer.layer, layer.zIndex);
        }
        this.renderer.useAsset(materials.trackedAsset);
        this.renderer.addExtends(new MapUpdateExtends(this));

        this.renderer.setTileBackground(1);

        this.renderer.setCellSize(CELL_WIDTH, CELL_HEIGHT);
        this.renderer.setRenderSize(MAP_WIDTH, MAP_HEIGHT);

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 更新图层列表
     * @param layerList 图层列表
     */
    updateLayerList(layerList: Iterable<IRenderLayerData>) {
        this.renderer
            .getSortedLayer()
            .forEach(v => this.renderer.removeLayer(v));
        for (const layer of layerList) {
            this.renderer.addLayer(layer.layer, layer.alias);
            this.renderer.setZIndex(layer.layer, layer.zIndex);
        }
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
        console.log('----- render start -----');

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
            case 'layerList': {
                this.updateLayerList(nextValue);
                break;
            }
        }
        super.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    }
}

class MapUpdateExtends implements IMapRendererExtends {
    constructor(readonly element: MapRender) {}

    onUpdate(): void {
        this.element.update();
    }
}
