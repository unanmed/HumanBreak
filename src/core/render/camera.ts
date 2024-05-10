import { ReadonlyMat3, ReadonlyVec3, mat3, vec2, vec3 } from 'gl-matrix';
import { EmitableEvent, EventEmitter } from '../common/eventEmitter';

interface CameraEvent extends EmitableEvent {}

export class Camera extends EventEmitter<CameraEvent> {
    mat: mat3 = mat3.create();

    x: number = 0;
    y: number = 0;
    scaleX: number = 1;
    scaleY: number = 1;
    rad: number = 0;

    /**
     * 重设摄像机的所有参数
     */
    reset() {
        mat3.identity(this.mat);
        this.x = 0;
        this.y = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.rad = 0;
    }

    /**
     * 修改摄像机的缩放，叠加关系
     */
    scale(x: number, y: number = x) {
        mat3.scale(this.mat, this.mat, [x, y]);
        this.scaleX *= x;
        this.scaleY *= y;
    }

    /**
     * 移动摄像机，叠加关系
     */
    move(x: number, y: number) {
        mat3.translate(this.mat, this.mat, [-x, -y]);
        this.x += x;
        this.y += y;
    }

    /**
     * 旋转摄像机，叠加关系
     */
    rotate(rad: number) {
        mat3.rotate(this.mat, this.mat, rad);
        this.rad += rad;
        if (this.rad >= Math.PI * 2) {
            const n = Math.floor(this.rad / Math.PI / 2);
            this.rad -= n * Math.PI * 2;
        }
    }

    /**
     * 设置摄像机的缩放，非叠加关系
     */
    setScale(x: number, y: number = x) {
        mat3.scale(this.mat, this.mat, [x / this.scaleX, y / this.scaleY]);
        this.scaleX = x;
        this.scaleY = y;
    }

    /**
     * 设置摄像机的位置，非叠加关系
     */
    setTranslate(x: number, y: number) {
        mat3.translate(this.mat, this.mat, [this.x - x, this.y - y]);
        this.x = x;
        this.y = y;
    }

    /**
     * 设置摄像机的旋转，非叠加关系
     */
    setRotate(rad: number) {
        mat3.rotate(this.mat, this.mat, rad - this.rad);
        this.rad = rad;
    }

    /**
     * 设置摄像机的变换矩阵，叠加模式
     * @param a 水平缩放
     * @param b 垂直倾斜
     * @param c 水平倾斜
     * @param d 垂直缩放
     * @param e 水平移动
     * @param f 垂直移动
     */
    transform(
        a: number,
        b: number,
        c: number,
        d: number,
        e: number,
        f: number
    ) {
        mat3.multiply(
            this.mat,
            this.mat,
            mat3.fromValues(a, b, 0, c, d, 0, e, f, 1)
        );
        this.calAttributes();
    }

    /**
     * 设置摄像机的变换矩阵，非叠加模式
     * @param a 水平缩放
     * @param b 垂直倾斜
     * @param c 水平倾斜
     * @param d 垂直缩放
     * @param e 水平移动
     * @param f 垂直移动
     */
    setTransform(
        a: number,
        b: number,
        c: number,
        d: number,
        e: number,
        f: number
    ) {
        mat3.set(this.mat, a, b, 0, c, d, 0, e, f, 1);
        this.calAttributes();
    }

    /**
     * 重新计算 translation scaling rotation
     */
    calAttributes() {
        const [x, y] = getTranslation(this.mat);
        const [scaleX, scaleY] = getScaling(this.mat);
        const rad = getRotation(this.mat);
        this.x = x;
        this.y = y;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.rad = rad;
    }

    /**
     * 根据摄像机的信息，将一个点转换为计算后的位置
     * @param camera 摄像机
     * @param x 横坐标
     * @param y 纵坐标
     */
    static transformed(camera: Camera, x: number, y: number) {
        return multiplyVec3(camera.mat, [x, y, 1]);
    }

    /**
     * 根据摄像机的信息，将一个计算后的位置逆转换为原位置
     * @param camera 摄像机
     * @param x 横坐标
     * @param y 纵坐标
     */
    static untransformed(camera: Camera, x: number, y: number) {
        const invert = mat3.create();
        mat3.invert(invert, camera.mat);
        return multiplyVec3(invert, [x, y, 1]);
    }
}

function multiplyVec3(mat: ReadonlyMat3, vec: ReadonlyVec3) {
    return vec3.fromValues(
        mat[0] * vec[0] + mat[3] * vec[1] + mat[6] * vec[2],
        mat[1] * vec[0] + mat[4] * vec[1] + mat[7] * vec[2],
        mat[2] * vec[0] + mat[5] * vec[1] + mat[8] * vec[2]
    );
}

function getTranslation(mat: ReadonlyMat3): vec2 {
    return [mat[6], mat[7]];
}

function getScaling(mat: ReadonlyMat3): vec2 {
    return [Math.hypot(mat[0], mat[3]), Math.hypot(mat[1], mat[4])];
}

function getRotation(mat: ReadonlyMat3): number {
    return Math.atan2(mat[3], mat[0]);
}
