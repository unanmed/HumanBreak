import { Animation, TimingFn, Transition } from 'mutate-animate';
import { RenderItem } from './item';
import { logger } from '../common/logger';
import { Transform } from './transform';
import EventEmitter from 'eventemitter3';

interface CameraTranslate {
    readonly type: 'translate';
    readonly from: Camera;
    x: number;
    y: number;
}

interface CameraRotate {
    readonly type: 'rotate';
    readonly from: Camera;
    /** 旋转角，单位弧度 */
    angle: number;
}

interface CameraScale {
    readonly type: 'scale';
    readonly from: Camera;
    x: number;
    y: number;
}

type CameraOperation = CameraTranslate | CameraScale | CameraRotate;

interface CameraEvent {
    destroy: [];
}

export class Camera extends EventEmitter<CameraEvent> {
    /** 当前绑定的渲染元素 */
    readonly binded: RenderItem;
    /** 目标变换矩阵，默认与 `this.binded.transform` 同引用 */
    transform: Transform;

    /** 委托ticker的id */
    private delegation: number;
    /** 所有的动画id */
    private animationIds: Set<number> = new Set();

    /** 是否需要更新视角 */
    private needUpdate: boolean = false;

    /** 变换操作列表，因为矩阵乘法跟顺序有关，因此需要把各个操作拆分成列表进行 */
    protected operation: CameraOperation[] = [];

    /** 渲染元素到摄像机的映射 */
    private static cameraMap: Map<RenderItem, Camera> = new Map();

    /**
     * 获取一个渲染元素的摄像机，如果不存在则为它创建一个并返回。注意使用`new Camera`创建的摄像机不在此列
     * @param item 渲染元素
     */
    static for(item: RenderItem) {
        const camera = this.cameraMap.get(item);
        if (!camera) {
            const ca = new Camera(item);
            this.cameraMap.set(item, ca);
            return ca;
        } else {
            return camera;
        }
    }

    constructor(item: RenderItem) {
        super();

        this.binded = item;

        this.delegation = item.delegateTicker(() => this.tick());
        this.transform = item.transform;

        item.on('destroy', () => {
            this.destroy();
        });

        if (Camera.cameraMap.has(item)) {
            logger.warn(22);
        }
    }

    private tick = () => {
        if (!this.needUpdate) return;
        const trans = this.transform;
        trans.reset();
        for (const o of this.operation) {
            if (o.type === 'translate') {
                trans.translate(o.x, o.y);
            } else if (o.type === 'rotate') {
                trans.rotate(o.angle);
            } else {
                trans.scale(o.x, o.y);
            }
        }
        this.binded.update(this.binded);
        this.needUpdate = false;
    };

    /**
     * 在下一帧进行强制更新
     */
    requestUpdate() {
        this.needUpdate = true;
    }

    /**
     * 移除一个变换操作
     * @param operation 要移除的操作
     */
    removeOperation(operation: CameraOperation) {
        const index = this.operation.indexOf(operation);
        if (index === -1) return;
        this.operation.splice(index, 1);
    }

    /**
     * 清空变换操作列表
     */
    clearOperation() {
        this.operation.splice(0);
    }

    /**
     * 添加一个平移操作
     * @returns 添加的平移变换操作
     */
    addTranslate(): CameraTranslate {
        const item: CameraTranslate = {
            type: 'translate',
            x: 0,
            y: 0,
            from: this
        };
        this.operation.push(item);
        return item;
    }

    /**
     * 添加一个旋转操作
     * @returns 添加的旋转变换操作
     */
    addRotate(): CameraRotate {
        const item: CameraRotate = {
            type: 'rotate',
            angle: 0,
            from: this
        };
        this.operation.push(item);
        return item;
    }

    /**
     * 添加一个放缩操作
     * @returns 添加的放缩变换操作
     */
    addScale(): CameraScale {
        const item: CameraScale = {
            type: 'scale',
            x: 0,
            y: 0,
            from: this
        };
        this.operation.push(item);
        return item;
    }

    /**
     * 施加动画
     * @param time 动画时长
     * @param update 每帧的更新函数
     */
    applyAnimation(time: number, update: () => void) {
        const delegation = this.binded.delegateTicker(
            () => {
                update();
                this.needUpdate = true;
            },
            time,
            () => {
                update();
                this.needUpdate = true;
                this.animationIds.delete(delegation);
            }
        );
        this.animationIds.add(delegation);
    }

    /**
     * 为一个平移操作实施动画
     * @param operation 平移操作
     * @param animate 动画实例
     * @param time 动画时长
     */
    applyTranslateAnimation(
        operation: CameraTranslate,
        animate: Animation,
        time: number
    ) {
        if (operation.from !== this) {
            logger.warn(20);
            return;
        }

        const update = () => {
            operation.x = animate.x;
            operation.y = animate.y;
        };

        this.applyAnimation(time, update);
    }

    /**
     * 为一个旋转操作实施动画
     * @param operation 旋转操作
     * @param animate 动画实例
     * @param time 动画时长
     */
    applyRotateAnimation(
        operation: CameraRotate,
        animate: Animation,
        time: number
    ) {
        if (operation.from !== this) {
            logger.warn(20);
            return;
        }

        const update = () => {
            operation.angle = animate.angle;
        };

        this.applyAnimation(time, update);
    }

    /**
     * 为一个缩放操作实施动画
     * @param operation 缩放操作
     * @param animate 动画实例
     * @param time 动画时长
     */
    applyScaleAnimation(
        operation: CameraScale,
        animate: Animation,
        time: number
    ) {
        if (operation.from !== this) {
            logger.warn(20);
            return;
        }

        const update = () => {
            operation.x = animate.size;
            operation.y = animate.size;
        };

        this.applyAnimation(time, update);
    }

    /**
     * 为一个平移操作实施渐变，使用渐变的 x,y 值，即`transition.value.x`与`transition.value.y`
     * @param operation 平移操作
     * @param animate 渐变实例
     * @param time 渐变时长
     */
    applyTranslateTransition(
        operation: CameraTranslate,
        animate: Transition,
        time: number
    ) {
        if (operation.from !== this) {
            logger.warn(21);
            return;
        }

        const update = () => {
            operation.x = animate.value.x;
            operation.y = animate.value.y;
        };

        this.applyAnimation(time, update);
    }

    /**
     * 为一个旋转操作实施渐变，使用渐变的 angle 值，即`transition.value.angle`
     * @param operation 旋转操作
     * @param animate 渐变实例
     * @param time 渐变时长
     */
    applyRotateTransition(
        operation: CameraRotate,
        animate: Transition,
        time: number
    ) {
        if (operation.from !== this) {
            logger.warn(21);
            return;
        }

        const update = () => {
            operation.angle = animate.value.angle;
        };

        this.applyAnimation(time, update);
    }

    /**
     * 为一个缩放操作实施渐变，使用渐变的 size 值，即`transition.value.size`
     * @param operation 缩放操作
     * @param animate 渐变实例
     * @param time 渐变时长
     */
    applyScaleTransition(
        operation: CameraScale,
        animate: Transition,
        time: number
    ) {
        if (operation.from !== this) {
            logger.warn(21);
            return;
        }

        const update = () => {
            operation.x = animate.value.size;
            operation.y = animate.value.size;
        };

        this.applyAnimation(time, update);
    }

    /**
     * 停止所有动画
     */
    stopAllAnimates() {
        this.animationIds.forEach(v => this.binded.removeTicker(v));
    }

    /**
     * 摧毁这个摄像机，当绑定元素被摧毁之后摄像机会一并摧毁，如果这个摄像机不使用了，一定要将它摧毁
     */
    destroy() {
        this.binded.removeTicker(this.delegation);
        this.animationIds.forEach(v => this.binded.removeTicker(v));
        Camera.cameraMap.delete(this.binded);
        this.emit('destroy');
    }
}

interface CameraAnimationBase {
    type: string;
    time: number;
    start: number;
}

interface TranslateAnimation extends CameraAnimationBase {
    type: 'translate';
    timing: TimingFn;
    x: number;
    y: number;
}

interface TranslateAsAnimation extends CameraAnimationBase {
    type: 'translateAs';
    timing: TimingFn<2>;
    time: number;
}

interface RotateAnimation extends CameraAnimationBase {
    type: 'rotate';
    timing: TimingFn;
    angle: number;
    time: number;
}

interface ScaleAnimation extends CameraAnimationBase {
    type: 'scale';
    timing: TimingFn;
    scale: number;
    time: number;
}

type CameraAnimationData =
    | TranslateAnimation
    | TranslateAsAnimation
    | RotateAnimation
    | ScaleAnimation;

interface CameraAnimationExecution {
    data: CameraAnimationData[];
    animation: Animation;
}

interface CameraAnimationEvent {
    animate: [
        operation: CameraOperation,
        execution: CameraAnimationExecution,
        item: CameraAnimationData
    ];
}

export class CameraAnimation extends EventEmitter<CameraAnimationEvent> {
    camera: Camera;

    /** 动画开始时刻 */
    private startTime: number = 0;
    /** 动画结束时刻 */
    private endTime: number = 0;
    /** 委托ticker的id */
    private delegation: number;
    /** 动画是否开始 */
    private started: boolean = false;

    /** 每个摄像机操作的动画映射 */
    private animateMap: Map<CameraOperation, CameraAnimationExecution> =
        new Map();

    constructor(camera: Camera) {
        super();

        this.camera = camera;
        this.delegation = camera.binded.delegateTicker(this.tick);
    }

    private tick = () => {
        if (!this.started) return;
        const now = Date.now();
        const time = now - this.startTime;
        if (now - this.startTime > this.endTime + 50) {
            this.destroy();
            return;
        }
        this.animateMap.forEach((exe, ope) => {
            const data = exe.data;
            if (data.length === 0) return;
            const item = data[0];
            if (item.time < time) {
                this.executeAnimate(exe, item);
                data.shift();
                this.emit('animate', ope, exe, item);
            }
        });
    };

    private executeAnimate(
        execution: CameraAnimationExecution,
        animate: CameraAnimationData
    ) {
        if (animate.type === 'translateAs') {
            const ani = this.ensureAnimate(execution);
            ani.time(animate.time).moveAs(animate.timing);
        } else if (animate.type === 'translate') {
            const ani = this.ensureAnimate(execution);
            const { x, y, time, timing } = animate;
            ani.mode(timing).time(time).move(x, y);
        } else if (animate.type === 'rotate') {
            const ani = this.ensureAnimate(execution);
            const { angle, time, timing } = animate;
            ani.mode(timing).time(time).rotate(angle);
        } else {
            const ani = this.ensureAnimate(execution);
            const { scale, time, timing } = animate;
            ani.mode(timing).time(time).scale(scale);
        }
    }

    private ensureAnimate(execution: CameraAnimationExecution) {
        if (execution.animation) return execution.animation;
        const ani = new Animation();
        execution.animation = ani;
        return ani;
    }

    private ensureOperation(operation: CameraOperation) {
        if (!this.animateMap.has(operation)) {
            const data: CameraAnimationExecution = {
                data: [],
                animation: new Animation()
            };
            this.animateMap.set(operation, data);
            return data;
        } else {
            return this.animateMap.get(operation)!;
        }
    }

    /**
     * 添加一个平移动画
     * @param operation 摄像机操作对象
     * @param x 目标横坐标
     * @param y 目标纵坐标
     * @param time 动画时长
     * @param start 动画开始时间
     * @param timing 动画的缓动函数
     */
    translate(
        operation: CameraTranslate,
        x: number,
        y: number,
        time: number,
        start: number,
        timing: TimingFn
    ) {
        const exe = this.ensureOperation(operation);
        const data: TranslateAnimation = {
            type: 'translate',
            timing,
            x,
            y,
            time,
            start
        };
        exe.data.push(data);
    }

    /**
     * 添加一个旋转动画
     * @param operation 摄像机操作
     * @param angle 目标旋转弧度，单位弧度
     * @param time 动画时长
     * @param start 动画开始时间
     * @param timing 动画的缓动函数
     */
    rotate(
        operation: CameraRotate,
        angle: number,
        time: number,
        start: number,
        timing: TimingFn
    ) {
        const exe = this.ensureOperation(operation);
        const data: RotateAnimation = {
            type: 'rotate',
            timing,
            angle,
            time,
            start
        };
        exe.data.push(data);
    }

    /**
     * 添加一个缩放动画
     * @param operation 摄像机操作
     * @param scale 目标缩放倍率
     * @param time 动画时长
     * @param start 动画开始时间
     * @param timing 动画的缓动函数
     */
    scale(
        operation: CameraScale,
        scale: number,
        time: number,
        start: number,
        timing: TimingFn
    ) {
        const exe = this.ensureOperation(operation);
        const data: ScaleAnimation = {
            type: 'scale',
            timing,
            scale,
            time,
            start
        };
        exe.data.push(data);
    }

    /**
     * 开始执行这个动画
     */
    start() {
        if (this.started) return;
        this.startTime = Date.now();
        this.started = true;
        let endTime = 0;
        this.animateMap.forEach((exe, ope) => {
            const data = exe.data;
            data.sort((a, b) => a.start - b.start);
            const end = data.at(-1);
            if (!end) return;
            const t = end.start + end.time;
            if (t > endTime) endTime = t;

            if (ope.type === 'translate') {
                this.camera.applyTranslateAnimation(ope, exe.animation, t + 50);
            } else if (ope.type === 'rotate') {
                this.camera.applyRotateAnimation(ope, exe.animation, t + 50);
            } else {
                this.camera.applyScaleAnimation(ope, exe.animation, t + 50);
            }
        });
        this.endTime = endTime + this.startTime;
    }

    destroy() {
        this.camera.binded.removeTicker(this.delegation);
        this.camera.stopAllAnimates();
    }
}
