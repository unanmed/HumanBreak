import { logger } from '@motajs/common';

export function compileGLWith(
    gl: WebGL2RenderingContext,
    vert: string,
    frag: string
): WebGLProgram | null {
    const vsShader = compileShader(gl, gl.VERTEX_SHADER, vert);
    const fsShader = compileShader(gl, gl.FRAGMENT_SHADER, frag);

    if (!vsShader || !fsShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vsShader);
    gl.attachShader(program, fsShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        logger.error(9, info ?? '');
        return null;
    }

    return program;
}

function compileShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // 如果编译失败
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        const typeStr = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
        logger.error(10, typeStr, info ?? '');
        return null;
    }

    return shader;
}
