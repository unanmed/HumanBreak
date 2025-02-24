import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import {
    computed,
    defineComponent,
    onUnmounted,
    onUpdated,
    ref,
    shallowReactive,
    shallowRef,
    SlotsType,
    VNode,
    watch
} from 'vue';
import { logger } from '@/core/common/logger';
import { Sprite } from '@/core/render/sprite';
import { ContainerProps, DefaultProps } from '@/core/render/renderer';
import { isNil } from 'lodash-es';
import { SetupComponentOptions } from './types';
import EventEmitter from 'eventemitter3';
import { Text } from '@/core/render/preset';
import {
    ITextContentConfig,
    TextContentTyper,
    TyperRenderable,
    TextContentType
} from './textboxTyper';

export interface TextContentProps
    extends DefaultProps,
        Partial<ITextContentConfig> {
    /** 显示的文字 */
    text?: string;
    /** 是否填充 */
    fill?: boolean;
    /** 是否描边 */
    stroke?: boolean;
    /** 是否忽略打字机，直接显伤全部 */
    showAll?: boolean;
}

export type TextContentEmits = {
    typeEnd: () => void;
    typeStart: () => void;
};

const textContentOptions = {
    props: [
        'breakChars',
        'fontFamily',
        'fontSize',
        'fontWeight',
        'fontItalic',
        'height',
        'ignoreLineEnd',
        'ignoreLineStart',
        'interval',
        'keepLast',
        'lineHeight',
        'text',
        'textAlign',
        'width',
        'wordBreak',
        'x',
        'y',
        'fill',
        'fillStyle',
        'strokeStyle',
        'strokeWidth',
        'stroke',
        'showAll',
        'loc'
    ],
    emits: ['typeEnd', 'typeStart']
} satisfies SetupComponentOptions<
    TextContentProps,
    TextContentEmits,
    keyof TextContentEmits
>;

export const TextContent = defineComponent<
    TextContentProps,
    TextContentEmits,
    keyof TextContentEmits
>((props, { emit }) => {
    if (props.width && props.width <= 0) {
        logger.warn(41, String(props.width));
    }

    const typer = new TextContentTyper(props);
    let renderable: TyperRenderable[] = [];
    let needUpdate = false;
    let nowText = '';

    watch(props, value => {
        typer.setConfig(value);
    });

    const retype = () => {
        if (props.showAll) {
            typer.typeAll();
        }
        if (props.text === nowText) return;
        if (needUpdate) return;
        needUpdate = true;
        if (!spriteElement.value) {
            needUpdate = false;
        }
        nowText = props.text ?? '';
        renderable = [];

        spriteElement.value?.requestBeforeFrame(() => {
            typer.setConfig(props);
            typer.setText(props.text ?? '');
            typer.type();
            if (props.showAll) {
                typer.typeAll();
            }
            needUpdate = false;
        });
    };

    onUpdated(retype);

    const spriteElement = shallowRef<Sprite>();
    const renderContent = (canvas: MotaOffscreenCanvas2D) => {
        const ctx = canvas.ctx;
        ctx.textBaseline = 'top';
        renderable.forEach(v => {
            if (v.type === TextContentType.Text) {
                ctx.fillStyle = v.fillStyle;
                ctx.strokeStyle = v.strokeStyle;
                ctx.font = v.font;
                const text = v.text.slice(0, v.pointer);

                if (props.fill ?? true) {
                    ctx.fillText(text, v.x, v.y);
                }
                if (props.stroke) {
                    ctx.strokeText(text, v.x, v.y);
                }
            } else {
                const r = v.renderable;
                const render = r.render;
                const [x, y, w, h] = render[0];
                const icon = r.autotile ? r.image[0] : r.image;
                ctx.drawImage(icon, x, y, w, h, v.x, v.y, v.width, v.height);
            }
        });
    };

    const renderFunc = (data: TyperRenderable[]) => {
        renderable = data;
        spriteElement.value?.update();
    };

    typer.setRender(renderFunc);
    typer.on('typeStart', () => {
        emit('typeStart');
    });
    typer.on('typeEnd', () => {
        emit('typeEnd');
    });

    return () => {
        return (
            <sprite
                {...props}
                ref={spriteElement}
                x={props.x}
                y={props.y}
                width={props.width}
                height={props.height}
                render={renderContent}
            ></sprite>
        );
    };
}, textContentOptions);

export interface TextboxProps extends TextContentProps, ContainerProps {
    /** 背景颜色 */
    backColor?: CanvasStyle;
    /** 背景 winskin */
    winskin?: ImageIds;
    /** 边框与文字间的距离，默认为8 */
    padding?: number;
    /** 标题 */
    title?: string;
    /** 标题字体 */
    titleFont?: string;
    /** 标题填充样式 */
    titleFill?: CanvasStyle;
    /** 标题描边样式 */
    titleStroke?: CanvasStyle;
    /** 标题文字与边框间的距离，默认为4 */
    titlePadding?: number;
}

type TextboxEmits = TextContentEmits;
type TextboxSlots = SlotsType<{
    default: (data: TextboxProps) => VNode[];
    title: (data: TextboxProps) => VNode[];
}>;

const textboxOptions = {
    props: (textContentOptions.props as (keyof TextboxProps)[]).concat([
        'backColor',
        'winskin',
        'id',
        'padding',
        'alpha',
        'hidden',
        'anchorX',
        'anchorY',
        'antiAliasing',
        'cache',
        'composite',
        'fall',
        'hd',
        'transform',
        'type',
        'zIndex',
        'titleFill',
        'titleStroke',
        'titleFont'
    ]),
    emits: textContentOptions.emits
} satisfies SetupComponentOptions<TextboxProps, {}, string, TextboxSlots>;

let id = 0;
function getNextTextboxId() {
    return `@default-textbox-${id++}`;
}

export const Textbox = defineComponent<
    TextboxProps,
    TextboxEmits,
    keyof TextboxEmits,
    TextboxSlots
>((props, { slots }) => {
    const data = shallowReactive({ ...props });
    data.padding ??= 8;
    data.width ??= 200;
    data.height ??= 200;
    data.id ??= '';
    data.alpha ??= 1;
    data.titleFill ??= '#000';
    data.titleStroke ??= 'transparent';
    data.titleFont ??= '16px Verdana';
    data.titlePadding ??= 4;

    const titleElement = ref<Text>();
    const titleWidth = ref(data.titlePadding * 2);
    const titleHeight = ref(data.titlePadding * 2);
    const contentY = computed(() => {
        const height = titleHeight.value;
        return data.title ? height : 0;
    });
    const contentWidth = computed(() => data.width! - data.padding! * 2);
    const contentHeight = computed(
        () => data.height! - data.padding! * 2 - contentY.value
    );

    const calTitleSize = (text: string) => {
        if (!titleElement.value) return;
        const { width, height } = titleElement.value;
        titleWidth.value = width + data.titlePadding! * 2;
        titleHeight.value = height + data.titlePadding! * 2;
        data.title = text;
    };

    watch(titleElement, (value, old) => {
        old?.off('setText', calTitleSize);
        value?.on('setText', calTitleSize);
        if (value) calTitleSize(value?.text);
    });

    onUnmounted(() => {
        titleElement.value?.off('setText', calTitleSize);
    });

    // ----- store

    /** 结束打字机 */
    const storeEmits: TextboxStoreEmits = {
        endType() {
            data.showAll = true;
        }
    };

    const store = TextboxStore.use(
        props.id ?? getNextTextboxId(),
        data,
        storeEmits
    );
    const hidden = ref(data.hidden);
    store.on('hide', () => (hidden.value = true));
    store.on('show', () => (hidden.value = false));
    store.on('update', value => {
        if (value.title) {
            titleElement.value?.requestBeforeFrame(() => {
                const { width, height } = titleElement.value!;
                titleWidth.value = width + data.padding! * 2;
                titleHeight.value = height + data.padding! * 2;
            });
        }
    });

    const onTypeStart = () => {
        store.emitTypeStart();
    };

    const onTypeEnd = () => {
        data.showAll = false;
        store.emitTypeEnd();
    };

    return () => {
        return (
            <container {...data} hidden={hidden.value} alpha={data.alpha}>
                {data.title ? (
                    <container
                        zIndex={10}
                        width={titleWidth.value}
                        height={titleHeight.value}
                    >
                        {slots.title ? (
                            slots.title(data)
                        ) : props.winskin ? (
                            <winskin image={props.winskin}></winskin>
                        ) : (
                            <g-rect
                                x={0}
                                y={0}
                                width={titleWidth.value}
                                height={titleHeight.value}
                                fillStyle={data.backColor}
                            ></g-rect>
                        )}
                        <text
                            ref={titleElement}
                            text={data.title}
                            x={data.titlePadding}
                            y={data.titlePadding}
                            fillStyle={data.titleFill}
                            strokeStyle={data.titleStroke}
                            font={data.titleFont}
                        ></text>
                    </container>
                ) : (
                    ''
                )}
                {slots.default ? (
                    slots.default(data)
                ) : props.winskin ? (
                    <winskin image={props.winskin}></winskin>
                ) : (
                    <g-rect
                        x={0}
                        y={contentY.value}
                        width={data.width ?? 200}
                        height={(data.height ?? 200) - contentY.value}
                        fill
                        fillStyle={data.backColor}
                    ></g-rect>
                )}
                <TextContent
                    {...data}
                    id=""
                    hidden={false}
                    x={data.padding!}
                    y={contentY.value + data.padding!}
                    width={contentWidth.value}
                    height={contentHeight.value}
                    onTypeEnd={onTypeEnd}
                    onTypeStart={onTypeStart}
                    zIndex={0}
                    showAll={data.showAll}
                ></TextContent>
            </container>
        );
    };
}, textboxOptions);

interface TextboxStoreEmits {
    endType: () => void;
}

interface TextboxStoreEvent {
    update: [value: TextboxProps];
    show: [];
    hide: [];
    typeStart: [];
    typeEnd: [];
}

export class TextboxStore extends EventEmitter<TextboxStoreEvent> {
    static list: Map<string, TextboxStore> = new Map();

    typing: boolean = false;

    private constructor(
        private readonly data: TextboxProps,
        private readonly emits: TextboxStoreEmits
    ) {
        super();
    }

    /**
     * 开始打字，由组件调用，而非组件外调用
     */
    emitTypeStart() {
        this.typing = true;
        this.emit('typeStart');
    }

    /**
     * 结束打字，由组件调用，而非组件外调用
     */
    emitTypeEnd() {
        this.typing = false;
        this.emit('typeEnd');
    }

    /**
     * 结束打字机的打字
     */
    endType() {
        this.emits.endType();
    }

    /**
     * 修改渲染数据
     */
    modify(data: Partial<TextboxProps>) {
        for (const [key, value] of Object.entries(data)) {
            // @ts-expect-error 无法推导
            if (!isNil(value)) this.data[key] = value;
        }
        this.emit('update', this.data);
    }

    /**
     * 显示文本框
     */
    show() {
        this.emit('show');
    }

    /**
     * 隐藏文本框
     */
    hide() {
        this.emit('hide');
    }

    /**
     * 获取文本框
     * @param id 文本框id
     */
    static get(id: string): TextboxStore | undefined {
        return this.list.get(id);
    }

    /**
     * 在当前作用域下生成文本框控制器
     * @param id 文本框id
     * @param props 文本框渲染数据
     */
    static use(id: string, props: TextboxProps, emits: TextboxStoreEmits) {
        const store = new TextboxStore(props, emits);
        if (this.list.has(id)) {
            logger.warn(42, id);
        }
        this.list.set(id, store);
        onUnmounted(() => {
            this.list.delete(id);
        });
        return store;
    }
}
