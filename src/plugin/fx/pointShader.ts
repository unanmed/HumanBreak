import { logger } from '@/core/common/logger';
import { Shader, ShaderProgram, UniformType } from '@/core/render/shader';
import { Transform } from '@/core/render/transform';

export const enum PointEffectType {
    /**
     * 无特效，在此之后的所有特效将会被截断，因此不要在空特效之后添加特效，也不要手动添加空特效
     */
    None,
    /**
     * 反色特效，可与任意特效叠加\
     * 参数分别为：\
     * `data1: x, y, radius, decay` | 横坐标，纵坐标，半径，衰减开始半径\
     * `data2: ratio, _, _, _` | 反色强度，空，空，空
     */
    CircleInvert,
    /**
     * 灰度特效，可与任意特效叠加\
     * 参数分别为：\
     * `data1: x, y, radius, decay` | 横坐标，纵坐标，半径，衰减开始半径\
     * `data2: ratio, _, _, _` | 黑白强度，空，空，空
     */
    CircleGray,
    /**
     * 对比度特效，可与任意特效叠加\
     * 参数分别为：\
     * `data1: x, y, radius, decay` | 横坐标，纵坐标，半径，衰减开始半径\
     * `data2: ratio, _, _, _` | 对比度强度（0表示不变，-1表示灰色，1表示2倍对比度），空，空，空
     */
    CircleContrast,
    /**
     * 饱和度特效，可与任意特效叠加\
     * 参数分别为：\
     * `data1: x, y, radius, decay` | 横坐标，纵坐标，半径，衰减开始半径\
     * `data2: ratio, _, _, _` | 对比度强度（0表示不变，-1表示灰色，1表示2倍饱和度），空，空，空
     */
    CircleSaturate,
    /**
     * 饱和度特效，可与任意特效叠加\
     * 参数分别为：\
     * `data1: x, y, radius, decay` | 横坐标，纵坐标，半径，衰减开始半径\
     * `data2: angle, _, _, _` | 旋转角度（0表示旋转0度，1表示旋转360度），空，空，空
     */
    CircleHue,
    /**
     * 圆形扭曲特效，注意此特效会导致在此之前的所有非扭曲类特效失效，在添加时，系统会自动排序以保证特效正常显示\
     * 参数分别为：\
     * `data1: x, y, maxRaius, waveRadius` | 中心横坐标，中心纵坐标，波纹最大传播距离，波纹环的半径\
     * `data2: amplitude, attenuation, linear, tangential` \
     *         &ensp;&ensp;* `amplitude`: 震动幅度（1表示幅度为1个屏幕，受摄像机缩放影响）\
     *         &ensp;&ensp;* `attenuation`: 衰减比例，即衰减速度\
     *         &ensp;&ensp;* `linear`: 开始线性衰减时间（为确保波纹最终归于平静，在衰减时，会首先平方反比衰减，
     *         然后到此值时转为线性衰减。此参数范围0-1，0.5表示从一半时间处开始线性衰减）\
     *         &ensp;&ensp;* `tangential`: 切向扭曲比例（1表示与振动幅度一致）\
     * `data3: startPhase, endPhase, _, _` | 起始位置相位（靠近波纹中心的位置），终止位置相位（远离波纹中心位置），空，空，
     *         其中相位一个周期为2 * PI，填 Math.PI * 2 则表示相位从一个周期处开始
     */
    CircleWarp,
    /**
     * 圆形切向扭曲特效\
     * 参数分别为：\
     * `data1: x, y, minRadius, maxRadius` | 中心横坐标，中心纵坐标，扭曲环内圈半径，扭曲环外圈半径
     *         （1表示扭曲了相位角的程度，例如Math.PI的相位，幅度为1，表示旋转整整一圈）\
     * `data2: startPhase, endPhase, _, _` 起始位置相位（靠近波纹中心的位置），终止位置相位（远离波纹中心的位置），空，空
     */
    CircleWarpTangetial
}

type EffectData = [x0: number, x1: number, x2: number, x3: number];

const warpEffect = new Set<PointEffectType>();
warpEffect
    .add(PointEffectType.CircleWarp)
    .add(PointEffectType.CircleWarpTangetial);

export class PointEffect {
    /** 着色器程序 */
    private program?: ShaderProgram;
    /** 着色器渲染元素 */
    private shader?: Shader;

    /** 是否开始计时器 */
    private started: boolean = false;
    /** 计时器委托id */
    private delegation: number = -1;
    /** 特效id计数器，用于修改对应特效的数据 */
    private effectId: number = 0;
    /** 特效id到特效索引的映射 */
    private idIndexMap: Map<number, number> = new Map();
    /** 变换矩阵 */
    private transform?: Transform;

    /** 特效最大数量 */
    private effectCount: number = 0;
    /** 特效数据 */
    private dataList: Float32Array = new Float32Array();
    /** 经过矩阵变换操作后的特效数据 */
    private transformed: Float32Array = new Float32Array();
    /** 当前的数据指针，也就是下一次添加特效应该添加至哪 */
    private dataPointer: number = 0;
    /** 是否需要更新数据 */
    private needUpdateData: boolean = false;
    /** 需要在之后添加的特效 */
    private toAdd: Set<number[]> = new Set();
    /** 每个特效的开始时间 */
    private startTime: Map<number, number> = new Map();
    /**
     * 为着色器创建程序
     * @param shader 着色器渲染元素
     * @param itemCount 最大效果数量
     */
    create(shader: Shader, itemCount: number) {
        if (this.program || this.shader || this.started) return;
        const program = shader.createProgram();
        program.setVersion(shader.VERSION_ES_300);
        program.fs(generateFragment(itemCount));
        program.requestCompile();

        // 声明变量
        program.defineUniform('u_count', shader.UNIFORM_1i);
        program.defineUniform('u_screen', shader.UNIFORM_2f);
        program.defineUniformBlock(
            'EffectInfo',
            itemCount * 16,
            shader.gl.DYNAMIC_DRAW,
            0
        );

        this.program = program;
        this.shader = shader;
        this.effectCount = itemCount;
        this.dataList = new Float32Array(itemCount * 16);
        this.transformed = new Float32Array(itemCount * 16);

        return program;
    }

    /**
     * 在下一帧更新特效数据
     */
    requestUpdate() {
        this.needUpdateData = true;
        if (this.shader) this.shader.update(this.shader);
    }

    /**
     * 设置本特效实例的变换矩阵，变换矩阵可以在设置特效位置时自动进行变换，配合摄像机视角
     * @param tranform 变换矩阵
     */
    setTransform(tranform: Transform) {
        this.transform = tranform;
    }

    /**
     * 添加一个特效，如果特效还未开始，那么会在其开始时添加特效，注意特效数据必须填四位，不足者补0
     * @param type 特效类型
     * @param startTime 特效开始时间
     * @param time 特效持续时间
     * @param data1 第一组自定义数据，可选
     * @param data2 第二组自定义数据，可选
     * @param data3 第三组自定义数据，可选
     * @returns 这个特效的唯一id，可用于设置特效
     */
    addEffect(
        type: PointEffectType,
        startTime: number,
        time: number,
        data1: EffectData = [0, 0, 0, 0],
        data2: EffectData = [0, 0, 0, 0],
        data3: EffectData = [0, 0, 0, 0]
    ) {
        if (type === PointEffectType.None) return -1;
        const now = Date.now();
        // 如果已经结束，那么什么都不干
        if (now > time + startTime) return -1;
        // 填充 0 是因为 std140 布局中，每个数据都会占据 16 的倍数个字节
        // 不过第二项填充一个整数，是为了能够对每个特效进行标识，从而能够对某个特效进行修改
        const id = this.effectId++;
        // 第三项为特效的进度
        const data = [type, id, 0, time, ...data1, ...data2, ...data3];
        this.startTime.set(id, startTime);

        if (now >= startTime) {
            this.addEffectToList(data);
        } else {
            // 如果还没开始，那么添加至预备队列
            this.toAdd.add(data);
        }

        return id;
    }

    /**
     * 立刻删除一个特效
     * @param id 要删除的特效的id
     */
    deleteEffect(id: number) {
        this.removeEffect(this.findIndexById(id));
    }

    /**
     * 清除所有特性
     */
    clearEffect() {
        this.dataList.fill(0);
        this.dataPointer = 0;
        this.needUpdateData = true;
    }

    /**
     * 设置一个特效的数据，注意特效数据必须填四位，不足者补0
     * @param id 特效id
     * @param data1 第一组自定义数据，可选
     * @param data2 第二组自定义数据，可选
     * @param data3 第三组自定义数据，可选
     */
    setEffect(
        id: number,
        data1?: EffectData,
        data2?: EffectData,
        data3?: EffectData
    ) {
        const index = this.findIndexById(id);
        if (index >= this.dataPointer || index === -1) return;
        const list = this.dataList;
        if (data1) {
            list.set(data1, index * 16 + 4);
        }
        if (data2) {
            list.set(data2, index * 16 + 8);
        }
        if (data3) {
            list.set(data3, index * 16 + 12);
        }
        this.needUpdateData = true;
    }

    private findIndexById(id: number) {
        const map = this.idIndexMap.get(id);
        if (map !== void 0) return map;
        let index = -1;
        const list = this.dataList;
        for (let i = 0; i < this.effectCount; i++) {
            const realIndex = i * 16 + 1;
            if (list[realIndex] === id) {
                index = i;
                break;
            }
        }
        if (index !== -1) {
            this.idIndexMap.set(id, index);
        }
        return index;
    }

    private addEffectToList(data: number[]) {
        if (this.dataPointer >= this.effectCount) {
            logger.warn(1101);
            return;
        }
        const type = data[0];
        const list = this.dataList;
        if (warpEffect.has(type)) {
            list.copyWithin(16, 0);
            list.set(data, 0);
            this.dataPointer++;
            this.idIndexMap.clear();
        } else {
            const id = data[1];
            list.set(data, this.dataPointer * 16);
            this.idIndexMap.set(id, this.dataPointer);
            this.dataPointer++;
        }

        this.needUpdateData = true;
    }

    private removeEffect(index: number) {
        if (index >= this.effectCount) return;
        if (this.dataPointer === 0) return;
        const list = this.dataList;
        const id = list[index * 16 + 1];
        this.startTime.delete(id);
        list.copyWithin(index * 16, index * 16 + 16);
        list.fill(0, -16, -1);
        this.dataPointer--;
        this.needUpdateData = true;
        this.idIndexMap.clear();
    }

    /**
     * 使用这个特效作为着色器程序
     */
    use() {
        if (!this.shader || !this.program) return;
        this.shader.useProgram(this.program);
        const uCount =
            this.program.getUniform<UniformType.Uniform1f>('u_count');
        uCount?.set(this.effectCount);
    }

    /**
     * 开始计时器
     */
    start() {
        if (!this.shader || !this.program) return;
        this.started = true;
        const block = this.program.getUniformBlock('EffectInfo')!;
        const screen =
            this.program.getUniform<UniformType.Uniform2f>('u_screen');
        const { width, height } = this.shader;
        const scale = core.domStyle.scale * devicePixelRatio;
        screen?.set(width * scale, height * scale);

        // 不知道性能怎么样，只能试试看了
        this.delegation = this.shader.delegateTicker(() => {
            if (!this.started) {
                this.shader?.removeTicker(this.delegation);
                return;
            }
            const now = Date.now();
            const toDelete = new Set<number[]>();
            this.toAdd.forEach(v => {
                const id = v[1];
                const startTime = this.startTime.get(id);
                if (!startTime) return;
                const time = v[3];
                if (now > startTime + time) {
                    toDelete.add(v);
                } else if (now >= startTime) {
                    this.addEffectToList(v);
                    toDelete.add(v);
                }
            });
            toDelete.forEach(v => this.toAdd.delete(v));

            const toRemove: number[] = [];
            const list = this.dataList;

            // 倒序以保证删除时不会影响到其他删除
            for (let i = this.effectCount - 1; i >= 0; i--) {
                const type = list[i * 16];
                if (type === PointEffectType.None) continue;
                const id = list[i * 16 + 1];
                const start = this.startTime.get(id);
                if (!start) {
                    toRemove.push(i);
                    continue;
                }
                const time = list[i * 16 + 3];
                const progress = (now - start) / time;
                if (progress > 1) toRemove.push(i);
                list[i * 16 + 2] = progress;
            }
            toRemove.forEach(v => {
                this.removeEffect(v);
            });

            if (this.needUpdateData) {
                const list = this.dataList;
                const transformed = this.transformed;
                transformed.set(list);
                this.transformData();
                block.set(transformed);
            }
        });
    }

    /**
     * 结束计时器
     */
    end() {
        if (!this.started || !this.shader || !this.program) return;
        this.shader.removeTicker(this.delegation);
        this.started = false;
        this.dataList.fill(0);
        this.dataPointer = 0;
    }

    destroy() {
        this.end();
        if (this.shader && this.program) {
            this.shader.deleteProgram(this.program);
        }
    }

    private transformData() {
        const transform = this.transform;
        if (!transform) return;
        const count = this.effectCount;
        const list = this.dataList;
        const transformed = this.transformed;
        let ratio = core.domStyle.scale;
        if (this.shader?.highResolution) ratio *= devicePixelRatio;
        const scale = transform.scaleX * ratio;
        const scaleTransform = new Transform();
        scaleTransform.scale(ratio, ratio);
        const scaled = scaleTransform.multiply(transform);
        const fixedHeight = core._PY_ * ratio;

        const transformXY = (index: number) => {
            const x = list[index + 4];
            const y = list[index + 5];
            const [tx, ty] = Transform.transformed(scaled, x, y);
            transformed[index + 4] = tx;
            transformed[index + 5] = fixedHeight - ty;
        };

        for (let i = 0; i < count; i++) {
            const index = i * 16;
            const type = list[index];

            switch (type) {
                case PointEffectType.CircleGray:
                case PointEffectType.CircleInvert:
                case PointEffectType.CircleContrast:
                case PointEffectType.CircleSaturate:
                case PointEffectType.CircleHue:
                case PointEffectType.CircleWarpTangetial: {
                    transformXY(index);
                    transformed[index + 6] *= scale;
                    transformed[index + 7] *= scale;
                    break;
                }
                case PointEffectType.CircleWarp: {
                    transformXY(index);
                    transformed[index + 6] *= scale;
                    transformed[index + 7] *= scale;
                    transformed[index + 8] *= scale;
                    break;
                }
                case PointEffectType.None: {
                    return;
                }
            }
        }
    }
}

function generateFragment(itemCount: number) {
    return /* glsl */ `
uniform int u_count;
uniform vec2 u_screen; // 画布长宽

out vec4 outColor;

struct Effect {
    vec2 type; // 效果类型
    vec2 time; // 开始时间，持续时长
    vec4 info1; // 第一组信息，表示自定义参数
    vec4 info2; // 第二组信息，表示自定义参数
    vec4 info3; // 第三组信息，表示自定义参数
};

layout (std140) uniform EffectInfo {
    Effect effects[${itemCount}];
};

// Helper function: RGB to HSL conversion
vec3 rgb2hsl(vec3 color) {
    float maxC = max(max(color.r, color.g), color.b);
    float minC = min(min(color.r, color.g), color.b);
    float delta = maxC - minC;
    
    float h = 0.0;
    float s = 0.0;
    float l = (maxC + minC) * 0.5;

    if (delta != 0.0) {
        s = (l < 0.5) ? delta / (maxC + minC) : delta / (2.0 - maxC - minC);
        
        if (maxC == color.r) {
            h = (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0);
        } else if (maxC == color.g) {
            h = (color.b - color.r) / delta + 2.0;
        } else {
            h = (color.r - color.g) / delta + 4.0;
        }
        h /= 6.0;
    }

    return vec3(h, s, l);
}

// Helper function: Hue to RGB conversion
float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0 / 2.0) return q;
    if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
    return p;
}

// Helper function: HSL to RGB conversion
vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;

    float r, g, b;

    if (s == 0.0) {
        r = g = b = l; // Achromatic (gray)
    } else {
        float q = (l < 0.5) ? (l * (1.0 + s)) : (l + s - l * s);
        float p = 2.0 * l - q;

        r = hue2rgb(p, q, h + 1.0 / 3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0 / 3.0);
    }

    return vec3(r, g, b);
}

// x: 横坐标 y: 纵坐标 z: 半径 w: 衰减开始半径
// 计算圆形效果的衰减程度
float calCircleDecay(vec4 data) {
    float dis = distance(data.xy, gl_FragCoord.xy);
    if (dis <= data.w) return 1.0;
    if (dis >= data.z) return 0.0;
    if (data.z <= data.w) return 1.0;
    return 1.0 - (dis - data.w) / (data.z - data.w);
}

// data1: x, y, maxRadius, waveRadius
// data2: amplitude, attenuation, linear, _
// 计算波纹扭曲的衰减程度，从 x = 1 的平方反比函数开始，衰减至 x = 1 + attenuation，然后线性衰减
float calWarpDecay(float progress, vec4 data1, vec4 data2) {
    if (progress >= data2.z) {
        float end = 1.0 / pow(1.0 + data2.y, 2.0);
        return end - end * (progress - data2.z) / (1.0 - data2.z);
    } else {
        return 1.0 / pow(1.0 + (progress / data2.z) * data2.y, 2.0);
    }
}

void main() {
    vec2 coord = v_texCoord;
    vec4 color = texture(u_sampler, v_texCoord);
    for (int i = 0; i < u_count; i++) {
        Effect effect = effects[i];
        int effectType = int(effect.type.x);
        vec2 timeInfo = effect.time;
        vec4 data1 = effect.info1;
        vec4 data2 = effect.info2;
        vec4 data3 = effect.info3;
        if (effectType == ${PointEffectType.None}) break;
        float progress = timeInfo.x;

        // 下面开始实施对应的着色器特效

        // 反色，data1: x y radius decay；data2: ratio _ _ _
        if (effectType == ${PointEffectType.CircleInvert}) {
            float ratio = data2.x * calCircleDecay(data1);
            if (ratio > 0.0) {
                vec3 delta = (1.0 - 2.0 * color.rgb) * ratio;
                color.rgb = clamp(color.rgb + delta, 0.0, 1.0);
            }
        }
        // 灰度，data1: x y radius decay；data2: ratio _ _ _
        else if (effectType == ${PointEffectType.CircleGray}) {
            float ratio = data2.x * calCircleDecay(data1);
            if (ratio > 0.0) {
                float gray = dot(color.rgb, vec3(0.2126, 0.7125, 0.0722));
                vec3 grayed = color.rgb - gray;
                color = vec4(color.rgb - grayed * ratio, 1.0);
            }
        }
        // 对比度，data1: x y radius decay；data2: ratio _ _ _
        else if (effectType == ${PointEffectType.CircleContrast}) {
            float ratio = data2.x * calCircleDecay(data1) + 1.0;
            if (ratio > 0.0) {
                color.rgb = mix(vec3(0.5), color.rgb, ratio);
            }
        }
        // 饱和度，data1: x y radius decay；data2: ratio _ _ _
        else if (effectType == ${PointEffectType.CircleSaturate}) {
            float ratio = data2.x * calCircleDecay(data1) + 1.0;
            if (ratio > 0.0) {
                float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                color.rgb = mix(vec3(gray), color.rgb, ratio);
            }
        }
        // 色相旋转，data1: x y radius decay；data2: angle _ _ _
        else if (effectType == ${PointEffectType.CircleHue}) {
            float ratio = data2.x * calCircleDecay(data1);
            if (ratio > 0.0) {
                vec3 hsl = rgb2hsl(color.rgb);
                hsl.x = mod(hsl.x + data2.x * ratio, 1.0);
                color.rgb = hsl2rgb(hsl);
            }
        }
        // 扭曲，data1: x, y, maxRadius, waveRadius; data2: amplitude, attenuation, linear, _
        //      data3: startPhase, endPhase, _, _
        else if (effectType == ${PointEffectType.CircleWarp}) {
            float dis = distance(data1.xy, gl_FragCoord.xy);
            // 当前半径
            float radius = progress * data1.z;
            if (dis > radius + data1.w || dis < radius - data1.w) continue;
            float ratio = data2.x * calWarpDecay(progress, data1, data2);
            float halfRadius = data1.w / 2.0;
            if (ratio > 0.0 && abs(dis - radius) <= halfRadius) {
                // 计算当前相位
                float x = ((dis - radius) / data1.w + 0.5) * (data3.y - data3.x) + data3.x;
                float wave = sin(x) * ratio;
                float xRatio = (gl_FragCoord.x - data1.x) / dis;
                float yRatio = (gl_FragCoord.y - data1.y) / dis;
                coord.x += wave * xRatio + wave * yRatio * data2.w;
                coord.y += wave * yRatio + wave * xRatio * data2.w;
                color = texture(u_sampler, coord);
            }
        }
        // 切向扭曲，data1: x, y, minRadius, maxRadius; data2: startPhase, endPhase, _, _
        else if (effectType == ${PointEffectType.CircleWarpTangetial}) {
            float dis = distance(data1.xy, gl_FragCoord.xy);
            float ratio = (dis - data1.z) / (data1.w - data1.z);
            if (ratio <= 1.0 && ratio > 0.0) {
                float phase = ratio * (data2.y - data2.x) + data2.x;
                float waveSin = sin(phase);
                float waveCos = cos(phase);
                // 相对坐标
                vec2 relCoord = gl_FragCoord.xy - data1.xy;
                coord.x = (data1.x + relCoord.x * waveCos - relCoord.y * waveSin) / u_screen.x;
                coord.y = 1.0 - (data1.y + relCoord.x * waveSin + relCoord.y * waveCos) / u_screen.y;
                color = texture(u_sampler, coord);
            }
        }
    }
    outColor = color;
}
`;
}
