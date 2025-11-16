import { Transform } from '@motajs/render-core';
import {
    IBlockData,
    IMapRenderArea,
    IMapRenderData,
    IMapRenderer,
    IMapVertexBlock,
    IMapVertexGenerator,
    IMapViewportController
} from './types';
import { clamp } from 'lodash-es';

export class MapViewport implements IMapViewportController {
    transform: Transform = new Transform();
    /** 顶点生成器 */
    readonly vertex: IMapVertexGenerator;

    constructor(readonly renderer: IMapRenderer) {
        this.vertex = renderer.vertex;
    }

    getRenderArea(): IMapRenderData {
        const { cellWidth, cellHeight, renderWidth, renderHeight } =
            this.renderer;
        const { blockWidth, blockHeight, width, height } = this.vertex.block;
        // 减一是因为第一个像素是 0，所以最后一个像素就是宽度减一
        const r = renderWidth - 1;
        const b = renderHeight - 1;
        // 其实只需要算左上角和右下角就行了
        const [left, top] = this.transform.transformed(0, 0);
        const [right, bottom] = this.transform.transformed(r, b);
        const cl = left / cellWidth;
        const ct = top / cellHeight;
        const cr = right / cellWidth;
        const cb = bottom / cellHeight;
        const blockLeft = clamp(Math.floor(cl / blockWidth), 0, width - 1);
        const blockRight = clamp(Math.floor(cr / blockWidth), 0, width - 1);
        const blockTop = clamp(Math.floor(ct / blockHeight), 0, height - 1);
        const blockBottom = clamp(Math.floor(cb / blockHeight), 0, height - 1);

        const renderArea: IMapRenderArea[] = [];
        const updateArea: IMapRenderArea[] = [];
        const blockList: IBlockData<IMapVertexBlock>[] = [];

        // 使用这种方式的话，索引在换行之前都是连续的，方便整合
        for (let ny = blockTop; ny <= blockBottom; ny++) {
            const first = this.vertex.block.getBlockByLoc(blockLeft, ny)!;
            const last = this.vertex.block.getBlockByLoc(blockRight, ny)!;
            if (first.data.dirty) {
                blockList.push(first);
            }
            if (last.data.dirty) {
                blockList.push(last);
            }
            renderArea.push({
                startIndex: first.data.startIndex,
                endIndex: last.data.endIndex,
                count: last.data.endIndex - first.data.startIndex
            });
            for (let nx = blockLeft + 1; nx < blockRight; nx++) {
                const block = this.vertex.block.getBlockByLoc(nx, ny)!;
                if (block.data.dirty) {
                    blockList.push(block);
                }
            }
        }

        if (blockList.length > 0) {
            if (blockList.length === 1) {
                const block = blockList[0];
                updateArea.push(block.data);
            } else {
                let continuousStart: IBlockData<IMapVertexBlock> = blockList[0];
                let continuousLast: IBlockData<IMapVertexBlock> = blockList[0];
                for (let i = 1; i < blockList.length; i++) {
                    const block = blockList[i];
                    if (block.index === continuousLast.index + 1) {
                        // 连续则合并
                        continuousLast = block;
                    } else {
                        const start = continuousStart.data.startIndex;
                        const end = continuousLast.data.endIndex;
                        updateArea.push({
                            startIndex: start,
                            endIndex: end,
                            count: end - start
                        });
                        continuousStart = block;
                        continuousLast = block;
                    }
                }
            }
        }

        return {
            render: renderArea,
            dirty: updateArea,
            blockList
        };
    }

    bindTransform(transform: Transform): void {
        this.transform = transform;
    }
}
