import { Shader } from '@/core/render/shader';
import { PointEffect } from '../fx/pointShader';
import { BarrageBoss } from './barrage';
import { MotaRenderer } from '@/core/render/render';
import { LayerGroup } from '@/core/render/preset/layer';
import { RenderItem } from '@/core/render/item';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { Transform } from '@/core/render/transform';
import { Animation, hyper, power, sleep, Transition } from 'mutate-animate';

const enum TowerBossStage {
    /** 开场白阶段 */
    Prologue,

    Stage1,
    Dialogue1,
    Stage2,
    Dialogue2,
    Stage3,
    Dialogue3,
    Stage4,

    End
}

const enum HealthBarStatus {
    Start,
    Running,
    End
}

Mota.require('var', 'loading').once('coreInit', () => {
    const shader = new Shader();
    shader.size(480, 480);
    shader.setHD(true);
    TowerBoss.shader = shader;
    TowerBoss.effect.create(shader, 40);
});

class TowerBoss extends BarrageBoss {
    static effect: PointEffect = new PointEffect();
    static shader: Shader;

    /** boss战阶段 */
    stage: TowerBossStage = TowerBossStage.Prologue;

    private hp: number = 10000;

    /** 血条显示元素 */
    private healthBar: HealthBar;
    /** 对话文字显示元素 */
    private word: Word;
    /** 楼层渲染元素 */
    private group: LayerGroup;

    constructor() {
        super();

        this.healthBar = new HealthBar('absolute');
        this.word = new Word('absolute');
        const render = MotaRenderer.get('render-main')!;
        this.group = render.getElementById('layer-main') as LayerGroup;

        this.healthBar.init();
        this.word.init();
    }

    ai(time: number, frame: number): void {}
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
    /** 是否已经显示完毕 */
    private showEnd: boolean = true;
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
        this.showEnd = false;
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
    private ani: Animation = new Animation();
    /** 当前血条状态 */
    private status: HealthBarStatus = HealthBarStatus.Start;

    /**
     * 初始化
     */
    init() {
        this.trans.time(600).absolute().mode(power(4, 'out'));
        this.trans.value.hp = 0;
        this.ani.register('opacity', 0);
        this.ani.time(0).move(0, -24);

        this.size(480, 24);
        this.setHD(true);
        this.setZIndex(100);
    }

    /**
     * 设置剩余血量
     */
    set(value: number) {
        this.trans.transition('hp', value);
    }

    /**
     * 展示开始动画
     */
    async showStart() {
        if (this.status !== HealthBarStatus.Start) return;
        this.delegateTicker(() => {
            this.pos(this.ani.x, this.ani.y);
        }, 1000);
        this.ani.time(600).mode(hyper('sin', 'out')).absolute().move(0, 0);
        await sleep(300);
        this.trans.transition('hp', 10000);
        await sleep(700);
        this.status = HealthBarStatus.Running;
    }

    /**
     * 展示结束动画
     */
    async showEnd() {
        if (this.status !== HealthBarStatus.Running) return;
        this.delegateTicker(() => {
            this.pos(this.ani.x, this.ani.y);
        }, 700);
        this.ani.time(600).mode(hyper('sin', 'in')).absolute().move(0, -24);
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

        const color = `rgb(${Math.floor(r)},${Math.floor(g)},0)`;
        ctx.globalAlpha = this.ani.value.opacity;
        ctx.fillStyle = color;
        ctx.fillRect(2, 2, 480 - 4, 24 - 4);

        ctx.lineWidth = 4;
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(0, 0, 480, 24);

        ctx.font = '16px "normal';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        ctx.fillText(`${hp} / 10000`, 472, 12);
    }
}
