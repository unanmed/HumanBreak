import { Animation, Transition } from 'mutate-animate';
import { RenderItem } from './item';
import { logger } from '../common/logger';
import { Transform } from './transform';

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

export class Camera {
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
     * 摧毁这个摄像机，当绑定元素被摧毁之后摄像机会一并摧毁，如果这个摄像机不使用了，一定要将它摧毁
     */
    destroy() {
        this.binded.removeTicker(this.delegation);
        this.animationIds.forEach(v => this.binded.removeTicker(v));
        Camera.cameraMap.delete(this.binded);
    }
}
