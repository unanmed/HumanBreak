const glMap: Record<string, WebGLRenderingContext> = {};

/**
 * 创建一个以webgl为绘制上下文的画布
 * @param id 画布id
 * @param x 横坐标
 * @param y 纵坐标
 * @param w 宽度
 * @param h 高度
 * @param z 纵深
 */
export function createWebGLCanvas(
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    z: number
) {
    if (id in glMap) {
        deleteWebGLCanvas(id);
    }
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl')!;
    const s = core.domStyle.scale;
    canvas.style.left = `${x * s}px`;
    canvas.style.top = `${y * s}px`;
    canvas.style.width = `${w * s}px`;
    canvas.style.height = `${h * s}px`;
    canvas.style.zIndex = `${z}`;
    canvas.width = w * s * devicePixelRatio;
    canvas.height = h * s * devicePixelRatio;
    core.dom.gameDraw.appendChild(canvas);
    return gl;
}

/**
 * 删除一个webgl画布
 * @param id 画布id
 */
export function deleteWebGLCanvas(id: string) {
    const gl = glMap[id];
    if (!gl) return;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.remove();
    delete glMap[id];
}

/**
 * 获取webgl画布上下文
 * @param id 画布id
 */
export function getWebGLCanvas(id: string): WebGLRenderingContext | null {
    return glMap[id];
}

/**
 * 创建webgl程序对象
 * @param gl 画布webgl上下文
 * @param vshader 顶点着色器
 * @param fshader 片元着色器
 */
export function createProgram(
    gl: WebGLRenderingContext,
    vshader: string,
    fshader: string
) {
    // 创建着色器
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);

    // 创建program
    const program = gl.createProgram();
    if (!program) {
        throw new Error(`Create webgl program fail!`);
    }

    // 分配和连接program
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // 检查连接是否成功
    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
        const err = gl.getProgramInfoLog(program);
        throw new Error(`Program link fail: ${err}`);
    }

    return program;
}

/**
 * 加载着色器
 * @param gl 画布的webgl上下文
 * @param type 着色器类型，顶点着色器还是片元着色器
 * @param source 着色器源码
 */
export function loadShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
) {
    // 创建着色器
    const shader = gl.createShader(type);
    if (!shader) {
        throw new ReferenceError(
            `Your device or browser does not support webgl!`
        );
    }
    // 引入并编译着色器
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // 检查是否编译成功
    const compiled = gl.getShaderParameter(gl, gl.COMPILE_STATUS);
    if (!compiled) {
        const err = gl.getShaderInfoLog(shader);
        throw new Error(`Shader compile fail: ${err}`);
    }

    return shader;
}
