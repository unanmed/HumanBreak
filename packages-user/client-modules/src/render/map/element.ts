import { MotaOffscreenCanvas2D, RenderItem } from '@motajs/render-core';
import { ILayerState } from '@user/data-state';
import { IMapRenderer } from './types';
import { ElementNamespace, ComponentInternalInstance } from 'vue';
import { CELL_HEIGHT, CELL_WIDTH, MAP_HEIGHT, MAP_WIDTH } from '../shared';

export class MapRender extends RenderItem {
    /**
     * @param layerState 地图状态对象
     * @param renderer 地图渲染器对象
     */
    constructor(
        readonly layerState: ILayerState,
        readonly renderer: IMapRenderer
    ) {
        super('static', false, false);

        renderer.setLayerState(layerState);
        renderer.setCellSize(CELL_WIDTH, CELL_HEIGHT);
        renderer.setRenderSize(MAP_WIDTH, MAP_HEIGHT);

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
