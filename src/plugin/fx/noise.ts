export default function init() {
    return { createGaussNoise };
}

interface GaussNoiseConfig {
    /** 分辨率，最小为1，最大为画布长宽的最大值，默认为画布长宽最大值的一半，过大可能会卡顿 */
    resolution?: number;
    /** 画布宽度 */
    width?: number;
    /** 画布高度 */
    height?: number;
    /** 噪声灰度的均值，范围 0 ~ 255 */
    expectation: number;
    /** 噪声灰度方差 */
    deviation: number;
    /** 目标画布，如果不指定会创建一个新的 */
    canvas?: HTMLCanvasElement;
}

/**
 * 创建一个高斯噪声
 * @param config 噪声选项
 * @returns 噪声画布
 */
export function createGaussNoise(config: GaussNoiseConfig): HTMLCanvasElement {
    const canvas = config.canvas ?? document.createElement('canvas');
    canvas.width = config.width ?? core._PX_;
    canvas.height = config.height ?? core._PY_;
    canvas.style.imageRendering = 'pixelated';
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const max = Math.max(canvas.width, canvas.height);
    const resolution = Math.min(max, config.resolution ?? max / 2);

    const step =
        max === canvas.width
            ? canvas.width / resolution
            : canvas.height / resolution;

    for (let x = 0; x < canvas.width; x += step) {
        for (let y = 0; y < canvas.height; y += step) {
            const random =
                Math.sqrt(Math.log(Math.random()) * -2) *
                Math.sin(2 * Math.PI * Math.random());
            const gray = 255 - random * config.deviation - config.expectation;

            ctx.fillStyle = `rgba(${gray},${gray},${gray},${gray / 255})`;
            ctx.fillRect(x, y, step, step);
        }
    }

    return canvas;
}
