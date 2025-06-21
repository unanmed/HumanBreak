import { Shader, ShaderProgram } from '@motajs/render-core';

export abstract class EffectBase<T> {
    /** 当前使用的程序 */
    protected readonly program: ShaderProgram;

    constructor(
        public readonly shader: Shader,
        public readonly options: T
    ) {
        const vs = this.getVertex(options);
        const fs = this.getFragment(options);
        const program = shader.createProgram(ShaderProgram, vs, fs);
        program.requestCompile();

        this.program = program;
    }

    /**
     * 获取片段着色器代码
     * @param options 配置信息
     */
    protected abstract getVertex(options: T): string;

    /**
     * 获取顶点着色器代码
     * @param options 配置信息
     */
    protected abstract getFragment(options: T): string;

    /**
     * 初始化着色器程序
     * @param program 着色器程序
     * @param options 配置信息
     */
    abstract initProgram(program: ShaderProgram, options: T): void;

    /**
     * 更新着色器渲染
     */
    requestUpdate() {
        this.shader.update();
    }

    /**
     * 使用此着色器
     */
    use() {
        this.shader.useProgram(this.program);
    }
}
