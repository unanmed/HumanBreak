import { hyper, power, TimingFn } from 'mutate-animate';
import { Hitbox, Projectile } from './barrage';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { Transform } from '@/core/render/transform';
import type { TowerBoss } from './towerBoss';
import { IStateDamageable } from '@/game/state/interface';
import { PointEffect, PointEffectType } from '../fx/pointShader';
import { isNil } from 'lodash-es';

export const enum ProjectileDirection {
    Vertical,
    Horizontal
}

export class ArrowProjectile extends Projectile<TowerBoss> {
    static easing?: TimingFn;
    static dangerEasing?: TimingFn;

    static horizontal: MotaOffscreenCanvas2D | null = null;
    static vertical: MotaOffscreenCanvas2D | null = null;

    hitbox: Hitbox.Rect = new Hitbox.Rect(0, 0, 102, 32);
    damage: number = 1000;

    /** 弹幕的方向 */
    direction: ProjectileDirection = ProjectileDirection.Horizontal;

    private damaged: boolean = false;

    /**
     * boss战开始时初始化
     */
    static init() {
        this.easing = power(2, 'in');
        this.dangerEasing = power(3, 'out');
        this.horizontal = new MotaOffscreenCanvas2D();
        this.vertical = new MotaOffscreenCanvas2D();
        const hor = this.horizontal;
        hor.size(480 - 64, 32);
        hor.setHD(true);
        const ctxHor = hor.ctx;
        ctxHor.fillStyle = '#f00';
        ctxHor.globalAlpha = 0.6;
        for (let i = 0; i < 13; i++) {
            ctxHor.fillRect(i * 32 + 2, 2, 28, 28);
        }
        const ver = this.vertical;
        ver.size(480 - 64, 32);
        ver.setHD(true);
        const ctxVer = ver.ctx;
        ctxVer.fillStyle = '#f00';
        ctxVer.globalAlpha = 0.6;
        for (let i = 0; i < 13; i++) {
            ctxVer.fillRect(2, i * 32 + 2, 28, 28);
        }
    }

    /**
     * boss战结束后清理
     */
    static end() {
        this.easing = void 0;
        this.dangerEasing = void 0;
        this.horizontal?.clear();
        this.horizontal = null;
        this.vertical?.clear();
        this.vertical = null;
    }

    /**
     * 设置弹幕的数据
     * @param direction 弹幕的方向
     */
    setData(direction: ProjectileDirection) {
        this.direction = direction;
    }

    isIntersect(hitbox: Hitbox.HitboxType): boolean {
        if (hitbox instanceof Hitbox.Rect) {
            return Hitbox.checkRectRect(hitbox, this.hitbox);
        } else {
            return false;
        }
    }

    updateHitbox(x: number, y: number): void {
        this.hitbox.setPosition(x, y);
    }

    doDamage(target: IStateDamageable): boolean {
        if (this.damaged) return false;
        target.hp -= this.damage;
        this.damaged = true;
        return true;
    }

    ai(boss: TowerBoss, time: number, frame: number): void {
        if (time > 3000) {
            const progress = (time - 3000) / 2000;
            const res = ArrowProjectile.easing!(progress);
            const dx = res * 640;
            const x = 480 - 32 - dx;
            if (this.direction === ProjectileDirection.Horizontal) {
                this.setPosition(this.x, x);
            } else {
                this.setPosition(x, this.y);
            }
        } else if (time > 5000) {
            this.destroy();
        }
    }

    render(canvas: MotaOffscreenCanvas2D, transform: Transform): void {
        const ctx = canvas.ctx;

        if (this.time < 3000) {
            let begin = 1;
            if (this.time < 2000) {
                begin = ArrowProjectile.dangerEasing!(this.time / 2000);
            }
            ctx.beginPath();
            const len = begin * 13 * 32;
            const x1 = 480 - 32 - len;

            if (this.direction === ProjectileDirection.Horizontal) {
                const canvas = ArrowProjectile.horizontal!.canvas;
                ctx.drawImage(canvas, x1, this.y, len, 32);
            } else {
                const canvas = ArrowProjectile.vertical!.canvas;
                ctx.drawImage(canvas, this.y, x1, 32, len);
            }
        } else {
            const len = Math.max(this.y - 32, 0);
            if (this.direction === ProjectileDirection.Horizontal) {
                const canvas = ArrowProjectile.horizontal!.canvas;
                ctx.drawImage(canvas, 32, this.y, len, 32);
            } else {
                const canvas = ArrowProjectile.vertical!.canvas;
                ctx.drawImage(canvas, this.y, 32, 32, len);
            }
        }
        const img = core.material.images.images['arrow.png'];
        ctx.drawImage(img, this.x, this.y, 102, 32);
    }
}

export class PortalProjectile extends Projectile<TowerBoss> {
    static easing?: TimingFn;

    damage: number = 0;
    hitbox: Hitbox.Circle = new Hitbox.Circle(0, 0, 0);

    /** 传送目标位置 */
    private tx: number = 0;
    /** 传送目标位置 */
    private ty: number = 0;
    /** 是否已经传送过 */
    private transfered: boolean = false;

    private effect?: PointEffect;
    private effectId?: number;

    static init() {
        this.easing = hyper('sin', 'out');
    }

    static end() {
        this.easing = void 0;
    }

    createEffect(effect: PointEffect) {
        this.effect = effect;
        const id = effect.addEffect(
            PointEffectType.CircleWarpTangetial,
            Date.now(),
            4000,
            [this.tx * 32, this.ty * 32, 12, 20]
        );
        this.effectId = id;
    }

    /**
     * 设置传送目标位置
     */
    setTarget(x: number, y: number) {
        this.tx = x;
        this.ty = y;
    }

    isIntersect(hitbox: Hitbox.HitboxType): boolean {
        return false;
    }

    updateHitbox(x: number, y: number): void {
        this.hitbox.setCenter(x, y);
    }

    doDamage(target: IStateDamageable): boolean {
        return false;
    }

    ai(boss: TowerBoss, time: number, frame: number): void {
        if (!this.transfered && time > 2000) {
            this.transfered = true;
            core.setHeroLoc('x', this.tx);
            core.setHeroLoc('y', this.ty);
        }

        if (time > 4000) {
            this.destroy();
        }
    }

    render(canvas: MotaOffscreenCanvas2D, transform: Transform): void {
        const effect = this.effect;
        const id = this.effectId;
        if (!effect || isNil(id)) return;
        const time = this.time;
        const max = Math.PI * 8;
        if (time < 2000) {
            const progress = PortalProjectile.easing!(time / 2000);
            effect.setEffect(id, void 0, [0, max * progress, 0, 0]);
        } else {
            const progress = PortalProjectile.easing!((time - 2000) / 2000);
            effect.setEffect(id, void 0, [max * progress, max, 0, 0]);
        }
    }
}

export class IceProjectile extends Projectile<TowerBoss> {
    damage: number = 5000;
    hitbox: Hitbox.Rect = new Hitbox.Rect(0, 0, 32, 32);

    private damaged: boolean = false;
    private animated: boolean = false;
    private converted: boolean = false;

    private bx: number = 0;
    private by: number = 0;

    setPos(x: number, y: number) {
        this.bx = x;
        this.by = y;
    }

    isIntersect(hitbox: Hitbox.HitboxType): boolean {
        if (this.damaged) return false;
        if (this.time < 2000) return false;
        if (hitbox instanceof Hitbox.Rect) {
            return Hitbox.checkRectRect(hitbox, this.hitbox);
        } else {
            return false;
        }
    }

    updateHitbox(x: number, y: number): void {
        this.hitbox.setPosition(x, y);
    }

    doDamage(target: IStateDamageable): boolean {
        if (!this.damaged) return false;
        target.hp -= this.damage;
        this.damaged = true;
        return true;
    }

    ai(boss: TowerBoss, time: number, frame: number): void {
        if (!this.converted && time > 2000) {
            this.converted = true;
            core.setBgFgBlock('bg', 167, this.bx, this.by);
        }
        if (time > 4000) {
            core.setBgFgBlock('bg', 526, this.bx, this.by);
            this.destroy();
        }
    }

    render(canvas: MotaOffscreenCanvas2D, transform: Transform): void {
        const ctx = canvas.ctx;
        if (this.time < 2000) {
            const fill = ctx.fillStyle;
            const alpha = ctx.globalAlpha;
            ctx.fillStyle = 'rgb(150,150,255)';
            ctx.globalAlpha = 0.6;
            ctx.fillRect(this.x + 2, this.y + 2, 28, 28);
            ctx.fillStyle = fill;
            ctx.globalAlpha = alpha;
        } else {
            if (!this.animated) {
                this.animated = true;
                core.drawAnimate('ice', this.bx, this.by);
            }
        }
    }
}
