import { IMapLayer } from '@user/data-state';
import { IBlockStatus, IMapVertexStatus } from './types';

export class StaticBlockStatus implements IBlockStatus {
    /**
     * @param layer 图层对象
     * @param vertex 顶点数组生成器对象
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    constructor(
        readonly layer: IMapLayer,
        readonly vertex: IMapVertexStatus,
        readonly x: number,
        readonly y: number
    ) {}

    setAlpha(alpha: number): void {
        this.vertex.setStaticAlpha(this.layer, alpha, this.x, this.y);
    }

    getAlpha(): number {
        return this.vertex.getStaticAlpha(this.layer, this.x, this.y);
    }

    useGlobalFrame(): void {
        this.vertex.setStaticFrame(this.layer, this.x, this.y, -1);
    }

    useSpecifiedFrame(frame: number): void {
        this.vertex.setStaticFrame(this.layer, this.x, this.y, frame);
    }

    getFrame(): number {
        return this.vertex.getStaticFrame(this.layer, this.x, this.y);
    }
}

export class DynamicBlockStatus implements IBlockStatus {
    /**
     * @param layer 图层对象
     * @param vertex 顶点数组生成器对象
     * @param index 图块索引
     */
    constructor(
        readonly layer: IMapLayer,
        readonly vertex: IMapVertexStatus,
        readonly index: number
    ) {}

    setAlpha(alpha: number): void {
        this.vertex.setDynamicAlpha(this.index, alpha);
    }

    getAlpha(): number {
        return this.vertex.getDynamicAlpha(this.index);
    }

    useGlobalFrame(): void {
        this.vertex.setDynamicFrame(this.index, -1);
    }

    useSpecifiedFrame(frame: number): void {
        this.vertex.setDynamicFrame(this.index, frame);
    }

    getFrame(): number {
        return this.vertex.getDynamicFrame(this.index);
    }
}
