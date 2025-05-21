import { IStateDamageable } from '@user/data-state';
import { BarrageBoss, BossSprite, Hitbox } from './barrage';
import {
    Container,
    LayerGroup,
    MotaRenderer,
    RenderItem,
    Shader,
    Transform,
    MotaOffscreenCanvas2D
} from '@motajs/render';
import { Pop } from '../../../client-modules/src/render/legacy/pop';
import { SplittableBall } from './palaceBossProjectile';
import { PointEffect } from '../fx/pointShader';
import { loading } from '@user/data-base';
import { clip } from '@user/legacy-plugin-data';

loading.once('coreInit', () => {
    const shader = new Shader();
    shader.size(480, 480);
    shader.setHD(true);
    shader.setZIndex(120);
    PalaceBoss.shader = shader;
    PalaceBoss.effect.create(shader, 40);
});

const enum BossStage {
    Prologue,

    Stage1,
    Stage2,
    Stage3,
    Stage4,

    End
}

export class PalaceBoss extends BarrageBoss {
    static effect: PointEffect = new PointEffect();
    static shader: Shader;

    main: BossSprite<BarrageBoss>;
    hitbox: Hitbox.Circle;
    state: IStateDamageable;

    private stage: BossStage = BossStage.Prologue;

    /** 用于展示傅里叶频谱的背景元素 */
    private back: SonicBack;
    /** 楼层渲染元素 */
    private group: LayerGroup;
    /** 楼层渲染容器 */
    private mapDraw: Container;
    /** 伤害弹出 */
    pop: Pop;

    private heroHp: number = 0;

    constructor() {
        super();

        const render = MotaRenderer.get('render-main')!;
        this.group = render.getElementById('layer-main') as LayerGroup;
        this.mapDraw = render.getElementById('map-draw') as Container;
        this.pop = render.getElementById('pop-main') as Pop;

        this.state = core.status.hero;
        this.main = new BossEffect('static', this);
        this.back = new SonicBack('static');
        const { x, y } = core.status.hero.loc;
        const cell = 32;
        this.hitbox = new Hitbox.Circle(x + cell / 2, y + cell / 2, cell / 3);
    }

    override start(): void {
        super.start();

        PalaceBoss.shader.appendTo(this.mapDraw);
        this.main.appendTo(this.group);

        // const event = this.group.getLayer('event');
        // const hero = event?.getExtends('floor-hero') as HeroRenderer;
        // hero?.on('moveTick', this.moveTick);

        SplittableBall.init({});
        this.heroHp = core.status.hero.hp;
    }

    override end(): void {
        super.end();

        PalaceBoss.shader.remove();
        this.main.remove();
        this.back.remove();
        this.main.destroy();
        this.back.destroy();

        // const event = this.group.getLayer('event');
        // const hero = event?.getExtends('floor-hero') as HeroRenderer;
        // hero?.off('moveTick', this.moveTick);

        SplittableBall.end();

        PalaceBoss.effect.end();
        core.status.hero.hp = this.heroHp;

        clip('choices:0');
    }

    ai(time: number, frame: number): void {}
}

class BossEffect extends BossSprite<PalaceBoss> {
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

class SonicBack extends RenderItem {
    protected render(
        canvas: MotaOffscreenCanvas2D,
        transform: Transform
    ): void {}
}
