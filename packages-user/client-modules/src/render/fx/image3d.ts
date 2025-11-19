import {
    ITransformUpdatable,
    ShaderProgram,
    Transform3D
} from '@motajs/render-core';
import { EffectBase } from './base';

export class Image3DEffect
    extends EffectBase<void>
    implements ITransformUpdatable<Transform3D>
{
    /** 图片的模型变换 */
    private model: Transform3D = new Transform3D();
    /** 视角变换 */
    private view: Transform3D = new Transform3D();
    /** 投影变换 */
    private proj: Transform3D = new Transform3D();

    protected getVertex(): string {
        return /* glsl */ `
            uniform mat4 u_imageTransform;

            void main() {
                v_texCoord = a_texCoord;
                gl_Position = u_imageTransform * a_position;
            }
        `;
    }

    protected getFragment(): string {
        return /* glsl */ `
            out vec4 color;

            void main() {
                color = texture(u_sampler, v_texCoord);
            }
        `;
    }

    initProgram(program: ShaderProgram): void {
        if (!this.shader) return;
        program.defineUniformMatrix(
            'u_imageTransform',
            this.shader.U_MATRIX_4x4
        );
        this.proj.perspective(Math.PI / 2, 1, 0.01, 1000);
        this.view.lookAt([0, 0, 1], [0, 0, 0], [0, 1, 0]);
        this.model.bind(this);
        this.view.bind(this);
        this.proj.bind(this);
        this.updateTransform();
    }

    updateTransform(): void {
        if (!this.shader || !this.program) return;
        const matrix = this.program.getMatrix('u_imageTransform');
        if (!matrix) return;
        const trans = this.proj.multiply(this.view).multiply(this.model);
        matrix.set(false, Array.from(trans.mat));
        this.requestUpdate();
    }

    /**
     * 设置模型变换
     * @param model 模型变换
     */
    setModel(model: Transform3D) {
        this.model.unbind(this);
        this.model = model;
        model.bind(this);
    }

    /**
     * 设置视角变换
     * @param model 视角变换
     */
    setView(view: Transform3D) {
        this.view.unbind(this);
        this.view = view;
        view.bind(this);
    }

    /**
     * 设置投影变换
     * @param model 投影变换
     */
    setProj(proj: Transform3D) {
        this.proj.unbind(this);
        this.proj = proj;
        proj.bind(this);
    }

    /**
     * 获取模型变换
     */
    getModel() {
        return this.model;
    }

    /**
     * 获取视角变换
     */
    getView() {
        return this.view;
    }

    /**
     * 获取投影变换
     */
    getProj() {
        return this.proj;
    }
}
