import {
    Component,
    RenderFunction,
    SetupContext,
    VNode,
    VNodeChild,
    defineComponent,
    h as hVue,
    isVNode,
    onMounted
} from 'vue';
import BoxAnimate from '@/components/boxAnimate.vue';
import { ensureArray } from '@/plugin/utils';

interface VForRenderer {
    type: '@v-for';
    items: any[] | (() => any[]);
    map: (value: any, index: number) => VNode;
}

interface MotaComponent extends MotaComponentConfig {
    type: string;
    children: (MComponent | MotaComponent | VNode)[];
}

interface MotaComponentConfig {
    innerText?: string | (() => string);
    props?: Record<string, () => any>;
    component?: Component | MComponent;
    dComponent?: () => Component;
    /** 传递插槽 */
    slots?: Record<string, (props: Record<string, any>) => VNode | VNode[]>;
    vif?: () => boolean;
    velse?: boolean;
}

type OnSetupFunction = (props: Record<string, any>, ctx: SetupContext) => void;
type SetupFunction = (
    props: Record<string, any>,
    ctx: SetupContext
) => RenderFunction | Promise<RenderFunction>;
type RetFunction = (
    props: Record<string, any>,
    ctx: SetupContext
) => VNodeChild | VNodeChild[];
type OnMountedFunction = (
    props: Record<string, any>,
    ctx: SetupContext,
    canvas: HTMLCanvasElement[]
) => void;

type NonComponentConfig = Omit<
    MotaComponentConfig,
    'innerText' | 'component' | 'slots' | 'dComponent'
>;

type MComponentChildren =
    | (MComponent | MotaComponent | VNode)[]
    | MComponent
    | MotaComponent
    | VNode;

export class MComponent {
    static mountNum: number = 0;

    content: (MotaComponent | VForRenderer)[] = [];

    private onSetupFn?: OnSetupFunction;
    private setupFn?: SetupFunction;
    private onMountedFn?: OnMountedFunction;
    private retFn?: RetFunction;

    private propsDef: Record<string, any> = {};
    private emitsDef: string[] = [];

    /**
     * 定义一个props，是一个对象，键表示props名称，值表示类型，例如num: Number
     * 对于直接通过`UiController.open`方法打开的ui，应当包含以下两项
     * - num: ui的唯一标识符，类型为Number
     * - ui: 对于的GameUi实例，类型为GameUi
     * @param props 被定义的props
     */
    defineProps(props: Record<string, any>) {
        this.propsDef = props;
    }

    /**
     * 定义这个组件的emits，是一个字符串数组，表示emits的名称
     * @param emits 被定义的emits
     */
    defineEmits(emits: string[]) {
        this.emitsDef = emits;
    }

    /**
     * 添加一个div渲染内容
     * @param children 渲染内容的子内容
     * @param config 渲染内容的配置信息，参考 {@link MComponent.h}
     */
    div(children?: MComponentChildren, config?: NonComponentConfig) {
        return this.h('div', children, config);
    }

    /**
     * 添加一个span渲染内容
     * @param children 渲染内容的子内容
     * @param config 渲染内容的配置信息，参考 {@link MComponent.h}
     */
    span(children?: MComponentChildren, config?: NonComponentConfig) {
        return this.h('span', children, config);
    }

    /**
     * 添加一个canvas渲染内容
     * @param config 渲染内容的配置信息，参考 {@link MComponent.h}
     */
    canvas(config?: NonComponentConfig) {
        return this.h('canvas', [], config);
    }

    /**
     * 添加一个文字渲染内容
     * @param text 要渲染的文字内容
     */
    text(text: string | (() => string), config: NonComponentConfig = {}) {
        return this.h('text', [], { ...config, innerText: text });
    }

    /**
     * 添加一个组件渲染内容
     * @param component 要添加的组件
     * @param config 渲染内容的配置信息，参考 {@link MComponent.h}
     */
    com(
        component: Component | MComponent,
        config?: Omit<MotaComponentConfig, 'innerText' | 'component'>
    ) {
        return this.h(component, [], config);
    }

    /**
     * 列表渲染一系列内容
     * @param items 要遍历的列表，可以是一个数组，也可以是一个返回数组的函数
     * @param map 遍历函数，接收列表的每一项的值和索引，并返回一个VNode，VNode可以通过Vue.h函数，
     *            或者MComponent.vNode函数生成。
     */
    vfor<T>(items: T[] | (() => T[]), map: (value: T, index: number) => VNode) {
        this.content.push(MCGenerator.vfor(items, map));
        return this;
    }

    /**
     * 添加渲染内容，注意区分组件和`MComponent`的区别，组件是经由`MComponent`的`export`函数输出的内容。
     * 该函数是对`Vue`的`h`函数的高度包装，将`h`函数抽象成为了一个模板，然后经由`export`函数导出后直接输出成为一个组件。
     * 而因此，几乎所有内容都要求传入一个函数，一般这个函数会在真正渲染的时候执行，并将返回值作为真正值传入。
     * 不过对于部分内容，例如`slots`和`vfor.map`，并不是这样的。具体用法请参考参数注释。
     * 注意如果使用了该包装，那么是无法实现响应式布局的，如果想要使用响应式布局，就必须调用`setup`方法，
     * 手写全部的`setup`函数。
     * @param type 要添加的渲染内容。
     *             - 可以是一个字符串，表示dom元素，例如`div` `span`等，
     *             - 可以是一个组件，也可以是一个`MComponent`，表示将其的导出作为组件。
     *             - 除此之外，还可以填`text`，表示这个渲染内容是一个单独的文字，同时`children`会无效，
     *               必须填写`config`的`innerText`参数。
     *             - 该值还可以是字符串`component`，表示动态组件，同时必须填入`config`的`component`参数，
     *               同时`children`会无效
     *             - 该值不能填`@v-for`
     * @param children 该渲染内容的子内容。
     *                 - 可以是一个`MComponent`数组，数组内容即是子内容
     *                 - 也可以是一个`MComponent`，表示这个组件内容为子内容
     * @param config 渲染内容的配置内容，包含下列内容，均为可选。
     *               - `innerText`: 当渲染内容为字符串时显示的内容，可以是字符串，或是返回字符串的函数
     *               - `props`: 传入渲染内容的`props`，是一个对象，每个值都是一个函数，其返回值是真正传入的`props`
     *                        对象的键是`prop`名称，如果是如`class` `id`这样的html属性，那么会视为其`attribute`，
     *                        会符合`Vue`的`attribute`透传。对于以on开头，然后紧接着大写字母的属性，会被视为事件监听，
     *                        即v-on
     *               - `component`: 当为动态组件时，该项与`dComponent`必填其中之一，该项表示动态组件的内容
     *               - `dComponent`: 当为动态组件时，该项与`component`必填其中之一，该项是一个函数，返回值表示动态组件的内容
     *                               当`component`也填时，优先使用该项
     *               - `slots`: 传递插槽，将内容传入渲染内容的插槽，是一个对象，每个对象都是一个函数，
     *                        要求函数返回一个渲染VNode或数组，可以通过`MComponent.vNode`函数将组件转换成VNode数组，
     *                        返回值直接作为插槽内容
     *               - `vif`: 条件渲染，是一个函数，返回一个布尔值，表示条件是否满足，当`velse`为`true`时，
     *                      条件渲染将会变成 `else-if`
     *               - `velse`: 条件渲染，当前一个条件不满足时渲染该内容
     */
    h(
        type: string | Component | MComponent,
        children?: MComponentChildren,
        config: MotaComponentConfig = {}
    ): this {
        this.content.push(MCGenerator.h(type, children, config));
        return this;
    }

    /**
     * 当setup被执行时，要执行的函数，接受props，没有返回值，可以不设置
     */
    onSetup(fn: OnSetupFunction) {
        this.onSetupFn = fn;
        return this;
    }

    /**
     * 当组件被挂载完毕后执行函数
     * @param fn 当组件被挂载完毕后执行的函数，接收props和当前级组件（不包含子组件）的所有画布作为参数
     *           当前级组件表示直接在当前组件中渲染的内容，不包括子组件，子组件的画布需要在其对应的函数中获取
     *           例如我在A组件中调用了B组件，那么我只能获取A组件的画布，而不能获取B组件的画布
     */
    onMounted(fn: OnMountedFunction) {
        this.onMountedFn = fn;
        return this;
    }

    /**
     * 完全设置setup执行函数，接收props, slots，并返回一个函数，函数返回VNode，可以不设置
     */
    setup(fn: SetupFunction) {
        this.setupFn = fn;
        return this;
    }

    /**
     * 完全设置setup返回的函数，可以不设置
     * @param fn setup返回的函数
     */
    ret(fn: RetFunction) {
        this.retFn = fn;
        return this;
    }

    /**
     * 将这个MComponent实例导出成为一个组件
     */
    export() {
        if (!this.setupFn) {
            return defineComponent(
                (props, ctx) => {
                    const mountNum = MComponent.mountNum++;
                    this.onSetupFn?.(props, ctx);

                    onMounted(() => {
                        this.onMountedFn?.(
                            props,
                            ctx,
                            Array.from(
                                document.getElementsByClassName(
                                    `--mota-component-canvas-${mountNum}`
                                ) as HTMLCollectionOf<HTMLCanvasElement>
                            )
                        );
                    });

                    if (this.retFn) return () => this.retFn!(props, ctx);
                    else {
                        return () => {
                            const vNodes = MComponent.vNode(
                                this.content,
                                mountNum
                            );
                            return vNodes;
                        };
                    }
                },
                {
                    emits: this.emitsDef,
                    props: this.propsDef
                }
            );
        } else {
            return defineComponent((props, ctx) => this.setupFn!(props, ctx));
        }
    }

    /**
     * 将单个渲染内容生成为一个单个的VNode
     * @param child 要生成的单个渲染内容
     * @param mount 组件生成时的挂载id，一般不需要填，用于画布获取
     */
    static vNodeS(child: MotaComponent, mount?: number) {
        return this.vNode([child], mount)[0];
    }

    /**
     * 将一个MComponent实例生成为一个VNode列表
     * @param mc 要生成VNode的组件
     * @param mount 组件生成时的挂载id，一般不需要填，用于画布获取
     */
    static vNodeM(mc: MComponent, mount?: number) {
        return this.vNode(mc.content, mount);
    }

    /**
     * 将一系列MComponent内容生成为一个VNode列表
     * @param children 要生成VNode的内容列表
     * @param mount 组件生成时的挂载id，一般不需要填，用于画布获取
     */
    static vNode(
        children: (MotaComponent | VForRenderer | VNode)[],
        mount?: number
    ) {
        const mountNum = mount ?? this.mountNum++;

        const res: VNode[] = [];
        const vifRes: Map<number, boolean> = new Map();
        children.forEach((v, i) => {
            if (isVNode(v)) {
                res.push(v);
                return;
            }
            if (v.type === '@v-for') {
                const node = v as VForRenderer;
                const items =
                    typeof node.items === 'function'
                        ? node.items()
                        : node.items;
                items.forEach((v, i) => {
                    res.push(node.map(v, i));
                });
            } else {
                const node = v as MotaComponent;
                if (node.velse && vifRes.get(i - 1)) {
                    vifRes.set(i, true);
                    return;
                }
                let vif = true;
                if (node.vif) {
                    vifRes.set(i, (vif = node.vif()));
                }
                if (!vif) return;
                const props = this.unwrapProps(node.props);
                if (v.type === 'component') {
                    if (!v.component && !v.dComponent) {
                        throw new Error(
                            `Using dynamic component must provide component property.`
                        );
                    }
                    if (v.dComponent) {
                        res.push(hVue(v.dComponent(), props, v.slots));
                    } else {
                        if (v.component instanceof MComponent) {
                            res.push(
                                ...MComponent.vNode(
                                    v.component.content,
                                    mountNum
                                )
                            );
                        } else {
                            res.push(hVue(v.component!, props, v.slots));
                        }
                    }
                } else if (v.type === 'text') {
                    res.push(
                        hVue(
                            'span',
                            typeof v.innerText === 'function'
                                ? v.innerText()
                                : v.innerText
                        )
                    );
                } else if (v.type === 'canvas') {
                    const cls = `--mota-component-canvas-${mountNum}`;
                    const mix = !!props.class ? cls + ' ' + props.class : cls;
                    props.class = mix;
                    res.push(hVue('canvas', props, node.slots));
                } else {
                    // 这个时候不可能会有插槽，只会有子内容，因此直接渲染子内容
                    const content = node.children;
                    const vn = this.vNode(
                        content
                            .map(v => (v instanceof MComponent ? v.content : v))
                            .flat(),
                        mountNum
                    );
                    res.push(hVue(v.type, props, vn));
                }
            }
        });
        return res;
    }

    /**
     * 获取props的真实值。因为传入渲染内容的props是一个函数，因此需要一层调用
     * @param props 要获取的props
     */
    static unwrapProps(props?: Record<string, () => any>): Record<string, any> {
        if (!props) return {};
        const res: Record<string, any> = {};
        for (const [key, value] of Object.entries(props)) {
            res[key] = value();
        }
        return res;
    }

    /**
     * 在渲染时给一个组件传递props。实际效果为在调用后并不会传递，当被传递的组件被渲染时，将会传递props。
     * @param component 要传递props的组件
     * @param props 要传递的props
     */
    static prop(component: Component, props: Record<string, any>) {
        return hVue(component, props);
    }
}

/**
 * 创建一个MComponent实例，由于该函数在创建ui时会频繁使用，因此使用m这个简单的名字作为函数名
 * @returns 一个新的MComponent实例
 */
export function m() {
    return new MComponent();
}

export namespace MCGenerator {
    export function h(
        type: string | Component | MComponent,
        children?: MComponentChildren,
        config: MotaComponentConfig = {}
    ): MotaComponent {
        if (typeof type === 'string') {
            return {
                type,
                children: ensureArray(children ?? []),
                props: config.props,
                innerText: config.innerText,
                slots: config.slots,
                vif: config.vif,
                velse: config.velse,
                component: config.component
            };
        } else {
            return {
                type: 'component',
                children: ensureArray(children ?? []),
                props: config.props,
                innerText: config.innerText,
                slots: config.slots,
                vif: config.vif,
                velse: config.velse,
                component: type
            };
        }
    }

    export function div(
        children?: MComponentChildren,
        config?: NonComponentConfig
    ): MotaComponent {
        return h('div', children, config);
    }

    export function span(
        children?: MComponentChildren,
        config?: NonComponentConfig
    ): MotaComponent {
        return h('span', children, config);
    }

    export function canvas(config?: NonComponentConfig): MotaComponent {
        return h('canvas', [], config);
    }

    export function text(
        text: string | (() => string),
        config: NonComponentConfig = {}
    ): MotaComponent {
        return h('text', [], { ...config, innerText: text });
    }

    export function com(
        component: Component | MComponent,
        config: Omit<MotaComponentConfig, 'innerText' | 'component'>
    ): MotaComponent {
        return h(component, [], config);
    }

    /**
     * 生成一个图标的VNode
     * @param id 图标的id
     * @param width 显示宽度，单位像素
     * @param height 显示高度，单位像素
     * @param noBoarder 显示的时候是否没有边框和背景
     */
    export function icon(
        id: AllIds,
        width?: number,
        height?: number,
        noBoarder?: number
    ): VNode {
        return hVue(BoxAnimate, { id, width, height, noBoarder });
    }

    export function vfor<T>(
        items: T[] | (() => T[]),
        map: (value: T, index: number) => VNode
    ): VForRenderer {
        return {
            type: '@v-for',
            items,
            map
        };
    }

    /**
     * 为一个常量创建为一个函数
     * @param value 要创建成函数的值
     */
    export function f<T>(value: T): () => T {
        return () => value;
    }
}
