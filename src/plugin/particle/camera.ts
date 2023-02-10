import { Matrix4 } from '../webgl/martrix';
import { Renderer } from './render';

type Position3D = [number, number, number];

export class Camera {
    /** 视图矩阵 */
    matrix!: Matrix4;
    /** 绑定的渲染器 */
    renderer?: Renderer;

    constructor() {
        this.reset();
    }

    reset() {
        this.matrix = new Matrix4();
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
        this.matrix = this.calLookAt(eye, at, up);
    }

    /**
     * 变换摄像机的观察方位
     * @param eye 视点位置
     * @param at 目标点位置
     * @param up 上方向
     */
    transform(eye: Position3D, at: Position3D, up: Position3D) {
        this.matrix.multipy(this.calLookAt(eye, at, up));
    }

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
        matrix[4] = [0, 0, 0, 1];

        matrix.translate(-eyeX, -eyeY, -eyeZ);
        return matrix;
    }
}
