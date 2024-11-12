import { Ticker } from 'mutate-animate';

export abstract class BarrageBoss {
    ticker: Ticker = new Ticker();
    /** 这个boss的所有弹幕 */
    projectiles: Set<Projectile> = new Set();

    /** 开始时刻 */
    private startTime: number = 0;
    /** 当前帧数 */
    private frame: number = 0;

    /**
     * boss的ai，战斗开始后，每帧执行一次
     * @param time 从战斗开始算起至现在经过了多长时间
     * @param frame 从战斗开始算起至现在经过了多少帧，即当前是第几帧
     */
    abstract ai(time: number, frame: number): void;

    private tick = () => {
        const now = Date.now();
        this.ai(now - this.startTime, this.frame++);
        this.projectiles.forEach(v => {
            v.ai(this, now - v.startTime, v.frame++);
        });
    };

    /**
     * 开始这个弹幕战
     */
    start() {
        if (this.ticker.funcs.has(this.tick)) {
            this.ticker.remove(this.tick);
        }
        this.startTime = Date.now();
        this.frame = 0;
        this.ticker.add(this.tick);
    }

    /**
     * 结束这个弹幕战
     */
    end() {
        if (this.ticker.funcs.has(this.tick)) {
            this.ticker.remove(this.tick);
        }
    }

    /**
     * 摧毁传入的弹幕
     */
    destroyProjectile(projectile: Projectile) {
        this.projectiles.delete(projectile);
    }

    /**
     * 用于创建一个弹幕的工厂函数
     * @param Proj 弹幕类
     * @param x 弹幕的横坐标
     * @param y 弹幕的纵坐标
     */
    createProjectile(
        Proj: new (boss: BarrageBoss) => Projectile,
        x: number,
        y: number
    ) {
        const projectile = new Proj(this);
        projectile.setPosition(x, y);
        return projectile;
    }
}

export abstract class Projectile {
    /** 这个弹幕从属的boss */
    boss: BarrageBoss;
    x: number = 0;
    y: number = 0;

    /** 弹幕的生成时刻 */
    startTime: number = Date.now();
    /** 弹幕当前帧数 */
    frame: number = 0;

    constructor(boss: BarrageBoss) {
        this.boss = boss;
        boss.projectiles.add(this);
    }

    /**
     * 设置这个弹幕的位置
     */
    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * 这个弹幕的ai，每帧执行一次，直至被销毁
     * @param boss 从属的boss
     * @param time 从弹幕生成开始算起至现在经过了多长时间
     * @param frame 从弹幕生成开始算起至现在经过了多少帧，即当前是第几帧
     */
    abstract ai(boss: BarrageBoss, time: number, frame: number): void;

    /**
     * 摧毁这个弹幕
     */
    destroy() {
        this.boss.destroyProjectile(this);
    }
}

export namespace Hitbox {
    export class Line {
        x1: number;
        y1: number;
        x2: number;
        y2: number;

        constructor(x1: number, y1: number, x2: number, y2: number) {
            this.x1 = x1;
            this.x2 = x2;
            this.y1 = y1;
            this.y2 = y2;
        }

        setPoint1(x: number, y: number) {
            this.x1 = x;
            this.y1 = y;
        }

        setPoint2(x: number, y: number) {
            this.x2 = x;
            this.y2 = y;
        }
    }

    export class Circle {
        x: number;
        y: number;
        radius: number;

        constructor(x: number, y: number, radius: number) {
            this.x = x;
            this.y = y;
            this.radius = radius;
        }

        setRadius(radius: number) {
            this.radius = radius;
        }

        setCenter(x: number, y: number) {
            this.x = x;
            this.y = y;
        }
    }

    export class Rect {
        x: number;
        y: number;
        w: number;
        h: number;

        constructor(x: number, y: number, w: number, h: number) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        }

        setPosition(x: number, y: number) {
            this.x = x;
            this.y = y;
        }

        setSize(w: number, h: number) {
            this.w = w;
            this.h = h;
        }
    }

    function cross(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number
    ): number {
        const dx1 = x2 - x1;
        const dy1 = y2 - y1;
        const dx2 = x3 - x1;
        const dy2 = y3 - y1;
        return dx1 * dy2 - dx2 * dy1;
    }

    /**
     * 检查两条线段是否有交叉
     */
    export function checkLineLine(line1: Line, line2: Line) {
        const x1 = line1.x1;
        const y1 = line1.y1;
        const x2 = line1.x2;
        const y2 = line1.y2;
        const x3 = line2.x1;
        const y3 = line2.y1;
        const x4 = line2.x2;
        const y4 = line2.y2;
        if (
            Math.max(x1, x2) < Math.min(x3, x4) ||
            Math.min(x1, x2) < Math.max(x3, x4) ||
            Math.max(y1, y2) < Math.min(y3, y4) ||
            Math.min(y1, y2) < Math.max(y3, y4)
        ) {
            return false;
        }

        const d1 = cross(x1, y1, x2, y2, x3, y3);
        const d2 = cross(x1, y1, x2, y2, x4, y4);
        const d3 = cross(x3, y3, x4, y4, x1, y1);
        const d4 = cross(x3, y3, x4, y4, x2, y3);

        return d1 * d2 < 0 && d3 * d4 < 0;
    }

    /**
     * 检查线段和圆是否有交叉
     */
    export function checkLineCircle(line: Line, circle: Circle) {
        const { x1, y1, x2, y2 } = line;
        const { x: cx, y: cy, radius: r } = circle;
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        // 检查圆心是否在扩展后的矩形范围之外
        if (cx + r < minX || cx - r > maxX || cy + r < minY || cy - r > maxY) {
            return false; // 完全不相交
        }

        // 计算线段的方向向量
        const dx = x2 - x1;
        const dy = y2 - y1;

        // A, B, C 对应二次方程的系数
        const a = dx * dx + dy * dy;
        const b = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
        const c = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r;

        // 计算判别式 Δ
        const discriminant = b ** 2 - 4 * a * c;

        // 如果判别式小于0，则没有交点
        if (discriminant < 0) {
            return false;
        }

        // 计算t的解（参数化线段的参数）
        const sqrtDiscriminant = Math.sqrt(discriminant);
        const t1 = (-b - sqrtDiscriminant) / (2 * a);
        const t2 = (-b + sqrtDiscriminant) / (2 * a);

        // 检查 t1 和 t2 是否在 [0, 1] 之间
        if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
            return true;
        }

        // 否则没有交点在线段上
        return false;
    }

    /**
     * 检查线段与矩形是否有交叉
     */
    export function checkLineRect(line: Line, rect: Rect) {
        const { x, y, w, h } = rect;
        return (
            checkLineLine(line, new Line(x, y, x + w, y + h)) ||
            checkLineLine(line, new Line(x + w, y, x, y + h))
        );
    }

    /**
     * 检查两个圆是否有交叉
     */
    export function checkCircleCircle(circle1: Circle, circle2: Circle) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const dis = Math.hypot(dx, dy);
        return dis <= circle1.radius + circle2.radius;
    }

    /**
     * 检查圆与矩形是否有交叉
     */
    export function checkCircleRect(circle: Circle, rect: Rect) {
        const { x: cx, y: cy, radius: r } = circle;
        const { x, y, w, h } = rect;

        // 找到圆心到矩形的最近点
        const closestX = Math.max(x, Math.min(cx, x + w));
        const closestY = Math.max(y, Math.min(cy, y + h));

        return Math.hypot(closestX - cx, closestY - cy) <= r;
    }

    /**
     * 检查两个矩形是否有交叉
     */
    export function checkRectRect(rect1: Rect, rect2: Rect) {
        const { x: x1, y: y1, w: w1, h: h1 } = rect1;
        const { x: x3, y: y3, w: w2, h: h2 } = rect2;
        const x2 = x1 + w1;
        const y2 = y1 + h1;
        const x4 = x3 + w2;
        const y4 = y3 + h2;

        return x2 >= x3 && x4 >= x1 && y2 >= y3 && y4 >= y1;
    }
}
