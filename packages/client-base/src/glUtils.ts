import { logger } from '@motajs/common';

export interface ICompiledProgram {
    /** 着色器程序 */
    readonly program: WebGLProgram;
    /** 顶点着色器对象 */
    readonly vertexShader: WebGLShader;
    /** 片段着色器对象 */
    readonly fragmentShader: WebGLShader;
}

/**
 * 编译着色器
 * @param gl WebGL2 上下文
 * @param type 着色器类型
 * @param source 着色器代码
 */
export function compileShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        const typeStr = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
        logger.error(10, typeStr, info ?? '');
        return null;
    }

    return shader;
}

/**
 * 编译链接着色器程序
 * @param gl WebGL2 上下文
 * @param vs 顶点着色器对象
 * @param fs 片段着色器对象
 */
export function compileProgram(
    gl: WebGL2RenderingContext,
    vs: WebGLShader,
    fs: WebGLShader
) {
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        logger.error(9, info ?? '');
        return null;
    }

    return program;
}

/**
 * 使用指定着色器代码编译链接程序
 * @param gl WebGL2 上下文
 * @param vs 顶点着色器代码
 * @param fs 片段着色器代码
 */
export function compileProgramWith(
    gl: WebGL2RenderingContext,
    vs: string,
    fs: string
): ICompiledProgram | null {
    const vsShader = compileShader(gl, gl.VERTEX_SHADER, vs);
    const fsShader = compileShader(gl, gl.FRAGMENT_SHADER, fs);

    if (!vsShader || !fsShader) return null;
    const program = compileProgram(gl, vsShader, fsShader);
    if (!program) return null;

    return {
        program,
        vertexShader: vsShader,
        fragmentShader: fsShader
    };
}
