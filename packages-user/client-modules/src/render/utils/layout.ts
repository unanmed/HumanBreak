import { ElementLocator } from '@motajs/render-core';

export interface IGridLayoutData {
    /** 有多少列 */
    readonly cols: number;
    /** 有多少行 */
    readonly rows: number;
    /** 去除余留部分后的宽度 */
    readonly width: number;
    /** 去除预留部分后的高度 */
    readonly height: number;
    /** 元素总数量 */
    readonly count: number;
    /** 每个元素的定位，按照从左到右，从左上下的顺序排列，包含所有六个元素 */
    readonly locs: readonly ElementLocator[];
}

/**
 * 网格布局
 * @param width 总宽度
 * @param height 总高度
 * @param itemWidth 每个元素的宽度
 * @param itemHeight 每个元素的高度
 * @param intervalX 元素的横向间隔
 * @param intervalY 元素的纵向间隔，不填时等于横向间隔
 * @returns 网格布局信息
 */
export function adjustGrid(
    width: number,
    height: number,
    itemWidth: number,
    itemHeight: number,
    intervalX: number,
    intervalY: number = intervalX
): IGridLayoutData {
    const cols = Math.floor((width + intervalX) / (itemWidth + intervalX));
    const rows = Math.floor((height + intervalY) / (itemHeight + intervalY));
    const rawWidth = (itemWidth + intervalX) * cols - intervalX;
    const rawHeight = (itemHeight + intervalY) * rows - intervalY;

    const locs: ElementLocator[] = [];

    for (let y = 0; y < rows; y++) {
        const iy = (intervalY + itemHeight) * y;
        for (let x = 0; x < cols; x++) {
            const ix = (intervalX + itemWidth) * x;
            locs.push([ix, iy, itemWidth, itemHeight, 0, 0]);
        }
    }

    return {
        cols,
        rows,
        count: cols * rows,
        width: rawWidth,
        height: rawHeight,
        locs
    };
}

/**
 * 适配为覆盖模式，类似于 `object-fit: cover`
 * @param itemWidth 元素宽度
 * @param itemHeight 元素高度
 * @param targetWidth 目标宽度
 * @param targetHeight 目标高度
 * @returns 适配为覆盖模式后元素的宽高
 */
export function adjustCover(
    itemWidth: number,
    itemHeight: number,
    targetWidth: number,
    targetHeight: number
): Readonly<LocArr> {
    const aspect = itemWidth / itemHeight;
    const canvasAspect = targetWidth / targetHeight;
    if (canvasAspect > aspect) {
        const width = targetWidth;
        const height = width / aspect;
        return [width, height];
    } else {
        const height = targetHeight;
        const width = height * aspect;
        return [width, height];
    }
}
