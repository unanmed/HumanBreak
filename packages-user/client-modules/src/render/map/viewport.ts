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

        const widthOne = blockLeft === blockRight;
        const heightOne = blockTop === blockBottom;

        if (widthOne && heightOne) {
            // 只能看到一个分块
            const block = this.vertex.block.getBlockByLoc(blockLeft, blockTop)!;
            if (block.data.dirty || block.data.renderDirty) {
                blockList.push(block);
            }
        } else if (widthOne) {
            // 看到的区域分块宽度是 1
            for (let ny = blockTop; ny <= blockBottom; ny++) {
                const block = this.vertex.block.getBlockByLoc(blockLeft, ny)!;
                if (block.data.dirty || block.data.renderDirty) {
                    blockList.push(block);
                }
            }
        } else if (heightOne) {
            // 看到的区域分块高度是 1
            for (let nx = blockLeft; nx <= blockRight; nx++) {
                const block = this.vertex.block.getBlockByLoc(nx, blockTop)!;
                if (block.data.dirty || block.data.renderDirty) {
                    blockList.push(block);
                }
            }
        } else {
            // 看到的区域分块宽高都不是 1
            // 使用这种方式的话，索引在换行之前都是连续的，方便整合
            for (let ny = blockTop; ny <= blockBottom; ny++) {
                const first = this.vertex.block.getBlockByLoc(blockLeft, ny)!;
                const last = this.vertex.block.getBlockByLoc(blockRight, ny)!;
                if (first.data.dirty) {
                    blockList.push(first);
                }
                if (last.data.dirty && first !== last) {
                    blockList.push(last);
                }
                for (let nx = blockLeft + 1; nx < blockRight; nx++) {
                    const block = this.vertex.block.getBlockByLoc(nx, ny)!;
                    if (block.data.dirty) {
                        blockList.push(block);
                    }
                }
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

        // todo: 动态内容

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
