import { MotaOffscreenCanvas2D } from './canvas2d';
import { EGL2Event, GL2, GL2Program, IGL2ProgramPrefix } from './gl2';

const SHADER_PREFIX: IGL2ProgramPrefix = {
    VERTEX: /* glsl */ `#version 300 es
precision highp float;

in vec4 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;
`,
    FRAGMENT: /* glsl */ `#version 300 es
precision highp float;

in vec2 v_texCoord;

uniform sampler2D u_sampler;
`
};

const DEFAULT_VS = /* glsl */ `
void main() {
    v_texCoord = a_texCoord;
    gl_Position = a_position;
}
`;
const DEFAULT_FS = /* glsl */ `
void main() {
    gl_FragColor = texture2D(u_sampler, v_texCoord);
}
`;

export interface EShaderEvent extends EGL2Event {}

export class Shader<E extends EShaderEvent = EShaderEvent> extends GL2<
    EShaderEvent | E
> {
    protected drawScene(
        canvas: MotaOffscreenCanvas2D,
        gl: WebGL2RenderingContext,
        program: GL2Program
    ): void {
        if (!program.modified) return;
        const tex = program.getTexture('u_sampler');
        if (!tex) return;
        const c = canvas.canvas;
        if (tex.width === c.width && tex.height === c.height) {
            tex.sub(c, 0, 0, c.width, c.height);
        } else {
            tex.set(c);
        }
        this.draw(gl, program);
    }
}

export class ShaderProgram extends GL2Program {
    protected override readonly prefix: IGL2ProgramPrefix = SHADER_PREFIX;

    constructor(gl2: GL2, vs?: string, fs?: string) {
        super(gl2, vs, fs);
        if (!vs) this.vs(DEFAULT_VS);
        if (!fs) this.fs(DEFAULT_FS);
        if (!vs && !fs) {
            this.modified = false;
        }
    }

    protected override compile() {
        const success = super.compile();
        if (!success) return false;
        const shader = this.element;
        const gl = shader.gl;
        if (!gl) return false;

        const tex = this.defineAttribArray('a_texCoord');
        const position = this.defineAttribArray('a_position');
        const sampler = this.defineTexture('u_sampler', 0);
        const indices = this.defineIndices('defalutIndices');
        if (!tex || !position || !sampler || !indices) {
            return true;
        }
        position.buffer(
            new Float32Array([1, -1, -1, -1, 1, 1, -1, 1]),
            gl.STATIC_DRAW
        );
        position.pointer(2, gl.FLOAT, false, 0, 0);
        position.enable();
        tex.buffer(new Float32Array([1, 1, 0, 1, 1, 0, 0, 0]), gl.STATIC_DRAW);
        tex.pointer(2, gl.FLOAT, false, 0, 0);
        tex.enable();
        indices.buffer(new Uint16Array([0, 1, 2, 2, 3, 1]), gl.STATIC_DRAW);
        this.useIndices(indices);
        this.paramElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        return true;
    }
}
