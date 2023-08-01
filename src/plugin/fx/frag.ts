import { Animation, linear, sleep } from 'mutate-animate';

interface SplittedImage {
    canvas: HTMLCanvasElement;
    x: number;
    y: number;
}

interface FraggingImage extends SplittedImage {
    /** 横坐标增量 */
    deltaX: number;
    /** 纵坐标增量 */
    deltaY: number;
    endRad: number;
}

/** 最大移动距离，最终位置距离中心的距离变成原来的几倍 */
const MAX_MOVE_LENGTH = 1.15;
/** 移动距离波动，在最大移动距离的基础上加上多少倍距离的波动距离 */
const MOVE_FLUSH = 0.7;
/** 最大旋转角，单位是弧度 */
const MAX_ROTATE = 0.5;
/** 碎裂动画的速率曲线函数 */
const FRAG_TIMING = linear();

export default function init() {
    return { applyFragWith };
}

export function applyFragWith(
    canvas: HTMLCanvasElement,
    length: number = 4,
    time: number = 1000,
    config: any = {}
) {
    // 先切分图片
    const imgs = splitCanvas(canvas, length);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    let maxX = 0;
    let maxY = 0;
    const toMove: FraggingImage[] = imgs.map(v => {
        const centerX = v.x + v.canvas.width / 2;
        const centerY = v.y + v.canvas.height / 2;
        const onX = centerX === cx;
        const onY = centerY === cy;
        const mml = config.maxMoveLength ?? MAX_MOVE_LENGTH;
        const mf = config.moveFlush ?? MOVE_FLUSH;
        const rate = mml - 1 + Math.random() ** 3 * mf;
        let endX = onY ? 0 : (centerX - cx) * rate;
        let endY = onX ? 0 : (centerY - cy) * rate;
        const mx = Math.abs(endX + centerX) + Math.abs(v.canvas.width);
        const my = Math.abs(endY + centerY) + Math.abs(v.canvas.height);
        if (mx > maxX) maxX = mx;
        if (my > maxY) maxY = my;
        const r = config.maxRotate ?? MAX_ROTATE;
        const endRad = Math.random() * r * 2 - r;

        return {
            deltaX: endX,
            deltaY: endY,
            endRad,
            x: centerX,
            y: centerY,
            canvas: v.canvas
        };
    });

    // 再执行动画
    const frag = document.createElement('canvas');
    const ctx = frag.getContext('2d')!;
    const ani = new Animation();
    ani.register('rate', 0);
    const ft = config.fragTiming ?? FRAG_TIMING;
    ani.absolute().time(time).mode(ft).apply('rate', 1);
    frag.width = maxX * 2;
    frag.height = maxY * 2;
    ctx.save();
    const dw = maxX - canvas.width / 2;
    const dh = maxY - canvas.height / 2;

    const fragFn = () => {
        const rate = ani.value.rate;
        const opacity = 1 - rate;
        ctx.globalAlpha = opacity;
        ctx.clearRect(0, 0, frag.width, frag.height);
        toMove.forEach(v => {
            ctx.save();
            const nx = v.deltaX * rate;
            const ny = v.deltaY * rate;
            const rotate = v.endRad * rate;

            ctx.translate(nx + v.x + dw, ny + v.y + dh);
            ctx.rotate(rotate);
            ctx.drawImage(
                v.canvas,
                nx - v.canvas.width / 2,
                ny - v.canvas.height / 2
            );
            ctx.restore();
        });
    };
    const onEnd = () => {};
    ani.ticker.add(fragFn);

    return makeFragManager(frag, ani, time, onEnd);
}

function makeFragManager(
    canvas: HTMLCanvasElement,
    ani: Animation,
    time: number,
    onEnd: () => void
) {
    const promise = sleep(time + 50);

    return {
        animation: ani,
        onEnd: promise.then(() => {
            ani.ticker.destroy();
            onEnd();
        }),
        canvas
    };
}

export function withImage(
    image: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number
): SplittedImage {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = sw;
    canvas.height = sh;
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
    return { canvas, x: sx, y: sy };
}

/**
 * 切分画布
 * @param canvas 要被切分的画布
 * @param l 切分小块的边长
 */
function splitCanvas(canvas: HTMLCanvasElement, l: number): SplittedImage[] {
    if (canvas.width / l < 2 || canvas.height / l < 2) {
        console.warn('切分画布要求切分边长大于等于画布长宽的一半！');
        return [];
    }
    const w = canvas.width;
    const h = canvas.height;
    const numX = Math.floor(w / l);
    const numY = Math.floor(h / l);
    const rw = (w - numX * l) / 2;
    const rh = (h - numY * l) / 2;

    const res: SplittedImage[] = [];

    if (rw > 0) {
        if (rh > 0) {
            res.push(
                withImage(canvas, 0, 0, rw, rh),
                withImage(canvas, 0, canvas.height - rh, rw, rh),
                withImage(canvas, canvas.width - rw, 0, rw, rh),
                withImage(canvas, canvas.width - rw, canvas.height - rh, rw, rh)
            );
        }
        for (const x of [0, canvas.width - rw]) {
            for (let ny = 0; ny < numY; ny++) {
                res.push(withImage(canvas, x, rh + l * ny, rw, l));
            }
        }
    }
    if (rh > 0) {
        for (const y of [0, canvas.height - rh]) {
            for (let nx = 0; nx < numX; nx++) {
                res.push(withImage(canvas, rw + l * nx, y, l, rh));
            }
        }
    }
    for (let nx = 0; nx < numX; nx++) {
        for (let ny = 0; ny < numY; ny++) {
            res.push(withImage(canvas, rw + l * nx, rh + l * ny, l, l));
        }
    }

    return res;
}
