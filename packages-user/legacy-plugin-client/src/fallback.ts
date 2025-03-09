import {
    wrapInstancedComponent,
    MotaOffscreenCanvas2D,
    RenderItem,
    RenderItemPosition,
    Transform
} from '@motajs/render';

// 渲染端的向后兼容用，会充当两个版本间过渡的作用
class Change extends RenderItem {
    private tips: string[] = [];
    /** 当前小贴士 */
    private usingTip: string = '';
    /** 透明度 */
    private backAlpha: number = 0;
    private title: string = '';

    constructor(type: RenderItemPosition) {
        super(type, false);
    }

    /**
     * 设置楼传过程中的小贴士
     */
    setTips(tip: string[]) {
        this.tips = tip;
    }

    /**
     * 设置标题
     */
    setTitle(title: string) {
        this.title = title;
    }

    /**
     * 显示楼层切换的从透明变黑的动画
     * @param time 动画时长
     */
    showChange(time: number) {
        const length = this.tips.length;
        const tip = this.tips[Math.floor(Math.random() * length)] ?? '';
        this.usingTip = tip;

        return new Promise<void>(res => {
            const start = Date.now();
            const id = this.delegateTicker(
                () => {
                    const dt = Date.now() - start;
                    const progress = dt / time;
                    if (progress > 1) {
                        this.backAlpha = 1;
                        this.removeTicker(id);
                    } else {
                        this.backAlpha = progress;
                    }
                    this.update();
                },
                10000,
                res
            );
        });
    }

    /**
     * 显示楼层切换从黑到透明的动画
     * @param time 动画时长
     */
    async hideChange(time: number) {
        return new Promise<void>(res => {
            const start = Date.now();
            const id = this.delegateTicker(
                () => {
                    const dt = Date.now() - start;
                    const progress = dt / time;
                    if (progress > 1) {
                        this.removeTicker(id);
                        this.backAlpha = 0;
                    } else {
                        this.backAlpha = 1 - progress;
                    }
                    this.update();
                },
                10000,
                res
            );
        });
    }

    protected render(
        canvas: MotaOffscreenCanvas2D,
        _transform: Transform
    ): void {
        if (this.backAlpha === 0) return;
        const ctx = canvas.ctx;
        ctx.globalAlpha = this.backAlpha;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = '32px "normal"';
        ctx.fillText(this.title, canvas.width / 2, canvas.height * 0.4);
        ctx.font = '16px "normal"';
        if (this.usingTip.length > 0) {
            ctx.fillText(
                '小贴士:' + this.usingTip,
                canvas.width / 2,
                canvas.height * 0.75
            );
        }
    }
}

export const FloorChange = wrapInstancedComponent(() => new Change('static'));
