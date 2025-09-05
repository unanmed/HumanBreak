import { Transform, MotaOffscreenCanvas2D } from '@motajs/render';
import { IStateDamageable } from '@user/data-state';
import { Hitbox, Projectile } from './barrage';
import type { PalaceBoss } from './palaceBoss';
import { clamp } from '@motajs/legacy-ui';
import { mainRenderer } from 'packages-user/client-modules/src/render/renderer';

function popDamage(damage: number, boss: PalaceBoss, color: string) {
    const { x, y } = core.status.hero.loc;
    boss.pop.addPop(
        (-damage).toString(),
        1000,
        x * 32 + 16,
        y * 32 + 16,
        color
    );
}

export interface ISplitData {
    split: boolean;
    /** 分裂时刻，以弹幕被创建时刻为基准 */
    time: number;
    /** 分裂起始角度，以该弹幕朝向方向为 0 */
    startAngle: number;
    /** 分裂终止角度，以该弹幕朝向方向为 0 */
    endAngle: number;
    /** 每秒加速度 */
    acc: number;
    /** 初始速度 */
    startVel: number;
    /** 终止速度 */
    endVel: number;
    /** 持续时长 */
    lastTime: number;
    /** 分裂数量 */
    count: number;
    /** 这个弹幕分裂产生的弹幕的分裂信息，不填则表示产生的弹幕不会分裂 */
    data?: ISplitData;
}

export class SplittableBall extends Projectile<PalaceBoss> {
    damage: number = 10000;
    hitbox: Hitbox.Circle = new Hitbox.Circle(0, 0, 8);

    static ball: Map<string, MotaOffscreenCanvas2D> = new Map();

    private damaged: boolean = false;
    private splitData?: ISplitData;
    private last: number = 60_000;

    /** 角度，水平向右为 0，顺时针旋转一圈为 Math.PI * 2 */
    private angle: number = 0;
    /** 每秒加速度 */
    private acc: number = 0;
    /** 初始速度，每秒多少像素 */
    private startVel: number = 0;
    /** 终止速度 */
    private endVel: number = 0;
    /** 弹幕颜色 */
    private color?: string;

    private startVelX: number = 0;
    private startVelY: number = 0;
    private endVelX: number = 0;
    private endVelY: number = 0;
    private vx: number = 0;
    private vy: number = 0;
    // 加速度
    private ax: number = 0;
    private ay: number = 0;

    /** 是否已经分裂过 */
    private splitted: boolean = false;

    static init(colors: Record<string, string[]>) {
        this.ball.forEach(v => mainRenderer.deleteCanvas(v));
        this.ball.clear();
        for (const [key, color] of Object.entries(colors)) {
            const canvas = mainRenderer.requireCanvas();
            canvas.size(32, 32);
            canvas.setHD(true);
            const ctx = canvas.ctx;
            const gradient = ctx.createRadialGradient(16, 16, 8, 16, 16, 16);
            const step = 1 / (color.length - 1);
            for (let i = 0; i < color.length; i++) {
                gradient.addColorStop(i * step, color[i]);
            }
            ctx.fillStyle = gradient;
            ctx.arc(16, 16, 16, 0, Math.PI * 2);
            ctx.fill();
            this.ball.set(key, canvas);
        }
    }

    static end() {
        this.ball.forEach(v => {
            v.clear();
            mainRenderer.deleteCanvas(v);
        });
        this.ball.clear();
    }

    /**
     * 设置持续时长
     * @param time 持续时长
     */
    setLastTime(time: number) {
        this.last = time;
    }

    /**
     * 设置这个弹幕的分裂数据
     * @param data 分裂数据，不填表示该弹幕不会分裂
     */
    setSplitData(data?: ISplitData) {
        this.splitData = data;
    }

    /**
     * 计算速度分量信息
     */
    private calVel() {
        const sin = Math.sin(this.angle);
        const cos = Math.cos(this.angle);
        const vel = Math.hypot(this.vx, this.vy);

        this.startVelX = this.startVel * cos;
        this.startVelY = this.startVel * sin;
        this.endVelX = this.endVel * cos;
        this.endVelY = this.endVel * sin;
        this.ax = this.acc * cos;
        this.ay = this.acc * sin;
        this.vx = vel * cos;
        this.vy = vel * sin;
    }

    /**
     * 设置弹幕速度朝向
     * @param angle 朝向
     */
    setAngle(angle: number) {
        this.angle = angle;
        this.calVel();
    }

    /**
     * 设置速度
     * @param start 起始速度
     * @param end 终止速度
     */
    setVel(start: number, end: number) {
        this.startVel = start;
        this.endVel = end;
        this.calVel();
    }

    /**
     * 设置加速度
     * @param acc 加速度，每秒加速多少像素
     */
    setAcc(acc: number) {
        this.acc = acc;
        this.calVel();
    }

    /**
     * 设置弹幕的颜色
     * @param color 颜色
     */
    setColor(color: string) {
        this.color = color;
    }

    isIntersect(hitbox: Hitbox.HitboxType): boolean {
        if (hitbox instanceof Hitbox.Circle) {
            return Hitbox.checkCircleCircle(hitbox, this.hitbox);
        } else {
            return false;
        }
    }

    updateHitbox(x: number, y: number): void {
        this.hitbox.setCenter(x, y);
    }

    doDamage(target: IStateDamageable): boolean {
        if (this.damaged) return false;
        target.hp -= this.damage;
        this.damaged = true;
        core.drawHeroAnimate('hand');
        popDamage(this.damage, this.boss, '#ff8180');
        return true;
    }

    private split(boss: PalaceBoss) {
        if (!this.splitData?.split) return;
        if (this.splitted) return;
        this.splitted = true;
        const {
            startAngle,
            endAngle,
            startVel,
            endVel,
            acc,
            lastTime,
            count,
            data
        } = this.splitData;

        const sa = this.angle + startAngle;
        const ea = this.angle + endAngle;
        const step = (ea - sa - 1) / count;
        const { x, y } = this.hitbox;

        for (let i = 0; i < count; i++) {
            const proj = boss.createProjectile(SplittableBall, x, y);
            proj.setAngle(sa + step * i);
            proj.setAcc(acc);
            proj.setVel(startVel, endVel);
            proj.setLastTime(lastTime);
            proj.setSplitData(data);
        }
    }

    ai(boss: PalaceBoss, time: number, _frame: number, dt: number): void {
        if (this.splitData?.split) {
            if (time > this.splitData.time) {
                this.split(boss);
            }
        }
        if (time > this.last) {
            this.destroy();
            return;
        }
        const p = dt / 1000;
        this.vx += this.ax * p;
        this.vy += this.ay * p;

        const sx = Math.sign(this.vx);
        const sy = Math.sign(this.vy);
        const cx = clamp(
            Math.abs(this.vx),
            Math.abs(this.startVelX),
            Math.abs(this.endVelX)
        );
        const cy = clamp(
            Math.abs(this.vy),
            Math.abs(this.startVelY),
            Math.abs(this.endVelY)
        );
        this.vx = cx * sx;
        this.vy = cy * sy;

        const { x, y } = this.hitbox;
        this.setPosition(x + this.vx * p, y + this.vy * p);
    }

    render(canvas: MotaOffscreenCanvas2D, _transform: Transform): void {
        if (!this.color) return;
        const texture = SplittableBall.ball.get(this.color);
        if (!texture) return;
        const ctx = canvas.ctx;
        ctx.drawImage(texture.canvas, this.x - 16, this.y - 16, 32, 32);
    }

    destroy(): void {
        this.split(this.boss);
        super.destroy();
    }
}
