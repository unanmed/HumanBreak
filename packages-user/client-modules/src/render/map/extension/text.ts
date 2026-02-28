import { IMapRenderer } from '../types';
import { IMapTextArea, IMapTextRenderable, IOnMapTextRenderer } from './types';

export class OnMapTextRenderer implements IOnMapTextRenderer {
    /** 画布元素 */
    readonly canvas: HTMLCanvasElement;
    /** 画布 Canvas2D 上下文 */
    readonly ctx: CanvasRenderingContext2D;

    /** 图块索引到图块文本对象的映射 */
    readonly areaMap: Map<number, MapTextArea> = new Map();
    private dirty: boolean = false;

    constructor(readonly renderer: IMapRenderer) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
    }

    render(): HTMLCanvasElement {
        return this.canvas;
    }

    requireBlockArea(x: number, y: number): Readonly<IMapTextArea> {
        const index = y * this.renderer.mapWidth + x;
        const exist = this.areaMap.get(index);
        if (exist) return exist;
        const area = new MapTextArea(this, x, y);
        this.areaMap.set(index, area);
        return area;
    }

    needUpdate(): boolean {
        return this.dirty;
    }

    clear(): void {}

    destroy(): void {}
}

class MapTextArea implements IMapTextArea {
    index: number;

    constructor(
        readonly renderer: OnMapTextRenderer,
        public mapX: number,
        public mapY: number
    ) {
        this.index = mapY * renderer.renderer.mapWidth + mapX;
    }

    addTextRenderable(renderable: IMapTextRenderable): void {
        throw new Error('Method not implemented.');
    }

    removeTextRenderable(renderable: IMapTextRenderable): void {
        throw new Error('Method not implemented.');
    }

    clear(): void {
        throw new Error('Method not implemented.');
    }
}
