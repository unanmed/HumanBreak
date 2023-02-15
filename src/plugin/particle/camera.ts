import { TimingFn } from 'mutate-animate';
import { Matrix4 } from '../webgl/matrix';
import { Renderer } from './render';

export type Position3D = [number, number, number];

type OneParameterAnimationType = 'x' | 'y' | 'z';
type TwoParameterAnimationType = 'xy' | 'yx' | 'xz' | 'zx' | 'yz' | 'zy';
type ThreeParameterAnimationType =
    | 'xyz'
    | 'xzy'
    | 'yxz'
    | 'yzx'
    | 'zxy'
    | 'zyx';
type CameraAnimationTarget = 'eye' | 'at' | 'up';

interface CameraAnimationType {
    1: OneParameterAnimationType;
    2: TwoParameterAnimationType;
    3: ThreeParameterAnimationType;
}

export class Camera {
    /** 视图矩阵 */
    view!: Matrix4;
    /** 投影矩阵 */
    projection!: Matrix4;
    /** 绑定的渲染器 */
    renderer?: Renderer;

    constructor() {
        this.reset();
    }

    /**
     * 初始化视角矩阵
     */
    reset() {
        this.view = new Matrix4();
        this.projection = new Matrix4();
    }

    /**
     * 将该摄像机与一个渲染器绑定
     * @param renderer 渲染器
     */
    bind(renderer: Renderer) {
        this.renderer = renderer;
    }

    /**
     * 取消与渲染器的绑定
     */
    unbind() {
        this.renderer = void 0;
    }

    /**
     * 设置摄像机的观察方位
     * @param eye 视点位置
     * @param at 目标点位置
     * @param up 上方向
     */
    lookAt(eye: Position3D, at: Position3D, up: Position3D) {
        this.view = this.calLookAt(eye, at, up);
    }

    /**
     * 变换摄像机的观察方位
     * @param eye 视点位置
     * @param at 目标点位置
     * @param up 上方向
     */
    transform(eye: Position3D, at: Position3D, up: Position3D) {
        this.view.multipy(this.calLookAt(eye, at, up));
    }

    /**
     * 设置透视投影矩阵
     * @param fov 垂直视角，即摄像机视锥体的上下平面夹角，单位角度
     * @param aspect 近裁剪面的长宽比，即视野的长宽比
     * @param near 近裁剪面的距离，即最近能看多远
     * @param far 远裁剪面的距离，即最远能看多远
     */
    setPerspective(fov: number, aspect: number, near: number, far: number) {
        this.projection = this.calPerspective(fov, aspect, near, far);
    }

    /**
     * 设置正交投影矩阵
     * @param left 可视空间的左边界
     * @param right 可视空间的右边界
     * @param bottom 可视空间的下边界
     * @param top 可视空间的上边界
     * @param near 近裁剪面的距离，即最近能看多远
     * @param far 远裁剪面的距离，即最远能看多远
     */
    setOrthogonal(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number
    ) {
        this.projection = this.calOrthogonal(
            left,
            right,
            bottom,
            top,
            near,
            far
        );
    }

    /**
     * 更新视角
     */
    update() {
        this.renderer?.render();
    }

    applyAnimate<N extends keyof CameraAnimationType = 1>(
        target: CameraAnimationTarget,
        type: CameraAnimationType[N],
        time: number = 1000,
        timing?: TimingFn<N>,
        relative: boolean = false
    ) {}

    /**
     * 计算摄像机变换矩阵
     * @see https://github.com/bad4iz/cuon-matrix/blob/main/src/Matrix4/Matrix4.ts
     * @param eye 视点位置
     * @param at 目标点位置
     * @param up 上方向
     * @returns 转换矩阵
     */
    private calLookAt(eye: Position3D, at: Position3D, up: Position3D) {
        const [eyeX, eyeY, eyeZ] = eye;
        const [centerX, centerY, centerZ] = at;
        const [upX, upY, upZ] = up;

        let fx = centerX - eyeX;
        let fy = centerY - eyeY;
        let fz = centerZ - eyeZ;

        const rlf = 1 / Math.sqrt(fx * fx + fy * fy + fz * fz);
        fx *= rlf;
        fy *= rlf;
        fz *= rlf;

        let sx = fy * upZ - fz * upY;
        let sy = fz * upX - fx * upZ;
        let sz = fx * upY - fy * upX;

        const rls = 1 / Math.sqrt(sx * sx + sy * sy + sz * sz);
        sx *= rls;
        sy *= rls;
        sz *= rls;

        const ux = sy * fz - sz * fy;
        const uy = sz * fx - sx * fz;
        const uz = sx * fy - sy * fx;

        const matrix = new Matrix4();

        matrix[0] = [sx, sy, sz, 0];
        matrix[1] = [ux, uy, uz, 0];
        matrix[2] = [-fx, -fy, -fz, 0];
        matrix[3] = [0, 0, 0, 1];

        matrix.translate(-eyeX, -eyeY, -eyeZ);
        return matrix;
    }

    /**
     * 计算透视矩阵
     * @see https://github.com/bad4iz/cuon-matrix/blob/main/src/Matrix4/Matrix4.ts
     * @param fovy 垂直视角，即摄像机视锥体的上下平面夹角
     * @param aspect 近裁剪面的长宽比，即视野的长宽比
     * @param near 近裁剪面的距离，即最近能看多远
     * @param far 远裁剪面的距离，即最远能看多远
     */
    private calPerspective(
        fov: number,
        aspect: number,
        near: number,
        far: number
    ) {
        if (near === far || aspect === 0) {
            throw new Error(
                `No sence can be set, because near === far or aspect === 0.`
            );
        }
        if (near <= 0 || far <= 0) {
            throw new Error(`near and far must be positive.`);
        }

        fov = (Math.PI * fov) / 180 / 2;
        const s = Math.sin(fov);
        if (s === 0) {
            throw new Error(
                `Cannot set perspectivity, because sin(fov) === 0.`
            );
        }

        const rd = 1 / (far - near);
        const ct = Math.cos(fov) / s;

        const matrix = new Matrix4();

        matrix[0] = [ct / aspect, 0, 0, 0];
        matrix[1] = [0, ct, 0, 0];
        matrix[2] = [0, 0, -(far + near) * rd, -2 * near * far * rd];
        matrix[3] = [0, 0, -1, 0];

        return matrix;
    }

    /**
     * 设置正交投影矩阵
     * @param left 可视空间的左边界
     * @param right 可视空间的右边界
     * @param bottom 可视空间的下边界
     * @param top 可视空间的上边界
     * @param near 近裁剪面的距离，即最近能看多远
     * @param far 远裁剪面的距离，即最远能看多远
     */
    private calOrthogonal(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number
    ) {
        if (left === right || bottom === top || near === far) {
            throw new Error(
                `Cannot set Orthogonality, because left === right or top === bottom or near === far.`
            );
        }

        const rw = 1 / (right - left);
        const rh = 1 / (top - bottom);
        const rd = 1 / (far - near);

        const matrix = new Matrix4();

        matrix[0] = [2 * rw, 0, 0, -(right + left) * rw];
        matrix[1] = [0, 2 * rh, 0, -(top + bottom) * rh];
        matrix[2] = [0, 0, -2 * rd, -(far + near) * rd];
        matrix[3] = [0, 0, 0, 1];

        return matrix;
    }
}
