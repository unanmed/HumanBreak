import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { RenderItem, RenderItemPosition } from '@/core/render/item';
import { Transform } from '@/core/render/transform';
import { IStateDamageable } from '@/game/state/interface';
import { Ticker } from 'mutate-animate';

export abstract class BarrageBoss {
    ticker: Ticker = new Ticker();
    /** 这个boss的所有弹幕 */
    projectiles: Set<Projectile> = new Set();

    /** 开始时刻 */
    private startTime: number = 0;
    /** 当前帧数 */
    frame: number = 0;

    /** 这个boss战的主渲染元素，所有弹幕都会在此之上渲染 */
    abstract readonly main: BossSprite;
    /** 这个boss战中勇士的碰撞箱 */
    abstract readonly hitbox: Hitbox.HitboxType;
    /** 勇士的状态 */
    abstract readonly state: IStateDamageable;

    /**
     * boss的ai，战斗开始后，每帧执行一次
     * @param time 从战斗开始算起至现在经过了多长时间
     * @param frame 从战斗开始算起至现在经过了多少帧，即当前是第几帧
     */
    abstract ai(time: number, frame: number): void;

    private tick = () => {
        const now = Date.now();
        this.ai(now - this.startTime, this.frame);
        this.frame++;
        this.projectiles.forEach(v => {
            const time = now - v.startTime;
            v.time = time;
            v.ai(this, time, v.frame);
            v.frame++;
            if (time > 60_000) {
                this.destroyProjectile(v);
            }
            if (v.isIntersect(this.hitbox)) {
                v.doDamage(this.state);
            }
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
    createProjectile<T extends Projectile>(
        Proj: new (boss: this) => T,
        x: number,
        y: number
    ): T {
        const projectile = new Proj(this);
        projectile.setPosition(x, y);
        return projectile;
    }
}

export abstract class BossSprite<
    T extends BarrageBoss = BarrageBoss
> extends RenderItem {
    /** 这个sprite所属的boss */
    readonly boss: T;

    constructor(type: RenderItemPosition, boss: T) {
        super(type, false);
        this.boss = boss;
    }

    /**
     * 在内置渲染函数执行前渲染内容，返回false会阻止内置渲染函数执行
     * @param canvas 渲染至的画布
     * @param transform 渲染时的变换矩阵
     */
    protected abstract preDraw(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): boolean;

    /**
     * 在内置渲染函数执行后渲染内容，如果preDraw返回false，也会执行本函数
     * @param canvas 渲染至的画布
     * @param transform 渲染时的变换矩阵
     */
    protected abstract postDraw(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void;

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const pre = this.preDraw(canvas, transform);
        if (!pre) {
            this.postDraw(canvas, transform);
            return;
        }
        this.renderProjectiles(canvas, transform);
        this.postDraw(canvas, transform);
    }

    /**
     * 渲染所有弹幕
     * @param canvas 渲染至的画布
     * @param transform 渲染时的变换矩阵
     */
    protected renderProjectiles(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ) {
        this.boss.projectiles.forEach(v => {
            v.render(canvas, transform);
        });
    }
}

export abstract class Projectile<T extends BarrageBoss = BarrageBoss> {
    /** 这个弹幕从属的boss */
    boss: T;
    /** 这个弹幕的伤害 */
    abstract damage: number;

    private _x: number = 0;
    get x(): number {
        return this._x;
    }
    set x(v: number) {
        this._x = v;
        this.updateHitbox(v, this._y);
    }

    private _y: number = 0;
    get y(): number {
        return this._y;
    }
    set y(v: number) {
        this._y = v;
        this.updateHitbox(this._x, v);
    }

    /** 弹幕的生成时刻 */
    startTime: number = Date.now();
    /** 弹幕当前帧数 */
    frame: number = 0;
    /** 当前弹幕持续时长 */
    time: number = 0;

    /** 这个弹幕的碰撞箱 */
    abstract hitbox: Hitbox.HitboxType;

    constructor(boss: T) {
        this.boss = boss;
        boss.projectiles.add(this);
    }

    /**
     * 判断一个碰撞箱是否与本弹幕的碰撞箱有交叉。
     * 此判断应该具有对称性，如果用A检测B发生碰撞，那么用B检测A也应该发生碰撞。
     * @param hitbox 要检测的碰撞箱
     */
    abstract isIntersect(hitbox: Hitbox.HitboxType): boolean;

    /**
     * 当弹幕的横纵坐标改变时，更新碰撞箱
     * @param x 弹幕的横坐标
     * @param y 弹幕的纵坐标
     */
    abstract updateHitbox(x: number, y: number): void;

    /**
     * 对一个目标造成伤害
     * @param target 伤害目标
     * @returns 是否成功对目标造成伤害
     */
    abstract doDamage(target: IStateDamageable): boolean;

    /**
     * 设置这个弹幕的位置
     */
    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.updateHitbox(x, y);
    }

    /**
     * 这个弹幕的ai，每帧执行一次，直至被销毁，在1分钟后会强制被摧毁
     * @param boss 从属的boss
     * @param time 从弹幕生成开始算起至现在经过了多长时间
     * @param frame 从弹幕生成开始算起至现在经过了多少帧，即当前是第几帧
     */
    abstract ai(boss: T, time: number, frame: number): void;

    /**
     * 这个弹幕的渲染函数，原则上一个boss的弹幕应该全部画在同一层，而且渲染前画布不进行矩阵变换
     * @param canvas 渲染至的画布
     * @param transform 渲染时的变换矩阵
     */
    abstract render(canvas: MotaOffscreenCanvas2D, transform: Transform): void;

    /**
     * 摧毁这个弹幕
     */
    destroy() {
        this.boss.destroyProjectile(this);
    }
}

export namespace Hitbox {
    export type HitboxType = Line | Rect | Circle;

    export class Line {
        constructor(
            public x1: number,
            public y1: number,
            public x2: number,
            public y2: number
        ) {}

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
        constructor(
            public x: number,
            public y: number,
            public radius: number
        ) {}

        setRadius(radius: number) {
            this.radius = radius;
        }

        setCenter(x: number, y: number) {
            this.x = x;
            this.y = y;
        }
    }

    export class Rect {
        constructor(
            public x: number,
            public y: number,
            public w: number,
            public h: number
        ) {}

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
        const { x1, y1, x2, y2 } = line1;
        const { x1: x3, y1: y3, x2: x4, y2: y4 } = line2;

        if (
            Math.max(x1, x2) < Math.min(x3, x4) ||
            Math.min(x1, x2) > Math.max(x3, x4) ||
            Math.max(y1, y2) < Math.min(y3, y4) ||
            Math.min(y1, y2) > Math.max(y3, y4)
        ) {
            return false;
        }

        const d1 = cross(x1, y1, x2, y2, x3, y3);
        const d2 = cross(x1, y1, x2, y2, x4, y4);
        const d3 = cross(x3, y3, x4, y4, x1, y1);
        const d4 = cross(x3, y3, x4, y4, x2, y2);

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

        if (cx > x && cx < x + w && cy > y && cy < y + h) return true;

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
