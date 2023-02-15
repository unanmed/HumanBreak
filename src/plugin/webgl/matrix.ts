import { cloneDeep } from 'lodash';
import { has } from '../utils';

export class Matrix extends Array<number[]> {
    constructor(...n: number[][]) {
        if (n.length !== n[0]?.length) {
            throw new TypeError(
                `The array delivered to Matrix must has the same length of its item and itself.`
            );
        }
        super(...n);
    }

    /**
     * 加上某个方阵
     * @param matrix 要加上的方阵
     */
    add(matrix: number[][]): Matrix {
        if (matrix.length !== this.length) {
            throw new TypeError(
                `To add a martrix, the be-added-matrix's size must equal to the to-add-matrix's.`
            );
        }
        const length = matrix.length;
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < length; j++) {
                this[i][j] += matrix[i][j];
            }
        }
        return this;
    }

    /**
     * 让该方阵与另一个方阵相乘
     * @param matrix 要相乘的方阵
     */
    multipy(matrix: number[][]): Matrix {
        if (matrix.length !== this.length) {
            throw new TypeError(
                `To multipy a martrix, the be-multipied-matrix's size must equal to the to-multipy-matrix's.`
            );
        }
        const n = this.length;
        const arr = Array.from(this).map(v => v.slice());
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                this[i][j] = 0;
                for (let k = 0; k < n; k++) {
                    this[i][j] += arr[i][k] * matrix[k][j];
                }
            }
        }

        return this;
    }
}

export class Matrix4 extends Matrix {
    constructor(...n: number[][]) {
        if (n.length === 0) {
            n = [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ];
        }

        if (n.length !== 4) {
            throw new TypeError(`The length of delivered array must be 4.`);
        }
        super(...n);
    }

    /**
     * 平移变换
     * @param x 平移横坐标
     * @param y 平移纵坐标
     * @param z 平移竖坐标
     */
    translate(x: number, y: number, z: number) {
        this.multipy([
            [1, 0, 0, x],
            [0, 1, 0, y],
            [0, 0, 1, z],
            [0, 0, 0, 1]
        ]);
    }

    /**
     * 缩放变换
     * @param x 沿x轴的缩放比例
     * @param y 沿y轴的缩放比例
     * @param z 沿z轴的缩放比例
     */
    scale(x: number, y: number, z: number) {
        this.multipy([
            [x, 0, 0, 0],
            [0, y, 0, 0],
            [0, 0, z, 0],
            [0, 0, 0, 1]
        ]);
    }

    /**
     * 旋转变换
     * @param x 绕x轴的旋转角度
     * @param y 绕y轴的旋转角度
     * @param z 绕z轴的旋转角度
     */
    rotate(x?: number, y?: number, z?: number): Matrix4 {
        if (has(x) && x !== 0) {
            const sin = Math.sin(x);
            const cos = Math.cos(x);
            this.multipy([
                [1, 0, 0, 0],
                [0, cos, sin, 0],
                [0, -sin, cos, 0],
                [0, 0, 0, 1]
            ]);
        }
        if (has(y) && y !== 0) {
            const sin = Math.sin(y);
            const cos = Math.cos(y);
            this.multipy([
                [cos, 0, -sin, 0],
                [0, 1, 0, 0],
                [sin, 0, cos, 0],
                [0, 0, 0, 1]
            ]);
        }
        if (has(z) && z !== 0) {
            const sin = Math.sin(z);
            const cos = Math.cos(z);
            this.multipy([
                [cos, sin, 0, 0],
                [-sin, cos, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ]);
        }
        return this;
    }

    /**
     * 转置矩阵
     * @param target 转置目标，是赋给原矩阵还是新建一个矩阵
     */
    transpose(target: 'this' | 'new' = 'new'): Matrix4 {
        const t = target === 'this' ? this : new Matrix4();
        const arr = Array.from(this).map(v => v.slice());
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                t[i][j] = arr[j][i];
            }
        }
        return t;
    }

    /**
     * 转换成列主序的Float32Array，用于webgl
     */
    toWebGLFloat32Array(): Float32Array {
        return new Float32Array(Array.from(this.transpose()).flat());
    }
}
