import {
    TimingFn,
    linear,
    bezierPath,
    Animation,
    hyper,
    power,
    sleep
} from 'mutate-animate';
import { has } from '../utils';

interface AnimatedPathShadow {
    offsetX: number | TimingFn;
    offsetY: number | TimingFn;
    blur: number | TimingFn;
    color: string | TimingFn<4>;
}

type AnimatedPathShadowEntry = [
    keyof AnimatedPathShadow,
    ValueOf<AnimatedPathShadow>
][];

type AnimatedPathFilterKey =
    | 'blur'
    | 'brightness'
    | 'contrast'
    | 'grayscale'
    | 'hueRotate'
    | 'opacity'
    | 'saturate'
    | 'sepia';

type AnimatedPathFilter = Record<AnimatedPathFilterKey, number | TimingFn>;

interface Path {
    path: TimingFn<2>;
    length: number;
}

export default function init() {
    return { AnimatedPath, pathTest: test };
}

export class AnimatedPath {
    /** 不同线条间是否连接起来，不连接的话中间可能会有短暂的中断 */
    join: boolean = true;
    /** 路径信息 */
    linePath: Path[] = [];
    /** 绘制画布 */
    ctx: CanvasRenderingContext2D;

    private dashStatus: number = 0;
    private dashLength: number = 0;
    private dashMode: (number | TimingFn)[] = [];
    private lineWidth: number | TimingFn = 1;
    private lineColor: string | TimingFn<4> = '#fff';
    private lineShadow: Partial<AnimatedPathShadow> = {};
    private lineFilter: Partial<AnimatedPathFilter> = {};
    private pathClose: boolean = false;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * 设置虚线格式
     * @param mode 一个偶数个元素的数组，表示虚线格式，如果不是偶数个，那么会再复制一份加到后面。
     * 元素可以填数字或一个函数，如果是数字，表示该值是定值，
     * 如果是函数，该函数包括一个参数input，表示绘制动画的完成度，输出一个数字，表示虚线的长度。
     * @example path.dash([5, 10]); //  表示绘制时，会先绘制5像素的实线，之后10像素不绘制，然后再绘制5像素实线，以此类推。
     * @example path.dash([5, (input) => Math.round(input * 10)]);
     * // 表示绘制时，先绘制5像素的实线，然后会有一段不绘制，不绘制的长度是动画完成度乘10，以此类推。
     */
    dash(mode: (number | TimingFn)[]): this {
        const res = mode.slice();
        if (mode.length % 2 === 1) res.push(...mode);
        this.dashMode = mode;
        return this;
    }

    /**
     * 设置线条宽度
     * @param width 绘制的线条宽度，如果是数字，表示宽度是个常量。
     * 也可以传入一个函数，函数包括一个参数input，表示绘制动画的完成度，输出一个数字，表示宽度。
     * @example path.width(2); // 设置线条宽度为2像素
     * @example path.width((input) => input * 5); // 设置线条宽度为动画完成度的5倍
     */
    width(width: number | TimingFn): this {
        this.lineWidth = width;
        return this;
    }

    /**
     * 设置线条颜色
     * @param color 颜色，可以传入css颜色字符串或函数，传入字符串表示线条颜色为定值，
     * 如果传入函数，这个函数有一个参数input，表示动画完成度，输出一个有4个元素的数组，表示颜色的rgba值。
     * @example path.color('#fff'); // 设置线条为白色
     * @example path.color((input) => [input * 100, input * 50, input * 255, input * 0.8]);
     * // 设置颜色的红色值为动画完成度的100倍，绿色为动画完成度的50倍，蓝色为动画完成度的255倍，不透明度为动画完成度的0.8倍
     */
    color(color: string | TimingFn<4>): this {
        this.lineColor = color;
        return this;
    }

    /**
     * 设置线条阴影
     * @param shadow 阴影信息，一个对象，包含offsetX(横向偏移量), offsetY(纵向偏移量), blur(虚化程度), color(颜色)
     * 四个属性，均为可选，前三个可传入数字或函数，color可传入字符串或函数，传入的函数与前面几个方法中的函数类似。
     * ```ts
     * path.shadow({
     *     offsetX: 3, // 横向偏移量为3
     *     offsetY: input => input * 10, // 纵向偏移量为动画完成度的10倍
     *     color: '#0008', // 颜色为半透明的黑色
     *     blur: 4 // 虚化程度为4
     * })
     * ```
     */
    shadow(shadow: Partial<AnimatedPathShadow>): this {
        this.lineShadow = shadow;
        return this;
    }

    /**
     * 设置线条的滤镜
     * @param filter 滤镜信息，一个对象，可以有以下属性：
     * 1. `blur`: 虚化程度
     * 2. `brightness`: 亮度，百分比，`0-Infinity`
     * 3. `contrast`: 对比度，百分比，`0-Infinity`
     * 4. `grayscale`: 黑白度，百分比，`0-100`
     * 5. `hueRotate`: 色相旋转，角度，`0-360`
     * 6. `invert`: 反色，百分比，`0-100`
     * 7. `opacity`: 不透明度，百分比，`0-100`
     * 8. `saturate`: 饱和度，百分比，`0-Infinity`
     * 9. `sepia`: 深褐色(怀旧风格)，百分比，`0-100`
     * 以上属性均可选，均可传入数字或函数。
     * ```ts
     * path.filter({
     *     blur: 3, // 虚化程度为3
     *     contrast: input => 100 + input * 50 // 对比度增加动画完成度的50倍
     * })
     * ```
     */
    filter(filter: Partial<AnimatedPathFilter>): this {
        this.lineFilter = filter;
        return this;
    }

    /**
     * 清空路径
     */
    clear(): this {
        this.linePath = [];
        return this;
    }

    /**
     * 添加直线
     * @param x1 起点横坐标
     * @param y1 起点纵坐标
     * @param x2 终点横坐标
     * @param y2 终点纵坐标
     * @returns
     */
    line(x1: number, y1: number, x2: number, y2: number): this {
        const dx = x2 - x1;
        const dy = y2 - y1;
        this.add(x => [x1 + dx * x, y1 + dy * x], Math.sqrt(dx ** 2 + dy ** 2));
        return this;
    }

    /**
     * 添加圆弧
     * @param x 圆心横坐标
     * @param y 圆心纵坐标
     * @param r 圆半径
     * @param start 圆起始角度，弧度制，水平向右表示0弧度，顺时针旋转
     * @param end 圆终止角度，弧度制
     */
    circle(x: number, y: number, r: number, start: number, end: number): this {
        const dt = end - start;
        this.add(
            input => [
                x + r * Math.cos(dt * input + start),
                y + r * Math.sin(dt * input + start)
            ],
            r * dt
        );
        return this;
    }

    /**
     * 添加一个椭圆
     * @param x 圆心横坐标
     * @param y 圆心纵坐标
     * @param a 椭圆横轴长
     * @param b 椭圆纵轴长
     * @param start 起始角度，弧度制
     * @param end 终止角度，弧度制
     */
    ellipse(
        x: number,
        y: number,
        a: number,
        b: number,
        start: number,
        end: number
    ): this {
        const dt = end - start;
        this.add(input => [
            x + a * Math.cos(dt * input + start),
            y + b * Math.sin(dt * input + start)
        ]);
        return this;
    }

    /**
     * 添加一个矩形
     * @param x 左上角横坐标
     * @param y 左上角纵坐标
     * @param w 宽度
     * @param h 高度
     * @param lineWidth 线宽，用于闭合矩形
     */
    rect(
        x: number,
        y: number,
        w: number,
        h: number,
        lineWidth: number = 0
    ): this {
        const x2 = x + w;
        const y2 = y + h;
        this.line(x, y, x2, y)
            .line(x2, y, x2, y2)
            .line(x2, y2, x, y2)
            .line(x, y2, x, y - lineWidth / 2);
        return this;
    }

    /**
     * 添加一个贝塞尔曲线
     * @param point 起点，控制点，终点的坐标
     */
    bezier(...point: [number, number][]): this {
        if (point.length < 2) {
            throw new Error(`The point number of bezier must larger than 2.`);
        }
        const start = point[0];
        const end = point.at(-1)!;
        const cps = point.slice(1, -1);
        this.add(bezierPath(start, end, ...cps));
        return this;
    }

    /**
     * 添加一个路径
     * @param path 路径函数，输入一个绘制完成度，输出一个坐标
     * @param length 路径的长度，不填则会调用calLength进行计算，用于该段路径的绘制时间的计算，
     * 也可以通过设置这个值来指定该段路径的绘制时间。请尽量指定该值，不然的话性能表现会较差，如果大量添加路径可能会导致卡顿。
     * @example path.add(input => [input * 100, (input * 100) ** 2]); // 添加一个抛物线路径
     */
    add(path: TimingFn<2>, length: number = this.calLength(path)): this {
        this.linePath.push({
            path,
            length
        });
        return this;
    }

    /**
     * 设置路径是否闭合
     * @param close 路径是否闭合
     */
    close(close: boolean): this {
        this.pathClose = close;
        return this;
    }

    /**
     * 对一个路径进行线积分，计算其长度。注意该函数性能较差，请谨慎使用
     * @param path 路径函数，输入一个绘制完成度，输出一个坐标
     * @returns 路径的长度
     */
    calLength(path: TimingFn<2>): number {
        let [lastX, lastY] = path(0);
        let length = 0;
        for (let i = 1; i <= 1000; i++) {
            const [x, y] = path(i * 0.001);
            length += Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);
            lastX = x;
            lastY = y;
        }
        return length;
    }

    /**
     * 立即执行绘制，不执行动画，该函数的性能表现可能较差，请谨慎使用
     */
    drawImmediate(): this {
        const totalLength = this.linePath.reduce(
            (pre, cur) => pre + cur.length,
            0
        );
        let drawed = 0;
        this.linePath.forEach(v => {
            this.drawFrom(v.path, 0, 1, drawed, v.length);
            drawed += v.length / totalLength;
        });
        return this;
    }

    /**
     * 执行绘制
     * @param time 绘制时间，如果是0则会直接调用drawImmediate函数，注意如果时间太短的话可能会造成明显的锯齿现象
     * @param timing 绘制完成度的速率函数，输入一个时间完成度，输出一个绘制完成度
     */
    draw(time: number, timing: TimingFn = linear()): this {
        const totalLength = this.linePath.reduce(
            (pre, cur) => pre + cur.length,
            0
        );
        const ratio = this.linePath.map(v => v.length / totalLength);
        let drawed = 0;
        let now = 0;
        let nowEnd = ratio[0];
        let lastComplete = 0;
        this.ctx.beginPath();
        this.ctx.moveTo(...this.linePath[0].path(0));

        const findNext = (input: number) => {
            if (input >= 1 || nowEnd > input) return [];
            const skipped: number[] = [];
            while (1) {
                drawed += ratio[now];
                now++;
                nowEnd += ratio[now];
                if (input < nowEnd) {
                    lastComplete = drawed;
                    break;
                } else skipped.push(now);
            }
            return skipped;
        };

        const ani = new Animation();
        ani.register('path', 0);
        ani.mode(timing).time(time).absolute().apply('path', 1);
        ani.all().then(() => {
            ani.ticker.destroy();
            if (this.pathClose) {
                this.ctx.beginPath();
                this.ctx.moveTo(...this.linePath.at(-1)!.path(0.999));
                this.ctx.lineTo(...this.linePath[0].path(0.001));
                this.ctx.stroke();
            }
            this.ctx.closePath();
        });
        ani.ticker.add(() => {
            const complete = ani.value.path;
            if (complete >= nowEnd) {
                const d = nowEnd - drawed;
                const from = (lastComplete - drawed) / d;
                this.drawFrom(
                    this.linePath[now].path,
                    from,
                    1,
                    lastComplete,
                    ratio[now]
                );
                const skipped = findNext(complete);
                skipped.forEach(v => {
                    const path = this.linePath[v];
                    this.drawFrom(path.path, 0, 1, lastComplete, ratio[v]);
                });
            }
            const fn = this.linePath[now].path;
            const d = nowEnd - drawed;
            const from = (lastComplete - drawed) / d;
            const to = (complete - drawed) / d;
            this.drawFrom(fn, from, to, lastComplete, ratio[now]);
            lastComplete = complete;
        });
        return this;
    }

    private drawFrom(
        path: TimingFn<2>,
        from: number,
        to: number,
        complete: number,
        ratio: number,
        length?: number
    ) {
        const [fx, fy] = path(from);
        const [tx, ty] = path(to);

        const l =
            length ?? Math.ceil(Math.sqrt((tx - fx) ** 2 + (ty - fy) ** 2));
        const step = (to - from) / l;
        const ctx = this.ctx;
        let [lastX, lastY] = path(from);
        for (let i = 1; i <= l; i++) {
            this.handleFx(complete + (ratio * i * step) / l);
            const [x, y] = path(from + step * i);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            lastX = x;
            lastY = y;
        }
    }

    private handleFx(complete: number) {
        const ctx = this.ctx;
        const width =
            typeof this.lineWidth === 'number'
                ? this.lineWidth
                : this.lineWidth(complete);
        ctx.lineWidth = width;

        let color;
        if (typeof this.lineColor === 'string') {
            color = this.lineColor;
        } else {
            const c = this.lineColor(complete);
            color = `rgba(${c[0]},${c[1]},${c[2]},${c[3]})`;
        }
        ctx.strokeStyle = color;

        const shadow: Partial<
            Record<keyof AnimatedPathShadow, string | number>
        > = {};
        for (const [key, value] of Object.entries(
            this.lineShadow
        ) as AnimatedPathShadowEntry) {
            if (typeof value === 'function') {
                const n = value(complete);
                if (typeof n === 'number') {
                    shadow[key as Exclude<keyof AnimatedPathShadow, 'color'>] =
                        n;
                } else {
                    shadow.color = `rgba(${n[0]},${n[1]},${n[2]},${n[3]})`;
                }
            } else {
                // @ts-ignore
                shadow[key] = value;
            }
        }
        if (has(shadow.blur)) ctx.shadowBlur = shadow.blur as number;
        if (has(shadow.offsetX)) ctx.shadowOffsetX = shadow.offsetX as number;
        if (has(shadow.offsetY)) ctx.shadowOffsetY = shadow.offsetY as number;
        if (has(shadow.color)) ctx.shadowColor = shadow.color as string;

        let filter = '';
        for (const [key, value] of Object.entries(this.lineFilter) as [
            AnimatedPathFilterKey,
            number | TimingFn
        ][]) {
            let v;
            if (typeof value === 'number') {
                v = value;
            } else {
                v = value(complete);
            }
            if (key === 'blur') filter += `blur(${v}px)`;
            else filter += `${key}(${v}%)`;
        }
        ctx.filter = filter;
    }
}

async function test() {
    const ctx = core.createCanvas('test', 0, 0, 480, 480, 100);
    ctx.canvas.style.backgroundColor = '#000d';
    const path = new AnimatedPath(ctx);
    path.color('#fff')
        .width(2)
        .rect(100, 100, 280, 280, 2)
        .close(true)
        .draw(1000, power(5, 'in-out'));

    await sleep(1050);
    path.clear()
        .bezier([200, 200], [280, 200], [280, 280])
        .bezier([280, 280], [200, 280], [200, 200])
        .draw(1000, power(5, 'in-out'));
    await sleep(1050);
    path.clear()
        .bezier([280, 200], [200, 200], [200, 280])
        .bezier([200, 280], [280, 280], [280, 200])
        .draw(1000, power(5, 'in-out'));
}
