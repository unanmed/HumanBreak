import { Ticker } from 'mutate-animate';
import { MotaCanvas2D } from '../fx/canvas2d';
import { EmitableEvent, EventEmitter } from '../common/eventEmitter';
import { debounce } from 'lodash-es';

// 重写样板的勇士绘制

const canvas = MotaCanvas2D.for('@hero', false);

Mota.require('var', 'loading').once('coreInit', () => {
    canvas.withGameScale(true);
    canvas.setHD(false);
    canvas.size(480, 480);
    canvas.pos(0, 0);
    canvas.css(`z-index: 40`);
    canvas.canvas.classList.add('no-anti-aliasing');
    canvas.setTarget(core.dom.gameDraw);
    canvas.mount();
});

const DIR_INDEX: Record<Dir, number> = {
    down: 0,
    left: 1,
    right: 2,
    up: 3
};

interface HeroDrawItem {
    id: AllIds | 'hero';
    image: HTMLCanvasElement;
}

interface HeroDrawing extends HeroDrawItem {
    x: number;
    y: number;
    dir: Dir;
}

interface HeroRendererEvent extends EmitableEvent {
    beforeDraw: () => void;
    afterDraw: () => void;
}

const resetMoving = debounce((render: HeroRenderer) => {
    render.moving = 0;
}, 500);

export class HeroRenderer extends EventEmitter<HeroRendererEvent> {
    followers: HeroDrawItem[] = [];
    hero!: HeroDrawItem;

    /** 移动状态 */
    moving: number = 0;
    /** 移动过程中的偏移 */
    offset: number = 0;
    /** 勇士绘制时的alpha通道 */
    alpha: number = 1;

    ticker: Ticker = new Ticker();

    /** 是否是后退状态 */
    private back: boolean = false;
    /** 是否正在移动 */
    private isMoving: boolean = false;
    /** 上一次换腿（？的时间 */
    private lastMoving: number = 0;

    constructor() {
        super();

        Mota.require('var', 'loading').once('coreInit', () => {
            this.ticker.add(time => {
                if (core.status.heroMoving < 0 || !this.isMoving) return;
                if (time - this.lastMoving > core.values.moveSpeed) {
                    this.lastMoving = time;
                    this.moving++;
                    this.moving %= 4;
                }
                this.draw();
            });
        });
    }

    /**
     * 设置勇士绘制信息
     */
    setHero() {
        const image = core.material.images.hero;
        const canvas = new MotaCanvas2D();
        canvas.setHD(false);
        canvas.size(image.width, image.height);
        canvas.ctx.drawImage(image, 0, 0);
        this.hero = {
            id: 'hero',
            image: canvas.canvas
        };
    }

    /**
     * 执行绘制
     */
    draw() {
        if (!core.isPlaying()) return;
        const { ctx, canvas: can } = canvas;
        const { x, y, direction: dir } = core.status.hero.loc;
        ctx.clearRect(0, 0, can.width, can.height);
        ctx.globalAlpha = this.alpha;

        this.emit('beforeDraw');

        const data: HeroDrawing[] = [];
        data.push({ ...this.hero, x, y, dir });
        core.status.hero.followers.forEach((v, i) => {
            const { id, image } = this.followers[i];
            data.push({ x: v.x, y: v.y, dir: v.direction, id, image });
        });

        const { offsetX: ox, offsetY: oy } = core.bigmap;
        const sgn = this.back ? -1 : 1;
        const offset = this.offset * sgn;

        const frame = this.isMoving ? this.moving % 4 : 0;

        data.forEach(v => {
            // hero offset x
            const hox = offset * core.utils.scan[v.dir].x;
            const hoy = offset * core.utils.scan[v.dir].y;
            const cx = v.x * 32 + 16 - ox + hox;
            const cy = v.y * 32 + 16 - oy + hoy;
            const { width, height } = v.image;
            const pw = width / 4;
            const ph = height / 4;
            const line = DIR_INDEX[v.dir];

            const px = cx - pw / 2;
            const py = cy - ph + 16;

            const sx = frame * pw;
            const sy = line * ph;

            ctx.drawImage(v.image, sx, sy, pw, ph, px, py, pw, ph);
        });

        this.emit('afterDraw');
    }

    /**
     * 设置绘制状态为正在移动还是静止
     */
    move(moving: boolean) {
        this.isMoving = moving;
        if (!moving) {
            resetMoving(this);
        }
    }

    /**
     * 设置当前是否为后退状态
     */
    backward(back: boolean) {
        this.back = back;
    }

    /**
     * 设置绘制时的alpha
     */
    setAlpha(alpha: number) {
        this.alpha = alpha;
    }
}

const render = new HeroRenderer();

export { render as heroRender };
