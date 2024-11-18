import { Shader } from '@/core/render/shader';
import { PointEffect } from '../fx/pointShader';
import { BarrageBoss, BossSprite, Hitbox } from './barrage';
import { MotaRenderer } from '@/core/render/render';
import { LayerGroup } from '@/core/render/preset/layer';
import { RenderItem } from '@/core/render/item';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { Transform } from '@/core/render/transform';
import { Animation, hyper, power, sleep, Transition } from 'mutate-animate';
import { Container } from '@/core/render/container';
import {
    ArrowProjectile,
    AttackProjectile,
    BoomProjectile,
    ChainProjectile,
    IceProjectile,
    PortalProjectile,
    ProjectileDirection,
    ThunderBallProjectile,
    ThunderProjectile
} from './towerBossProjectile';
import { IStateDamageable } from '@/game/state/interface';
import { HeroRenderer } from '@/core/render/preset/hero';
import { controller } from '@/module/weather';
import { PopText } from '../fx/pop';

Mota.require('var', 'loading').once('coreInit', () => {
    const shader = new Shader();
    shader.size(480, 480);
    shader.setHD(true);
    shader.setZIndex(120);
    TowerBoss.shader = shader;
    TowerBoss.effect.create(shader, 40);
});

const enum TowerBossStage {
    /** 开场白阶段 */
    Prologue,

    Stage1,
    Dialogue1,
    Stage2,
    Dialogue2,
    Stage3,
    Stage4,
    Stage5,

    End
}

const enum HealthBarStatus {
    Start,
    Running,
    End
}

export class TowerBoss extends BarrageBoss {
    static effect: PointEffect = new PointEffect();
    static shader: Shader;

    /** boss战阶段 */
    stage: TowerBossStage = TowerBossStage.Prologue;
    /** 当前boss血量 */
    hp: number = 10000;
    /** 当前时刻 */
    time: number = 0;

    readonly hitbox: Hitbox.Rect;
    readonly state: IStateDamageable;
    readonly main: BossEffect;

    /** 血条显示元素 */
    private healthBar: HealthBar;
    /** 对话文字显示元素 */
    private word: Word;
    /** 楼层渲染元素 */
    private group: LayerGroup;
    /** 楼层渲染容器 */
    private mapDraw: Container;
    /** 伤害弹出 */
    pop: PopText;

    /** 每个阶段的进度，具体定义参考 ai 函数开头 */
    private stageProgress: number = 0;
    /** 当前阶段的开始时刻 */
    private stageStartTime: number = 0;
    /** 每一阶段的攻击boss次数 */
    private attackTime: number = 0;
    /** 攻击boss的红圈间隔时长 */
    private attackInterval: number = 7000;

    /** 使用技能1 智慧之矢 的次数 */
    private skill1Time: number = 0;
    /** 使用技能2 随机传送 的次数 */
    private skill2Time: number = 0;
    /** 使用技能3 冰锥 的次数 */
    private skill3Time: number = 0;
    /** 技能1的释放间隔 */
    private skill1Interval: number = 10000;
    /** 技能2的释放间隔 */
    private skill2Interval: number = 7000;
    /** 技能3的释放间隔 */
    private skill3Interval: number = 13000;

    /** 使用技能4 随机闪电 的次数 */
    private skill4Time: number = 0;
    /** 使用技能5 球形闪电 的次数 */
    private skill5Time: number = 0;
    /** 技能4的释放间隔 */
    private skill4Interval: number = 4000;
    /** 技能5的释放间隔 */
    private skill5Interval: number = 12000;

    /** 使用技能6 炸弹 的次数 */
    private skill6Time: number = 0;
    /** 使用技能7 连锁闪电 的次数 */
    private skill7Time: number = 0;
    /** 技能6的释放间隔 */
    private skill6Interval: number = 500;
    /** 技能7的释放间隔 */
    private skill7Interval: number = 10000;

    private heroHp: number = 0;

    constructor() {
        super();

        this.healthBar = new HealthBar('absolute');
        this.word = new Word('absolute');
        this.main = new BossEffect('absolute', this);
        const render = MotaRenderer.get('render-main')!;
        this.group = render.getElementById('layer-main') as LayerGroup;
        this.mapDraw = render.getElementById('map-draw') as Container;
        this.pop = render.getElementById('pop-main') as PopText;

        this.healthBar.init();
        this.word.init();
        this.main.init();

        TowerBoss.effect.setTransform(this.group.camera);

        const { x, y } = core.status.hero.loc;
        const cell = 32;
        this.hitbox = new Hitbox.Rect(x * cell + 2, y * cell + 2, 28, 28);
        this.state = core.status.hero;
    }

    private moveTick = (x: number, y: number) => {
        this.hitbox.setPosition(x * 32 + 2, y * 32 + 2);
    };

    override start() {
        super.start();

        TowerBoss.shader.append(this.mapDraw);
        this.healthBar.append(this.group);
        this.word.append(this.group);
        this.main.append(this.group);

        const event = this.group.getLayer('event');
        const hero = event?.getExtends('floor-hero') as HeroRenderer;
        hero?.on('moveTick', this.moveTick);

        ArrowProjectile.init();
        PortalProjectile.init();
        ThunderProjectile.init();
        ThunderBallProjectile.init();
        AttackProjectile.init();

        TowerBoss.effect.start();
        TowerBoss.effect.use();

        this.heroHp = core.status.hero.hp;
    }

    override end() {
        super.end();
        TowerBoss.shader.remove();
        this.healthBar.remove();
        this.word.remove();
        this.main.remove();

        const event = this.group.getLayer('event');
        const hero = event?.getExtends('floor-hero') as HeroRenderer;
        hero?.off('moveTick', this.moveTick);

        ArrowProjectile.end();
        PortalProjectile.end();
        ThunderProjectile.end();
        ThunderBallProjectile.end();
        AttackProjectile.end();

        TowerBoss.effect.end();
        core.status.hero.hp = this.heroHp;

        Mota.Plugin.require('replay_g').clip('choice:0');
    }

    /**
     * 用于全局检测，例如受伤、攻击boss等
     */
    check(time: number) {
        this.checkLose();
    }

    private checkLose() {
        if (core.status.hero.hp < 0) {
            core.lose();
            core.updateStatusBar();
            this.end();
        }
    }

    /**
     * 攻击boss
     * @param damage 造成的伤害
     */
    attackBoss(damage: number) {
        this.hp -= damage;
        if (this.hp < 0) this.hp = 0;
        this.healthBar.set(this.hp);
        // 先用drawAnimate凑活一下，等下个版本提供更好的 api
        if (this.stage === TowerBossStage.Stage3) {
            core.drawAnimate('hand', 7, 2);
            this.pop.addPop((-damage).toString(), 1000, 240, 80, '#dafc1d');
        } else if (this.stage === TowerBossStage.Stage4) {
            core.drawAnimate('hand', 7, 3);
            this.pop.addPop((-damage).toString(), 1000, 240, 112, '#dafc1d');
        } else if (this.stage === TowerBossStage.Stage5) {
            core.drawAnimate('hand', 7, 4);
            this.pop.addPop((-damage).toString(), 1000, 240, 144, '#dafc1d');
        } else {
            core.drawAnimate('hand', 7, 1);
            this.pop.addPop((-damage).toString(), 1000, 240, 172, '#dafc1d');
        }
    }

    /**
     * 添加攻击boss的圆圈
     * @param last 持续时长
     * @param damage 造成的伤害
     */
    addAttackCircle(_: number, n: number) {
        const s = 13 - n * 2;
        const nx = Math.floor(Math.random() * s + n + 1);
        const ny = Math.floor(Math.random() * s + n + 1);
        const proj = this.createProjectile(AttackProjectile, nx * 32, ny * 32);
        proj.damage = 250 + Math.floor(Math.random() * 500);
    }

    ai(time: number, frame: number): void {
        this.time = time;
        const fixedTime = time - this.stageStartTime;
        this.main.update();
        this.check(time);
        TowerBoss.effect.requestUpdate();
        switch (this.stage) {
            case TowerBossStage.Prologue:
                this.aiPrologue(fixedTime, frame);
                break;
            case TowerBossStage.Stage1:
                this.aiStage1(fixedTime, frame);
                break;
            case TowerBossStage.Dialogue1:
                this.aiDialogue1(fixedTime, frame);
                break;
            case TowerBossStage.Stage2:
                this.aiStage2(fixedTime, frame);
                break;
            case TowerBossStage.Dialogue2:
                this.aiDialogue2(fixedTime, frame);
                break;
            case TowerBossStage.Stage3:
                this.aiStage3(fixedTime, frame);
                break;
            case TowerBossStage.Stage4:
                this.aiStage4(fixedTime, frame);
                break;
            case TowerBossStage.Stage5:
                this.aiStage5(fixedTime, frame);
                break;
            case TowerBossStage.End:
                this.aiEnd(fixedTime, frame);
                break;
        }
    }

    /**
     * 切换boss阶段
     * @param stage 切换至的阶段
     * @param time 在当前阶段经过的时间
     */
    private changeStage(stage: TowerBossStage, time: number) {
        this.stage = stage;
        this.stageStartTime += time;
        this.stageProgress = 0;
    }

    private aiPrologue(time: number, frame: number) {
        // stageProgress:
        // 0: 开始; 1: 开始血条动画

        if (this.stageProgress === 0) {
            this.healthBar.showStart();
            this.stageProgress = 1;
        }

        if (time > 1500) {
            this.changeStage(TowerBossStage.Stage1, time);
            this.attackTime = 2;
            this.skill1Time = 1;
            this.skill2Time = 1;
            this.skill3Time = 1;
            core.playBgm('towerBoss.mp3');
        }
    }

    async releaseSkill1() {
        const locs = new Set<number>();
        const count = Math.ceil(Math.random() * 8) + 4;
        let i = 0;
        while (i < count) {
            const dir = Math.floor(Math.random() * 2);
            const pos = Math.floor(Math.random() * 13);
            const loc = pos + dir * 13;
            if (locs.has(loc)) continue;
            i++;
            locs.add(loc);
            const proj = this.createProjectile(ArrowProjectile, 0, 0);
            proj.setData(dir);
            if (dir === ProjectileDirection.Horizontal) {
                proj.setPosition(480 - 32, pos * 32 + 32);
            } else {
                proj.setPosition(pos * 32 + 32, 480 - 32);
            }
            await sleep(200);
        }
    }

    releaseSkill2() {
        const x = Math.floor(Math.random() * 13 + 1);
        const y = Math.floor(Math.random() * 13 + 1);
        const proj = this.createProjectile(PortalProjectile, 0, 0);
        proj.setTarget(x, y);
        proj.createEffect(TowerBoss.effect);
    }

    async releaseSkill3() {
        const count = Math.floor(Math.random() * 100);
        const used = new Set<number>();
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * 13 + 1);
            const y = Math.floor(Math.random() * 13 + 1);
            const index = x + y * 13;
            if (used.has(index)) continue;
            used.add(index);
            const proj = this.createProjectile(IceProjectile, x * 32, y * 32);
            proj.setPos(x, y);
            await sleep(20);
        }
    }

    private aiStage1(time: number, frame: number) {
        // stageProgress:
        // 0: 开始; 1,2,3,4: 对应对话

        const skill1Release = this.skill1Time * this.skill1Interval;
        const skill2Release = this.skill2Time * this.skill2Interval;
        const skill3Release = this.skill3Time * this.skill3Interval;
        const attack = this.attackTime * this.attackInterval;

        if (time > skill1Release) {
            this.releaseSkill1();
            this.skill1Time++;
        }
        if (time > skill2Release) {
            this.releaseSkill2();
            this.skill2Time++;
        }
        if (time > skill3Release) {
            this.releaseSkill3();
            this.skill3Time++;
        }
        if (time > attack) {
            this.addAttackCircle(500, 0);
            this.attackTime++;
        }

        if (this.hp <= 7000) {
            this.changeStage(TowerBossStage.Dialogue1, time);
            this.attackTime = 1;
        }
    }

    private aiDialogue1(time: number, frame: number) {
        this.changeStage(TowerBossStage.Stage2, time);
        this.attackTime = 3;
        this.skill4Time = 5;
        this.skill5Time = 3;
        core.playBgm('towerBoss2.mp3');
        controller.activate('rain', 6);
    }

    releaseSkill4() {
        const x = Math.floor(Math.random() * 11 + 2);
        const y = Math.floor(Math.random() * 11 + 2);
        const power = Math.floor(Math.random() * 6 + 1);
        const proj = this.createProjectile(ThunderProjectile, 0, 0);
        proj.setData(x, y, power);
        proj.createEffect(TowerBoss.effect);
    }

    async releaseSkill5() {
        const count = Math.floor(Math.random() * 12 + 6);
        const used = new Set<number>();
        let i = 0;
        while (i < count) {
            const x = Math.floor(Math.random() * 13 + 1);
            const y = Math.floor(Math.random() * 13 + 1);
            const index = x + y * 13;
            if (used.has(index)) continue;
            i++;
            used.add(index);
            const px = x * 32 + 16;
            const py = y * 32 + 16;
            const proj1 = this.createProjectile(ThunderBallProjectile, 0, 0);
            const proj2 = this.createProjectile(ThunderBallProjectile, 0, 0);
            const proj3 = this.createProjectile(ThunderBallProjectile, 0, 0);
            const proj4 = this.createProjectile(ThunderBallProjectile, 0, 0);
            proj1.setData(ProjectileDirection.BottomToTop, x, y);
            proj2.setData(ProjectileDirection.LeftToRight, x, y);
            proj3.setData(ProjectileDirection.RightToLeft, x, y);
            proj4.setData(ProjectileDirection.TopToBottom, x, y);
            proj1.setPosition(px, py);
            proj2.setPosition(px, py);
            proj3.setPosition(px, py);
            proj4.setPosition(px, py);
            await sleep(200);
        }
    }

    private aiStage2(time: number, frame: number) {
        const skill4Release = this.skill4Time * this.skill4Interval;
        const skill5Release = this.skill5Time * this.skill5Interval;
        const attack = this.attackTime * this.attackInterval;

        if (time > skill4Release) {
            this.releaseSkill4();
            this.skill4Time++;
        }
        if (time > skill5Release) {
            this.releaseSkill5();
            this.skill5Time++;
        }
        if (time > attack) {
            this.addAttackCircle(500, 0);
            this.attackTime++;
        }

        if (this.hp <= 3500) {
            this.changeStage(TowerBossStage.Dialogue2, time);
            this.attackTime = 1;
        }
    }

    /**
     * 压缩地形，将地形向内压缩一格
     */
    terrainClose(n: number) {
        for (let nx = n - 1; nx < 15 - n + 1; nx++) {
            core.removeBlock(nx, n - 1);
            core.removeBlock(nx, 15 - n);
            core.setBgFgBlock('bg', 0, nx, n - 1);
            core.setBgFgBlock('bg', 0, nx, 15 - n);
        }
        for (let ny = n; ny < 15 - n; ny++) {
            core.removeBlock(n - 1, ny);
            core.removeBlock(15 - n, ny);
            core.setBgFgBlock('bg', 0, n - 1, ny);
            core.setBgFgBlock('bg', 0, 15 - n, ny);
        }
        for (let nx = n; nx < 15 - n; nx++) {
            core.setBlock(527, nx, n);
            core.setBlock(527, nx, 15 - n - 1);
        }
        for (let ny = n + 1; ny < 15 - n - 1; ny++) {
            core.setBlock(527, n, ny);
            core.setBlock(527, 15 - n - 1, ny);
        }
        core.stopAutomaticRoute();
        core.setHeroLoc('x', 7);
        core.setHeroLoc('y', 7);
        core.setHeroLoc('direction', 'up');
        core.setBlock(557, 7, n + 1);
    }

    private aiDialogue2(time: number, frame: number) {
        this.changeStage(TowerBossStage.Stage3, time);
        this.attackTime = 3;
        this.terrainClose(1);
        this.skill6Time = 30;
        this.skill7Time = 2;
        core.playBgm('towerBoss3.mp3');
    }

    releaseSkill6(n: number, last: number) {
        const s = 15 - n * 2;
        const x = Math.floor(Math.random() * s + n);
        const y = Math.floor(Math.random() * s + n);
        const proj = this.createProjectile(BoomProjectile, 0, 0);
        proj.setData(x, y, last);
    }

    async releaseSkill7(n: number) {
        const count = Math.floor(Math.random() * 6 + 3);
        const nodes: LocArr[] = [];
        let lastX = -1;
        let lastY = -1;
        const s = 15 - n * 2;
        const used = new Set<number>();
        let i = 0;
        while (i < count) {
            const x = Math.floor(Math.random() * s + n);
            const y = Math.floor(Math.random() * s + n);
            const index = x + y * s;
            if (used.has(index)) continue;
            i++;
            used.add(index);
            nodes.push([x, y]);
            if (lastX !== -1 && lastY !== -1) {
                const proj = this.createProjectile(ChainProjectile, 0, 0);
                proj.hitbox.setPoint1(lastX * 32 + 16, lastY * 32 + 16);
                proj.hitbox.setPoint2(x * 32 + 16, y * 32 + 16);
            }
            lastX = x;
            lastY = y;
        }
    }

    private aiStage3(time: number, frame: number) {
        const skill6Release = this.skill6Time * this.skill6Interval;
        const skill7Release = this.skill7Time * this.skill7Interval;
        const attack = this.attackTime * this.attackInterval;

        if (time > skill6Release) {
            this.releaseSkill6(2, 500);
            this.skill6Time++;
        }
        if (time > skill7Release) {
            this.releaseSkill7(2);
            this.skill7Time++;
        }
        if (time > attack) {
            this.addAttackCircle(500, 1);
            this.attackTime++;
        }

        if (this.hp <= 2000) {
            this.changeStage(TowerBossStage.Stage4, time);
            this.terrainClose(2);
            this.attackTime = 1;
            this.skill6Time = 12;
            this.skill6Interval = 400;
            this.skill7Time = 1;
        }
    }

    private aiStage4(time: number, frame: number) {
        const skill6Release = this.skill6Time * this.skill6Interval;
        const skill7Release = this.skill7Time * this.skill7Interval;
        const attack = this.attackTime * this.attackInterval;

        if (time > skill6Release) {
            this.releaseSkill6(3, 500);
            this.skill6Time++;
        }
        if (time > skill7Release) {
            this.releaseSkill7(3);
            this.skill7Time++;
        }
        if (time > attack) {
            this.addAttackCircle(500, 2);
            this.attackTime++;
        }

        if (this.hp <= 1000) {
            this.changeStage(TowerBossStage.Stage5, time);
            this.terrainClose(3);
            this.attackTime = 1;
            this.skill6Time = 17;
            this.skill6Interval = 300;
            this.skill7Time = 1;
        }
    }

    private aiStage5(time: number, frame: number) {
        const skill6Release = this.skill6Time * this.skill6Interval;
        const skill7Release = this.skill7Time * this.skill7Interval;
        const attack = this.attackTime * this.attackInterval;

        if (time > skill6Release) {
            this.releaseSkill6(4, 500);
            this.skill6Time++;
        }
        if (time > skill7Release) {
            this.releaseSkill7(4);
            this.skill7Time++;
        }
        if (time > attack) {
            this.addAttackCircle(500, 3);
            this.attackTime++;
        }

        if (this.hp <= 0) {
            this.changeStage(TowerBossStage.End, time);
        }
    }

    private aiEnd(time: number, frame: number) {
        this.end();
        core.insertAction([
            { type: 'openDoor', loc: [13, 6], floorId: 'MT19' },
            { type: 'setValue', name: 'flag:boss1', value: 'true' },
            { type: 'changeFloor', floorId: 'MT20', loc: [7, 9] },
            { type: 'forbidSave' },
            { type: 'showStatusBar' }
        ]);
    }
}

class BossEffect extends BossSprite<TowerBoss> {
    /**
     * 初始化
     */
    init() {
        this.size(480, 480);
        this.setHD(true);
        this.setZIndex(80);
    }

    protected preDraw(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): boolean {
        return true;
    }

    protected postDraw(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}
}

interface TextRenderable {
    x: number;
    y: number;
    blur: number;
    text: string;
}

class Word extends RenderItem {
    private ani: Animation = new Animation();

    /** 当前正在显示的文字 */
    private showing: string = '';
    /** 文字显示时间间隔 */
    private showInterval: number = 100;
    /** 文字显示的虚化时长 */
    private showBlurTime: number = 200;
    /** 显示开始时刻 */
    private showStartTime: number = 0;

    /** 最大虚化程度 */
    private readonly MAX_BLUR = 5;

    /**
     * 初始化
     */
    init() {
        this.size(480, 24);
        this.setHD(true);
        this.setZIndex(95);
    }

    /**
     * 降下背景
     */
    curtainDown() {
        this.delegateTicker(() => {
            this.pos(this.ani.x, this.ani.y);
        }, 700);
        this.ani.time(600).mode(hyper('sin', 'out')).absolute().move(0, 24);
        return sleep(700);
    }

    /**
     * 升起背景
     */
    curtainUp() {
        this.delegateTicker(() => {
            this.pos(this.ani.x, this.ani.y);
        }, 700);
        this.ani.time(600).mode(hyper('sin', 'out')).absolute().move(0, 0);
        return sleep(700);
    }

    /**
     * 显示文字，会将之前的文字取消显示
     * @param text 要显示的文字
     */
    showText(text: string) {
        this.showStartTime = Date.now();
        this.showing = text;
    }

    /**
     * 设置文字显示的参数
     * @param interval 文字显示时间间隔
     * @param blurTime 文字显示虚化时长
     */
    setParam(interval: number, blurTime: number) {
        this.showInterval = interval;
        this.showBlurTime = blurTime;
    }

    private getTextRenerable() {
        const dt = Date.now() - this.showStartTime;
        const res: TextRenderable[] = [];

        [...this.showing].forEach((v, i) => {
            const showStartTime = i * this.showInterval;
            const blurRatio = (dt - showStartTime) / this.showBlurTime;
            let blur = blurRatio * this.MAX_BLUR;
            if (blur < 0) blur = 0;
            else if (blur > this.MAX_BLUR) blur = this.MAX_BLUR;

            const obj: TextRenderable = {
                blur,
                x: i * 18,
                y: 12,
                text: v
            };
            res.push(obj);
        });
        return res;
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const data = this.getTextRenerable();
        const ctx = canvas.ctx;
        ctx.font = '18px "normal"';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        for (const { blur, x, y, text } of data) {
            if (blur !== 0) {
                ctx.filter = `blur(${blur}px)`;
            } else {
                ctx.filter = 'none';
            }
            ctx.fillText(text, x, y);
        }
    }
}

class HealthBar extends RenderItem {
    private trans: Transition = new Transition();
    /** 当前血条状态 */
    private status: HealthBarStatus = HealthBarStatus.Start;

    /**
     * 初始化
     */
    init() {
        this.trans.time(2000).absolute().mode(power(3, 'out'));
        this.trans.value.hp = 0;
        this.trans.value.x = 0;
        this.trans.value.y = -16;

        this.size(480, 16);
        this.setHD(true);
        this.setZIndex(100);
    }

    /**
     * 设置剩余血量
     */
    set(value: number) {
        this.trans.time(2000).mode(power(3, 'out')).transition('hp', value);
        this.delegateTicker(() => {
            this.update();
        }, 2500);
    }

    /**
     * 展示开始动画
     */
    async showStart() {
        if (this.status !== HealthBarStatus.Start) return;
        this.delegateTicker(() => {
            this.update();
        }, 2500);
        this.trans
            .time(600)
            .mode(hyper('sin', 'out'))
            .absolute()
            .transition('y', 0);
        this.trans.time(2000).mode(power(3, 'out')).transition('hp', 10000);
        await sleep(1700);
        this.status = HealthBarStatus.Running;
    }

    /**
     * 展示结束动画
     */
    async showEnd() {
        if (this.status !== HealthBarStatus.Running) return;
        this.delegateTicker(() => {
            this.update();
        }, 2500);
        this.trans
            .time(600)
            .mode(hyper('sin', 'in'))
            .absolute()
            .transition('y', -16);
        await sleep(700);
        this.status = HealthBarStatus.End;
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {
        const ctx = canvas.ctx;

        const hp = this.trans.value.hp;
        const ratio = hp / 10000;
        const r = Math.min(255 * 2 - ratio * 2 * 255, 255);
        const g = Math.min(ratio * 2 * 255, 255);

        ctx.save();
        ctx.translate(this.trans.value.x, this.trans.value.y);
        ctx.fillStyle = '#bbb';
        ctx.fillRect(2, 2, 480 - 4, 16 - 4);

        const color = `rgb(${Math.floor(r)},${Math.floor(g)},0)`;
        ctx.fillStyle = color;
        ctx.fillRect(2, 2, (480 - 4) * ratio, 16 - 4);

        ctx.font = '12px "normal"';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(`${Math.floor(hp)} / 10000`, 472, 8);
        ctx.fillText(`${Math.floor(hp)} / 10000`, 472, 8);

        ctx.lineWidth = 4;
        ctx.strokeStyle = '#fff';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#000';
        ctx.strokeRect(0, 0, 480, 16);
        ctx.restore();
    }
}
