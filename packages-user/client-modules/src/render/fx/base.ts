import { Shader, ShaderProgram } from '@motajs/render-core';

export abstract class EffectBase<T> {
    /** 当前使用的程序 */
    protected program: ShaderProgram | null = null;
    /** 当前使用的着色器渲染元素 */
    protected shader: Shader | null = null;

    /**
     * 在一个着色器元素上创建效果
     * @param shader 着色器程序
     * @param options 本效果的配置信息
     */
    create(shader: Shader, options: T) {
        const vs = this.getVertex(options);
        const fs = this.getFragment(options);
        const program = shader.createProgram(ShaderProgram);
        program.vs(vs);
        program.fs(fs);
        program.requestCompile();

        this.program = program;
        this.shader = shader;

        shader.useProgram(program);
        this.initProgram(program, options);
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
        this.shader?.update();
    }

    /**
     * 使用此着色器
     */
    use() {
        if (!this.program || !this.shader) return;
        this.shader.useProgram(this.program);
    }
}
