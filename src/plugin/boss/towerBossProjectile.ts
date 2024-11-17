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
    Horizontal,

    LeftToRight,
    RightToLeft,
    TopToBottom,
    BottomToTop
}

export class AttackProjectile extends Projectile<TowerBoss> {
    static easeIn?: TimingFn;
    static easeOut?: TimingFn;

    damage: number = 500;
    hitbox: Hitbox.Rect = new Hitbox.Rect(0, 0, 32, 32);

    static init() {
        this.easeIn = hyper('sin', 'out');
        this.easeOut = hyper('sin', 'in');
    }

    static end() {
        this.easeIn = void 0;
        this.easeOut = void 0;
    }

    isIntersect(hitbox: Hitbox.HitboxType): boolean {
        if (hitbox instanceof Hitbox.Rect) {
            return Hitbox.checkRectRect(this.hitbox, hitbox);
        } else {
            return false;
        }
    }

    updateHitbox(x: number, y: number): void {
        this.hitbox.setPosition(x, y);
    }

    doDamage(target: IStateDamageable): boolean {
        this.boss.attackBoss(this.damage);
        this.destroy();
        return true;
    }

    ai(boss: TowerBoss, time: number, frame: number): void {
        if (time > 4000) {
            this.destroy();
        }
    }

    render(canvas: MotaOffscreenCanvas2D, transform: Transform): void {
        const progress = this.time / 4000;
        let alpha = 1;
        let offset = 0;
        if (progress < 0.1) {
            alpha = progress * 10;
            offset = 24 * AttackProjectile.easeIn!(10 * (0.1 - progress));
        } else if (progress > 0.9) {
            alpha = 10 * (1 - progress);
            offset = 24 * AttackProjectile.easeOut!(10 * (progress - 0.9));
        } else {
            alpha = 1;
            offset = 0;
        }
        const ctx = canvas.ctx;
        ctx.save();
        ctx.strokeStyle = '#ffe229';
        ctx.fillStyle = '#ffe229';
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        const o = offset + 16;
        const cx = this.x + 16;
        const cy = this.y + 16;
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, o, 0, Math.PI * 2);
        ctx.moveTo(cx + o, cy);
        ctx.lineTo(cx + o + 16, cy);
        ctx.moveTo(cx, cy + o);
        ctx.lineTo(cx, cy + o + 16);
        ctx.moveTo(cx - o, cy);
        ctx.lineTo(cx - o - 16, cy);
        ctx.moveTo(cx, cy - o);
        ctx.lineTo(cx, cy - o - 16);
        ctx.stroke();
        ctx.restore();
    }
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
    private sounded: boolean = false;

    /**
     * boss战开始时初始化
     */
    static init() {
        this.easing = power(2, 'in');
        this.dangerEasing = power(3, 'out');
        this.horizontal = new MotaOffscreenCanvas2D();
        this.vertical = new MotaOffscreenCanvas2D();
        const hor = this.horizontal;
        hor.size(480, 32);
        hor.setHD(true);
        hor.withGameScale(true);
        const ctxHor = hor.ctx;
        ctxHor.fillStyle = '#f00';
        ctxHor.globalAlpha = 0.6;
        for (let i = 0; i < 15; i++) {
            ctxHor.fillRect(i * 32 + 2, 2, 28, 28);
        }
        const ver = this.vertical;
        ver.size(32, 480);
        ver.setHD(true);
        ver.withGameScale(true);
        const ctxVer = ver.ctx;
        ctxVer.fillStyle = '#f00';
        ctxVer.globalAlpha = 0.6;
        for (let i = 0; i < 15; i++) {
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
        if (direction === ProjectileDirection.Horizontal) {
            this.hitbox.setSize(102, 32);
        } else {
            this.hitbox.setSize(32, 102);
        }
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
        core.drawHeroAnimate('hand');
        return true;
    }

    ai(boss: TowerBoss, time: number, frame: number): void {
        if (time > 3000) {
            if (!this.sounded) {
                core.playSound('arrow.mp3');
                this.sounded = true;
            }
            const progress = (time - 3000) / 2000;
            const res = ArrowProjectile.easing!(progress);
            const dx = res * 640;
            const x = 480 - 32 - dx;
            if (this.direction === ProjectileDirection.Horizontal) {
                this.setPosition(x, this.y);
            } else {
                this.setPosition(this.x, x);
            }
        } else if (time > 5000) {
            this.destroy();
        }
    }

    render(canvas: MotaOffscreenCanvas2D, transform: Transform): void {
        const ctx = canvas.ctx;
        ctx.globalAlpha = 1;
        const ratio = devicePixelRatio * core.domStyle.scale;
        const cell = 32 * ratio;
        ctx.save();

        if (this.time < 3000) {
            let begin = 1;
            if (this.time < 2000) {
                begin = ArrowProjectile.dangerEasing!(this.time / 2000);
            }
            const len = begin * 13 * 32;
            const fl = len * ratio;
            const x1 = 480 - 32 - len;
            const fx1 = x1 * ratio;

            if (this.direction === ProjectileDirection.Horizontal) {
                const canvas = ArrowProjectile.horizontal!.canvas;
                ctx.drawImage(canvas, fx1, 0, fl, cell, x1, this.y, len, 32);
            } else {
                const canvas = ArrowProjectile.vertical!.canvas;
                ctx.drawImage(canvas, 0, fx1, cell, fl, this.x, x1, 32, len);
            }
        } else {
            if (this.direction === ProjectileDirection.Horizontal) {
                const len = Math.max(this.x - 32, 0);
                const fl = len * ratio;
                const canvas = ArrowProjectile.horizontal!.canvas;
                ctx.drawImage(canvas, cell, 0, fl, cell, 32, this.y, len, 32);
            } else {
                const len = Math.max(this.y - 32, 0);
                const fl = len * ratio;
                const canvas = ArrowProjectile.vertical!.canvas;
                ctx.drawImage(canvas, 0, cell, cell, fl, this.x, 32, 32, len);
            }
        }
        const img = core.material.images.images['arrow.png'];
        if (this.direction === ProjectileDirection.Vertical) {
            ctx.translate(this.x + 32, this.y);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(img, 0, 0, 102, 32);
        } else {
            ctx.drawImage(img, this.x, this.y, 102, 32);
        }
        ctx.restore();
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
    private effectId1?: number;
    private effectId2?: number;

    static init() {
        this.easing = hyper('sin', 'out');
    }

    static end() {
        this.easing = void 0;
    }

    createEffect(effect: PointEffect) {
        this.effect = effect;
        const id1 = effect.addEffect(
            PointEffectType.CircleWarpTangetial,
            Date.now(),
            4000,
            [this.tx * 32 + 16, this.ty * 32 + 16, 0, 32]
        );
        const id2 = effect.addEffect(
            PointEffectType.CircleContrast,
            Date.now(),
            4000,
            [this.tx * 32 + 16, this.ty * 32 + 16, 32, 24]
        );
        this.effectId1 = id1;
        this.effectId2 = id2;
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
        const id1 = this.effectId1;
        const id2 = this.effectId2;
        if (!effect || isNil(id1) || isNil(id2)) return;
        const time = this.time;
        const max = Math.PI * 2;
        if (time < 2000) {
            const progress = PortalProjectile.easing!(time / 2000);
            const ratio = Math.min(progress * 3, 1);
            effect.setEffect(id1, void 0, [0, max * progress, 0, 0]);
            effect.setEffect(id2, void 0, [ratio, 0, 0, 0]);
        } else {
            const progress = PortalProjectile.easing!((time - 2000) / 2000);
            const ratio = Math.min((1 - progress) * 3, 1);
            effect.setEffect(id1, void 0, [max * progress, max, 0, 0]);
            effect.setEffect(id2, void 0, [ratio, 0, 0, 0]);
        }
    }
}

export class IceProjectile extends Projectile<TowerBoss> {
    damage: number = 5000;
    hitbox: Hitbox.Rect = new Hitbox.Rect(0, 0, 32, 32);

    private damaged: boolean = false;
    /** 是否已经播放冰冻动画 */
    private animated: boolean = false;
    /** 是否已经转换成滑冰图块 */
    private converted: boolean = false;

    private bx: number = 0;
    private by: number = 0;

    /**
     * 设置这个寒冰弹幕的攻击位置
     */
    setPos(x: number, y: number) {
        this.bx = x;
        this.by = y;
        this.updateHitbox(x * 32, y * 32);
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
            ctx.fillStyle = 'rgb(150,150,255)';
            ctx.globalAlpha = 0.6;
            ctx.fillRect(this.x + 2, this.y + 2, 28, 28);
        } else {
            if (!this.animated) {
                this.animated = true;
                core.drawAnimate('ice', this.bx, this.by);
            }
        }
    }
}

export class ThunderProjectile extends Projectile<TowerBoss> {
    /** 闪电缓存画布 */
    static cache: MotaOffscreenCanvas2D | null = null;

    damage: number = 0;
    hitbox: Hitbox.Rect = new Hitbox.Rect(0, 0, 96, 96);

    private bx: number = 0;
    private by: number = 0;
    /** 闪电的强度 */
    private power: number = 0;
    private damaged: boolean = false;
    private cached: boolean = false;
    private sounded: boolean = false;

    private effect?: PointEffect;
    private effectId?: number;

    static init() {
        this.cache = new MotaOffscreenCanvas2D();
        this.cache.setHD(true);
        this.cache.withGameScale(true);
    }

    static end() {
        this.cache?.clear();
        this.cache = null;
    }

    /**
     * 创建着色器特效
     */
    createEffect(effect: PointEffect) {
        this.effect = effect;
        this.effectId = effect.addEffect(
            PointEffectType.CircleBrightness,
            Date.now() + 1000,
            400,
            [this.bx * 32 + 32, this.by * 32 + 32, 128, 32]
        );
    }

    /**
     * 设置闪电的信息
     */
    setData(x: number, y: number, power: number) {
        this.bx = x;
        this.by = y;
        this.power = power;
        this.damage = power * 3000;
        this.updateHitbox(x * 32 - 32, y * 32 - 32);
    }

    isIntersect(hitbox: Hitbox.HitboxType): boolean {
        if (this.damaged) return false;
        if (this.time < 1000) return false;
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
        this.damaged = true;
        target.hp -= this.damage;
        return true;
    }

    ai(boss: TowerBoss, time: number, frame: number): void {
        if (time > 1000) {
            if (!this.sounded) {
                core.playSound('thunder.mp3');
                this.sounded = true;
            }
        }
        if (time > 2000) {
            this.destroy();
        }
    }

    render(canvas: MotaOffscreenCanvas2D, transform: Transform): void {
        const ctx = canvas.ctx;
        if (this.time < 1000) {
            const before = ctx.fillStyle;
            ctx.fillStyle = '#fff';
            for (let dx = -1; dx < 2; dx++) {
                for (let dy = -1; dy < 2; dy++) {
                    const x = (this.bx + dx) * 32 + 2;
                    const y = (this.by + dy) * 32 + 2;
                    ctx.fillRect(x, y, 28, 28);
                }
            }
            ctx.fillStyle = before;
        } else {
            if (!this.cached) this.cacheThunder();
            if (!ThunderProjectile.cache) return;
            const x = this.bx * 32;
            const before = ctx.globalAlpha;
            const progress = (this.time - 1000) / 1000;
            if (progress < 0.4) {
                const effect = this.effect;
                const id = this.effectId;
                if (!effect || isNil(id)) return;
                const effectRatio = ArrowProjectile.dangerEasing!(
                    progress * 2.5
                );
                effect.setEffect(id, void 0, [effectRatio, 0, 0, 0]);
            }
            if (progress < 0.5) {
                ctx.globalAlpha = 1;
            } else {
                ctx.globalAlpha = 1 - (progress - 0.5) * 2;
            }
            ctx.drawImage(ThunderProjectile.cache.canvas, x - 60, 0);
            ctx.globalAlpha = before;
        }
    }

    private cacheThunder() {
        const cache = ThunderProjectile.cache;
        if (!cache) return;
        const bottom = this.by * 32 + 32;
        cache.size(120, bottom);
        const ctx = cache.ctx;
        ctx.beginPath();
        for (let i = 0; i < this.power; i++) {
            let x = this.bx * 32;
            let y = this.by * 32;
            ctx.moveTo(x, y);
            while (y > 0) {
                x += Math.floor(Math.random() * 30 - 15);
                y -= Math.floor(Math.random() * 80);
                ctx.lineTo(x, y);
            }
        }
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#62c8f4';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
    }
}

export class ThunderBallProjectile extends Projectile<TowerBoss> {
    static dangerEasing?: TimingFn;

    static horizontal: MotaOffscreenCanvas2D | null = null;
    static vertical: MotaOffscreenCanvas2D | null = null;

    damage: number = 3000;
    hitbox: Hitbox.Rect = new Hitbox.Rect(0, 0, 16, 16);

    private direction: ProjectileDirection = ProjectileDirection.BottomToTop;
    private cx: number = 0;
    private cy: number = 0;
    private damaged: boolean = false;
    private sounded: boolean = false;

    /**
     * boss战开始时初始化
     */
    static init() {
        this.dangerEasing = power(3, 'out');
        this.horizontal = new MotaOffscreenCanvas2D();
        this.vertical = new MotaOffscreenCanvas2D();
        const hor = this.horizontal;
        hor.size(480 - 64, 32);
        hor.setHD(true);
        hor.withGameScale(true);
        const ctxHor = hor.ctx;
        ctxHor.fillStyle = '#fff';
        ctxHor.globalAlpha = 0.6;
        for (let i = 0; i < 13; i++) {
            ctxHor.fillRect(i * 32 + 2, 2, 28, 28);
        }
        const ver = this.vertical;
        ver.size(480 - 64, 32);
        ver.setHD(true);
        ver.withGameScale(true);
        const ctxVer = ver.ctx;
        ctxVer.fillStyle = '#fff';
        ctxVer.globalAlpha = 0.6;
        for (let i = 0; i < 13; i++) {
            ctxVer.fillRect(2, i * 32 + 2, 28, 28);
        }
    }

    /**
     * boss战结束后清理
     */
    static end() {
        this.dangerEasing = void 0;
        this.horizontal?.clear();
        this.horizontal = null;
        this.vertical?.clear();
        this.vertical = null;
    }

    setData(direction: ProjectileDirection, cx: number, cy: number) {
        this.cx = cx;
        this.cy = cy;
        this.direction = direction;
        this.setPosition(cx * 32 + 16, cy * 32 + 16);
    }

    isIntersect(hitbox: Hitbox.HitboxType): boolean {
        if (this.damaged) return false;
        if (this.time < 3000) return false;
        if (hitbox instanceof Hitbox.Rect) {
            return Hitbox.checkRectRect(this.hitbox, hitbox);
        } else {
            return false;
        }
    }

    updateHitbox(x: number, y: number): void {
        this.hitbox.setPosition(x, y);
    }

    doDamage(target: IStateDamageable): boolean {
        if (this.damaged) return false;
        this.damaged = true;
        target.hp -= this.damage;
        core.playSound('electron.mp3');
        return true;
    }

    ai(boss: TowerBoss, time: number, frame: number): void {
        if (time > 3000) {
            if (!this.sounded) {
                core.playSound('electron.mp3');
                this.sounded = true;
            }
            const dt = time - 3000;
            const dis = dt * 0.2;
            const cx = this.cx * 32 + 16;
            const cy = this.cy * 32 + 16;

            switch (this.direction) {
                case ProjectileDirection.BottomToTop:
                    this.setPosition(cx, cy - dis);
                    break;
                case ProjectileDirection.LeftToRight:
                    this.setPosition(cx + dis, cy);
                    break;
                case ProjectileDirection.RightToLeft:
                    this.setPosition(cx - dis, cy);
                    break;
                case ProjectileDirection.TopToBottom:
                    this.setPosition(cx, cy + dis);
                    break;
            }

            if (this.x < -16 || this.x > 496 || this.y < -16 || this.y > 496) {
                this.destroy();
            }
        }
    }

    render(canvas: MotaOffscreenCanvas2D, transform: Transform): void {
        const ctx = canvas.ctx;
        const cx = this.cx * 32 + 16;
        const cy = this.cy * 32 + 16;
        let left = 0;
        let right = 0;
        let top = 0;
        let bottom = 0;
        if (this.time < 3000) {
            let begin = 1;
            if (this.time < 2000) {
                begin = ArrowProjectile.dangerEasing!(this.time / 2000);
            }

            switch (this.direction) {
                case ProjectileDirection.BottomToTop: {
                    const height = (cy - 48) * begin;
                    left = cx - 16;
                    right = cx + 16;
                    bottom = cy + 16;
                    top = cy - height - 16;
                    break;
                }
                case ProjectileDirection.LeftToRight: {
                    const width = (432 - cx) * begin;
                    left = cx - 16;
                    right = cx + 16 + width;
                    bottom = cy + 16;
                    top = cy - 16;
                    break;
                }
                case ProjectileDirection.RightToLeft: {
                    const width = (cx - 48) * begin;
                    left = cx - width - 16;
                    right = cx + 16;
                    bottom = cy + 16;
                    top = cy - 16;
                    break;
                }
                case ProjectileDirection.TopToBottom: {
                    const height = (432 - cy) * begin;
                    left = cx - 16;
                    right = cx + 16;
                    bottom = cy + 16;
                    top = cy + 16 + height;
                    break;
                }
            }
        } else {
            switch (this.direction) {
                case ProjectileDirection.BottomToTop: {
                    left = cx - 16;
                    right = cx + 16;
                    bottom = this.y;
                    top = 32;
                    break;
                }
                case ProjectileDirection.LeftToRight: {
                    left = this.x;
                    right = 448;
                    bottom = cy + 16;
                    top = cy - 16;
                    break;
                }
                case ProjectileDirection.RightToLeft: {
                    left = 32;
                    right = this.x;
                    bottom = cy + 16;
                    top = cy - 16;
                    break;
                }
                case ProjectileDirection.TopToBottom: {
                    left = cx - 16;
                    right = cx + 16;
                    bottom = 448;
                    top = this.y;
                    break;
                }
            }
        }
        const w = right - left;
        const h = bottom - top;
        const hor = ThunderBallProjectile.horizontal!.canvas;
        const ver = ThunderBallProjectile.vertical!.canvas;
        switch (this.direction) {
            case ProjectileDirection.BottomToTop:
            case ProjectileDirection.TopToBottom: {
                ctx.drawImage(hor, 0, top, 32, h, left, top, w, h);
                break;
            }
            case ProjectileDirection.LeftToRight:
            case ProjectileDirection.RightToLeft: {
                ctx.drawImage(ver, left, 0, w, 32, left, top, w, h);
            }
        }
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        const radius = 9 + Math.floor(Math.random() * 8 - 4);
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class BoomProjectile extends Projectile<TowerBoss> {
    damage: number = 3000;
    hitbox: Hitbox.Rect = new Hitbox.Rect(0, 0, 32, 32);

    private bx: number = 0;
    private by: number = 0;
    private last: number = 500;

    private damaged: boolean = false;
    private animated: boolean = false;

    setData(x: number, y: number, last: number) {
        this.bx = x;
        this.by = y;
        this.last = last;
        this.setPosition(x * 32, y * 32);
    }

    isIntersect(hitbox: Hitbox.HitboxType): boolean {
        if (this.time < this.last + 1000) return false;
        if (this.damaged) return false;
        if (hitbox instanceof Hitbox.Rect) {
            return Hitbox.checkRectRect(this.hitbox, hitbox);
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
        if (!this.animated && time > this.last + 1000) {
            core.drawAnimate('explosion1', this.bx, this.by);
        }
        if (time > this.last + 1100) {
            this.destroy();
        }
    }

    render(canvas: MotaOffscreenCanvas2D, transform: Transform): void {
        const ctx = canvas.ctx;
        const end = this.last + 1000;
        const r = 12;
        const mr = 27;
        if (this.time < end) {
            const angle = this.time / 30;
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);
            ctx.fillStyle = 'rgb(255,50,50)';
            ctx.strokeStyle = 'rgb(255,50,50)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x + r * cos, this.y + r * sin);
            ctx.lineTo(this.x + mr * cos, this.y + mr * sin);
            ctx.moveTo(this.x - r * cos, this.y - r * sin);
            ctx.lineTo(this.x - mr * cos, this.y - mr * sin);
            ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        if (this.time > end - 500) {
            const dt = this.time - end + 500;
            const pos = this.y - (1 - dt / 500) * 480;
            const img = core.material.images.images['boom.png'];
            ctx.drawImage(img, this.x - 16, pos - 80, 36, 80);
        }
    }
}

export class ChainProjectile extends Projectile<TowerBoss> {
    damage: number = 4000;
    hitbox: Hitbox.Line = new Hitbox.Line(0, 0, 0, 0);

    private damaged: boolean = false;

    isIntersect(hitbox: Hitbox.HitboxType): boolean {
        if (this.time < 1000) return false;
        if (this.damaged) return false;
        if (hitbox instanceof Hitbox.Rect) {
            return Hitbox.checkLineRect(this.hitbox, hitbox);
        } else {
            return false;
        }
    }

    updateHitbox(x: number, y: number): void {
        this.hitbox.setPoint1(x, y);
    }

    doDamage(target: IStateDamageable): boolean {
        if (this.damaged) return false;
        target.hp -= this.damage;
        this.damaged = true;
        core.playSound('electron.mp3');
        return true;
    }

    ai(boss: TowerBoss, time: number, frame: number): void {
        if (time > 2000) {
            this.destroy();
        }
    }

    render(canvas: MotaOffscreenCanvas2D, transform: Transform): void {
        const ctx = canvas.ctx;
        ctx.beginPath();
        ctx.moveTo(this.hitbox.x1, this.hitbox.y1);
        ctx.lineTo(this.hitbox.x2, this.hitbox.y2);

        if (this.time < 1000) {
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = 'rgb(220,100,255)';
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#fff';
            ctx.shadowBlur = 3;
            ctx.shadowColor = '#62c8f4';
            ctx.globalAlpha = 0.6;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.shadowColor = '';
        }
    }
}
