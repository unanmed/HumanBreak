import { mat3, mat4, ReadonlyMat3, ReadonlyVec3, vec2, vec3 } from 'gl-matrix';

export interface ITransformUpdatable<T> {
    /**
     * 当变换矩阵更新时触发
     * @param transform 触发更新的变换矩阵
     */
    updateTransform(transform: T): void;
}

export class Transform {
    mat: mat3 = mat3.create();

    x: number = 0;
    y: number = 0;
    scaleX: number = 1;
    scaleY: number = 1;
    rad: number = 0;

    /** 有没有对这个Transform进行过修改，用于优化常规表现 */
    private modified: boolean = false;

    /** 绑定的可更新元素 */
    bindedObject: Set<ITransformUpdatable<Transform>> = new Set();

    /**
     * 对这个变换实例添加绑定对象，当矩阵变换时，自动调用其 update 函数
     * @param obj 要绑定的对象
     */
    bind(obj: ITransformUpdatable<Transform>) {
        this.bindedObject.add(obj);
    }

    /**
     * 取消对象的绑定
     * @param obj 要取消绑定的对象
     */
    unbind(obj: ITransformUpdatable<Transform>) {
        this.bindedObject.delete(obj);
    }

    private emitUpdate() {
        this.bindedObject.forEach(v => v.updateTransform(this));
    }

    /**
     * 重设所有参数
     */
    reset() {
        mat3.identity(this.mat);
        this.x = 0;
        this.y = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.rad = 0;
        this.modified = false;
        this.emitUpdate();
    }

    /**
     * 修改缩放，叠加关系
     */
    scale(x: number, y: number = x): this {
        mat3.scale(this.mat, this.mat, [x, y]);
        this.scaleX *= x;
        this.scaleY *= y;
        this.modified = true;
        this.emitUpdate();
        return this;
    }

    /**
     * 移动，叠加关系
     */
    translate(x: number, y: number): this {
        mat3.translate(this.mat, this.mat, [x, y]);
        this.x += x;
        this.y += y;
        this.modified = true;
        this.emitUpdate();
        return this;
    }

    /**
     * 旋转，叠加关系
     */
    rotate(rad: number): this {
        mat3.rotate(this.mat, this.mat, rad);
        this.rad += rad;
        if (this.rad >= Math.PI * 2) {
            const n = Math.floor(this.rad / Math.PI / 2);
            this.rad -= n * Math.PI * 2;
        }
        this.modified = true;
        this.emitUpdate();
        return this;
    }

    /**
     * 设置缩放，非叠加关系
     */
    setScale(x: number, y: number = x): this {
        mat3.scale(this.mat, this.mat, [x / this.scaleX, y / this.scaleY]);
        this.scaleX = x;
        this.scaleY = y;
        this.modified = true;
        this.emitUpdate();
        return this;
    }

    /**
     * 设置位置，非叠加关系
     */
    setTranslate(x: number, y: number): this {
        mat3.translate(this.mat, this.mat, [x - this.x, y - this.y]);
        this.x = x;
        this.y = y;
        this.modified = true;
        this.emitUpdate();
        return this;
    }

    /**
     * 设置旋转，非叠加关系
     */
    setRotate(rad: number): this {
        mat3.rotate(this.mat, this.mat, rad - this.rad);
        this.rad = rad;
        this.modified = true;
        this.emitUpdate();
        return this;
    }

    /**
     * 设置变换矩阵，叠加模式
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
    ): this {
        mat3.multiply(
            this.mat,
            this.mat,
            mat3.fromValues(a, b, 0, c, d, 0, e, f, 1)
        );
        this.calAttributes();
        this.emitUpdate();
        return this;
    }

    /**
     * 设置变换矩阵，非叠加模式
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
    ): this {
        mat3.set(this.mat, a, b, 0, c, d, 0, e, f, 1);
        this.calAttributes();
        this.emitUpdate();
        return this;
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
        if (x === 0 && y === 0 && scaleX === 1 && scaleY === 1 && rad === 0) {
            this.modified = false;
        } else {
            this.modified = true;
        }
    }

    /**
     * 与一个矩阵相乘，返回其计算结果（不改变原矩阵）
     * @param transform 变换矩阵
     */
    multiply(transform: Transform): Transform {
        if (this.modified) {
            const result = new Transform();
            mat3.multiply(result.mat, this.mat, transform.mat);
            result.modified = true;
            return result;
        } else {
            return transform.clone();
        }
    }

    /**
     * 复制这个变换矩阵
     */
    clone() {
        const transform = new Transform();
        transform.mat = mat3.clone(this.mat);
        return transform;
    }

    /**
     * 根据变换矩阵的信息，将一个点转换为计算后的位置
     * @param x 横坐标
     * @param y 纵坐标
     */
    transformed(x: number, y: number): vec3 {
        if (!this.modified) return [x, y, 1];
        return multiplyVec3(this.mat, [x, y, 1]);
    }

    /**
     * 根据变换矩阵的信息，将一个计算后的位置逆转换为原位置
     * @param x 横坐标
     * @param y 纵坐标
     */
    untransformed(x: number, y: number): vec3 {
        if (!this.modified) return [x, y, 1];
        const invert = mat3.create();
        mat3.invert(invert, this.mat);
        return multiplyVec3(invert, [x, y, 1]);
    }

    /**
     * 根据变换矩阵的信息，将一个点转换为计算后的位置
     * @param transform 变换矩阵
     * @param x 横坐标
     * @param y 纵坐标
     */
    static transformed(transform: Transform, x: number, y: number) {
        return multiplyVec3(transform.mat, [x, y, 1]);
    }

    /**
     * 根据变换矩阵的信息，将一个计算后的位置逆转换为原位置
     * @param transform 变换矩阵
     * @param x 横坐标
     * @param y 纵坐标
     */
    static untransformed(transform: Transform, x: number, y: number) {
        const invert = mat3.create();
        mat3.invert(invert, transform.mat);
        return multiplyVec3(invert, [x, y, 1]);
    }

    /** 单位矩阵 */
    static get identity() {
        return new Transform();
    }
}

function multiplyVec3(mat: ReadonlyMat3, vec: ReadonlyVec3): vec3 {
    const v0 = vec[0];
    const v1 = vec[1];
    const v2 = vec[2];
    return [
        mat[0] * v0 + mat[3] * v1 + mat[6] * v2,
        mat[1] * v0 + mat[4] * v1 + mat[7] * v2,
        mat[2] * v0 + mat[5] * v1 + mat[8] * v2
    ];
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

export class Transform3D {
    mat: mat4 = mat4.create();

    /** 绑定的可更新元素 */
    bindedObject: Set<ITransformUpdatable<Transform3D>> = new Set();

    /**
     * 对这个变换实例添加绑定对象，当矩阵变换时，自动调用其 update 函数
     * @param obj 要绑定的对象
     */
    bind(obj: ITransformUpdatable<Transform3D>) {
        this.bindedObject.add(obj);
    }

    /**
     * 取消对象的绑定
     * @param obj 要取消绑定的对象
     */
    unbind(obj: ITransformUpdatable<Transform3D>) {
        this.bindedObject.delete(obj);
    }

    private emitUpdate() {
        this.bindedObject.forEach(v => v.updateTransform(this));
    }

    /**
     * 重置为单位矩阵
     */
    reset(): this {
        mat4.identity(this.mat);
        this.emitUpdate();
        return this;
    }

    /**
     * 应用缩放变换
     * @param x X轴缩放
     * @param y Y轴缩放
     * @param z Z轴缩放
     */
    scale(x: number, y: number, z: number): this {
        mat4.scale(this.mat, this.mat, [x, y, z]);
        this.emitUpdate();
        return this;
    }

    /**
     * 应用平移变换
     * @param x X轴平移
     * @param y Y轴平移
     * @param z Z轴平移
     */
    translate(x: number, y: number, z: number): this {
        mat4.translate(this.mat, this.mat, [x, y, z]);
        this.emitUpdate();
        return this;
    }

    /**
     * 应用旋转变换
     * @param rad 旋转角度（弧度）
     * @param axis 旋转轴
     */
    rotate(rad: number, axis: vec3): this {
        mat4.rotate(this.mat, this.mat, rad, axis);
        this.emitUpdate();
        return this;
    }

    /**
     * 应用绕X轴旋转
     * @param rad 旋转角度（弧度）
     */
    rotateX(rad: number): this {
        return this.rotate(rad, [1, 0, 0]);
    }

    /**
     * 应用绕Y轴旋转
     * @param rad 旋转角度（弧度）
     */
    rotateY(rad: number): this {
        return this.rotate(rad, [0, 1, 0]);
    }

    /**
     * 应用绕Z轴旋转
     * @param rad 旋转角度（弧度）
     */
    rotateZ(rad: number): this {
        return this.rotate(rad, [0, 0, 1]);
    }

    /**
     * 设置视图矩阵
     * @param eye 摄像机位置
     * @param center 目标位置
     * @param up 上方向量
     */
    lookAt(eye: vec3, center: vec3, up: vec3): this {
        mat4.lookAt(this.mat, eye, center, up);
        this.emitUpdate();
        return this;
    }

    /**
     * 设置透视投影矩阵
     * @param fovy 垂直视野角度（弧度）
     * @param aspect 宽高比
     * @param near 近平面
     * @param far 远平面
     */
    perspective(fovy: number, aspect: number, near: number, far: number): this {
        mat4.perspective(this.mat, fovy, aspect, near, far);
        this.emitUpdate();
        return this;
    }

    /**
     * 设置正交投影矩阵
     * @param left 左平面
     * @param right 右平面
     * @param bottom 底平面
     * @param top 顶平面
     * @param near 近平面
     * @param far 远平面
     */
    ortho(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number
    ): this {
        mat4.ortho(this.mat, left, right, bottom, top, near, far);
        this.emitUpdate();
        return this;
    }

    /**
     * 与另一个变换矩阵相乘
     * @param transform 另一个变换矩阵
     */
    multiply(transform: Transform3D): Transform3D {
        const result = new Transform3D();
        mat4.multiply(result.mat, this.mat, transform.mat);
        return result;
    }

    /**
     * 克隆当前变换矩阵
     */
    clone(): Transform3D {
        const clone = new Transform3D();
        mat4.copy(clone.mat, this.mat);
        return clone;
    }

    /**
     * 将点应用变换
     * @param point 要变换的点
     */
    transformed(point: vec3): vec3 {
        const result = vec3.create();
        vec3.transformMat4(result, point, this.mat);
        return result;
    }

    /**
     * 将点应用逆变换
     * @param point 要逆变换的点
     */
    untransformed(point: vec3): vec3 {
        const inverse = mat4.create();
        mat4.invert(inverse, this.mat);
        const result = vec3.create();
        vec3.transformMat4(result, point, inverse);
        return result;
    }

    /**
     * 静态方法：单位矩阵
     */
    static get identity(): Transform3D {
        return new Transform3D();
    }
}
