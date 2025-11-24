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

    private pushBlock(
        list: IMapRenderArea[],
        start: IBlockData<IMapVertexBlock>,
        end: IBlockData<IMapVertexBlock>
    ) {
        const startIndex = start.data.startIndex;
        const endIndex = end.data.endIndex;
        list.push({
            startIndex,
            endIndex,
            count: endIndex - startIndex
        });
    }

    private checkDynamic(
        list: IMapRenderArea[],
        dynamicStart: number,
        dynamicCount: number
    ) {
        const last = list[list.length - 1];
        if (!last || last.endIndex < dynamicStart) {
            list.push({
                startIndex: dynamicStart,
                endIndex: dynamicStart + dynamicCount,
                count: dynamicCount
            });
        } else {
            last.endIndex = dynamicStart + dynamicCount;
            last.count += dynamicCount;
        }
    }

    getRenderArea(): IMapRenderData {
        const { cellWidth, cellHeight, renderWidth, renderHeight } =
            this.renderer;
        const { blockWidth, blockHeight, width, height } = this.vertex.block;
        // 其实只需要算左上角和右下角就行了
        const [left, top] = this.transform.untransformed(-1, -1);
        const [right, bottom] = this.transform.untransformed(1, 1);
        const cl = (left * renderWidth) / cellWidth;
        const ct = (top * renderHeight) / cellHeight;
        const cr = (right * renderWidth) / cellWidth;
        const cb = (bottom * renderHeight) / cellHeight;
        const blockLeft = clamp(Math.floor(cl / blockWidth), 0, width - 1);
        const blockRight = clamp(Math.floor(cr / blockWidth), 0, width - 1);
        const blockTop = clamp(Math.floor(ct / blockHeight), 0, height - 1);
        const blockBottom = clamp(Math.floor(cb / blockHeight), 0, height - 1);

        const renderArea: IMapRenderArea[] = [];
        const updateArea: IMapRenderArea[] = [];
        const blockList: IBlockData<IMapVertexBlock>[] = [];

        // 内层横向外层纵向的话，索引在换行之前都是连续的，方便整合
        for (let ny = blockTop; ny <= blockBottom; ny++) {
            for (let nx = blockLeft; nx <= blockRight; nx++) {
                const block = this.vertex.block.getBlockByLoc(nx, ny)!;
                blockList.push(block);
            }
        }

        if (blockList.length > 0) {
            if (blockList.length === 1) {
                const block = blockList[0];
                if (block.data.renderDirty) {
                    this.pushBlock(updateArea, block, block);
                }
                this.pushBlock(renderArea, block, block);
            } else {
                // 更新区域
                let updateStart: IBlockData<IMapVertexBlock> = blockList[0];
                let updateEnd: IBlockData<IMapVertexBlock> = blockList[0];
                let renderStart: IBlockData<IMapVertexBlock> = blockList[0];
                let renderEnd: IBlockData<IMapVertexBlock> = blockList[0];
                for (let i = 1; i < blockList.length; i++) {
                    const block = blockList[i];
                    const { renderDirty } = block.data;
                    // 连续则合并
                    // 渲染区域
                    if (block.index === renderEnd.index + 1) {
                        renderEnd = block;
                    } else {
                        this.pushBlock(renderArea, renderStart, renderEnd);
                        renderStart = block;
                        renderEnd = block;
                    }
                    // 缓冲区更新区域
                    if (renderDirty && block.index === updateEnd.index + 1) {
                        updateEnd = block;
                    } else {
                        this.pushBlock(updateArea, updateStart, updateEnd);
                        updateStart = block;
                        updateEnd = block;
                    }
                }
                this.pushBlock(updateArea, updateStart, updateEnd);
                this.pushBlock(renderArea, renderStart, renderEnd);
            }
        }

        const dynamicStart = this.vertex.dynamicStart;
        const dynamicCount = this.vertex.dynamicCount;
        this.checkDynamic(renderArea, dynamicStart, dynamicCount);
        if (this.vertex.dynamicRenderDirty) {
            this.checkDynamic(updateArea, dynamicStart, dynamicCount);
        }

        return {
            render: renderArea,
            dirty: updateArea,
            blockList: blockList
        };
    }

    bindTransform(transform: Transform): void {
        this.transform = transform;
    }
}
