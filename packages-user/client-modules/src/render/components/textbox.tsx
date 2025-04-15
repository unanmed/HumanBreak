import {
    ElementLocator,
    Font,
    Sprite,
    DefaultProps,
    Text,
    MotaOffscreenCanvas2D
} from '@motajs/render';
import {
    computed,
    defineComponent,
    nextTick,
    onMounted,
    onUnmounted,
    ref,
    shallowReactive,
    shallowRef,
    SlotsType,
    VNode,
    watch
} from 'vue';
import { logger } from '@motajs/common';
import { isNil } from 'lodash-es';
import { SetupComponentOptions } from './types';
import EventEmitter from 'eventemitter3';
import {
    ITextContentConfig,
    TextContentTyper,
    TyperRenderable,
    TextContentType,
    WordBreak,
    TextAlign
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
    /** 是否自适应高度，即组件内部计算 height 的值，而非指定，可与滚动条结合 */
    autoHeight?: boolean;
    /** 文字的最大宽度 */
    width: number;
}

export type TextContentEmits = {
    /**
     * 当打字机结束时触发
     */
    typeEnd: () => void;

    /**
     * 当打字机开始打字时触发
     */
    typeStart: () => void;

    /**
     * 当文字发生变动，组件内部重新计算文字高度时触发
     * @param height 更新后的高度
     */
    updateHeight: (height: number) => void;
};

export interface TextContentExpose {
    /**
     * 重新开始打字
     */
    retype(): void;

    /**
     * 立刻显示所有文字
     */
    showAll(): void;

    /**
     * 获取这段 TextContent 的总高度
     */
    getHeight(): number;
}

const textContentOptions = {
    props: [
        'breakChars',
        'font',
        'ignoreLineEnd',
        'ignoreLineStart',
        'interval',
        'keepLast',
        'lineHeight',
        'text',
        'textAlign',
        'wordBreak',
        'fill',
        'fillStyle',
        'strokeStyle',
        'strokeWidth',
        'stroke',
        'loc',
        'width',
        'autoHeight'
    ],
    emits: ['typeEnd', 'typeStart', 'updateHeight']
} satisfies SetupComponentOptions<
    TextContentProps,
    TextContentEmits,
    keyof TextContentEmits
>;

export const TextContent = defineComponent<
    TextContentProps,
    TextContentEmits,
    keyof TextContentEmits
>((props, { emit, expose }) => {
    const loc = ref<ElementLocator>(
        (props.loc?.slice() as ElementLocator) ?? []
    );

    if (props.width < 0) {
        logger.warn(41, String(props.width));
    }

    const typer = new TextContentTyper(props);
    let renderable: TyperRenderable[] = [];
    let needUpdate = false;

    const retype = () => {
        if (needUpdate) return;
        needUpdate = true;
        if (!spriteElement.value) {
            needUpdate = false;
        }
        renderable = [];

        spriteElement.value?.requestBeforeFrame(() => {
            typer.setConfig(props);
            typer.setText(props.text ?? '');
            typer.type();
            needUpdate = false;
            updateLoc();
        });
    };

    const showAll = () => {
        typer.typeAll();
    };

    watch(props, () => {
        typer.setConfig(props);
        retype();
    });

    const getHeight = () => {
        return typer.getHeight();
    };

    const updateLoc = () => {
        const height = getHeight();
        if (props.autoHeight) {
            const [x = 0, y = 0, width = 200, , ax = 0, ay = 0] = loc.value;
            loc.value = [x, y, width, height, ax, ay];
        }
        emit('updateHeight', height);
    };

    expose<TextContentExpose>({ retype, showAll, getHeight });

    const spriteElement = shallowRef<Sprite>();
    const renderContent = (canvas: MotaOffscreenCanvas2D) => {
        const ctx = canvas.ctx;
        ctx.textBaseline = 'top';
        renderable.forEach(v => {
            switch (v.type) {
                case TextContentType.Text: {
                    if (v.text.length === 0) return;
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
                    break;
                }
                case TextContentType.Icon: {
                    const { renderable: r, x: dx, y: dy, width, height } = v;
                    const render = r.render;
                    const [x, y, w, h] = render[0];
                    const icon = r.autotile ? r.image[0] : r.image;
                    ctx.drawImage(icon, x, y, w, h, dx, dy, width, height);
                    break;
                }
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

    onMounted(retype);

    return () => {
        return (
            <sprite
                loc={loc.value}
                ref={spriteElement}
                render={renderContent}
            ></sprite>
        );
    };
}, textContentOptions);

export interface TextboxProps extends TextContentProps, DefaultProps {
    /** 背景颜色 */
    backColor?: CanvasStyle;
    /** 背景 winskin */
    winskin?: ImageIds;
    /** 边框与文字间的距离，默认为8 */
    padding?: number;
    /** 标题 */
    title?: string;
    /** 标题字体 */
    titleFont?: Font;
    /** 标题填充样式 */
    titleFill?: CanvasStyle;
    /** 标题描边样式 */
    titleStroke?: CanvasStyle;
    /** 标题文字与边框间的距离，默认为4 */
    titlePadding?: number;
    /** 最大宽度 */
    width: number;
}

export interface TextboxExpose {
    /**
     * 显示这个文本框
     */
    show(): void;

    /**
     * 隐藏这个文本框
     */
    hide(): void;

    /**
     * 重新开始打字
     */
    retype(): void;

    /**
     * 立刻显示所有文字
     */
    showAll(): void;
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
        'padding',
        'titleFill',
        'titleStroke',
        'titleFont',
        'titlePadding',
        'id',
        'hidden',
        'title'
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
>((props, { slots, expose, emit }) => {
    const contentData = shallowReactive<TextContentProps>({ width: 200 });
    const data = shallowReactive<TextboxProps>({ width: 200 });

    const setContentData = () => {
        contentData.breakChars = props.breakChars ?? '';
        contentData.font = props.font ?? new Font();
        contentData.ignoreLineEnd = props.ignoreLineEnd ?? '';
        contentData.ignoreLineStart = props.ignoreLineStart ?? '';
        contentData.interval = props.interval ?? 0;
        contentData.keepLast = props.keepLast ?? false;
        contentData.lineHeight = props.lineHeight ?? 0;
        contentData.text = props.text ?? '';
        contentData.textAlign = props.textAlign ?? TextAlign.Left;
        contentData.wordBreak = props.wordBreak ?? WordBreak.Space;
        contentData.fill = props.fill ?? true;
        contentData.stroke = props.stroke ?? false;
        contentData.fillStyle = props.fillStyle ?? '#fff';
        contentData.strokeStyle = props.strokeStyle ?? '#000';
        contentData.strokeWidth = props.strokeWidth ?? 2;
        contentData.loc = props.loc;
        contentData.width = props.width;
    };

    const setTextboxData = () => {
        data.backColor = props.backColor ?? '#222';
        data.winskin = props.winskin;
        data.padding = props.padding ?? 8;
        data.titleFill = props.titleFill ?? 'gold';
        data.titleStroke = props.titleStroke ?? 'transparent';
        data.titleFont = props.titleFont ?? new Font('Verdana', 18);
        data.titlePadding = props.titlePadding ?? 8;
        data.width = props.width ?? props.loc?.[2] ?? 200;
        data.height = props.height ?? props.loc?.[3] ?? 200;
        data.title = props.title ?? '';
    };

    setContentData();
    setTextboxData();

    watch(props, () => {
        const needUpdateTitle = data.title !== props.title;
        setTextboxData();
        if (needUpdateTitle) {
            onSetText();
        }
    });

    const titleElement = ref<Text>();
    const content = ref<TextContentExpose>();
    const hidden = ref(props.hidden);
    /** 标题宽度 */
    const tw = ref(data.titlePadding! * 2);
    /** 标题高度 */
    const th = ref(data.titlePadding! * 2);
    const contentY = computed(() => {
        const height = th.value;
        return data.title ? height : 0;
    });
    const backHeight = computed(() => data.height! - contentY.value);
    const contentWidth = computed(() => data.width! - data.padding! * 2);
    const contentHeight = computed(
        () => data.height! - data.padding! * 2 - contentY.value
    );

    const onSetText = () => {
        nextTick(() => {
            titleElement.value?.requestBeforeFrame(() => {
                if (titleElement.value) {
                    const { width, height } = titleElement.value;
                    tw.value = width + data.padding! * 2;
                    th.value = height + data.padding! * 2;
                }
            });
        });
    };

    // ----- store

    /** 结束打字机 */
    const storeEmits: TextboxStoreEmits = {
        endType() {
            content.value?.showAll();
        },
        hide() {
            hidden.value = true;
        },
        show() {
            hidden.value = false;
        },
        update(value) {
            if (data.title !== value.title) {
                data.title = value.title;
                onSetText();
            }
        },
        setText(text) {
            if (contentData.text === text) {
                content.value?.retype();
            } else {
                contentData.text = text;
            }
        }
    };

    const store = TextboxStore.use(
        props.id ?? getNextTextboxId(),
        contentData,
        storeEmits
    );

    const onTypeStart = () => {
        store.emitTypeStart();
        emit('typeStart');
    };

    const onTypeEnd = () => {
        store.emitTypeEnd();
        emit('typeEnd');
    };

    expose<TextboxExpose>({
        show() {
            hidden.value = false;
        },
        hide() {
            hidden.value = true;
        },
        retype() {
            content.value?.retype();
        },
        showAll() {
            content.value?.showAll();
        }
    });

    return () => (
        <container
            id={props.id}
            hidden={hidden.value}
            alpha={data.alpha}
            loc={props.loc}
        >
            {data.title && (
                <container zIndex={10} loc={[0, 0, tw.value, th.value]}>
                    {slots.title ? (
                        slots.title(data)
                    ) : props.winskin ? (
                        <winskin
                            image={props.winskin}
                            loc={[0, 0, tw.value, th.value]}
                        ></winskin>
                    ) : (
                        <g-rect loc={[0, 0, tw.value, th.value]}></g-rect>
                    )}
                    <text
                        ref={titleElement}
                        text={data.title}
                        loc={[data.titlePadding, data.titlePadding]}
                        fillStyle={data.titleFill}
                        strokeStyle={data.titleStroke}
                        font={data.titleFont}
                    ></text>
                </container>
            )}
            {slots.default ? (
                slots.default(data)
            ) : props.winskin ? (
                <winskin
                    image={props.winskin}
                    loc={[0, contentY.value, data.width!, backHeight.value]}
                ></winskin>
            ) : (
                <g-rect
                    loc={[0, contentY.value, data.width!, backHeight.value]}
                    fill
                    fillStyle={data.backColor}
                ></g-rect>
            )}
            <TextContent
                {...contentData}
                ref={content}
                x={data.padding!}
                y={contentY.value + data.padding!}
                width={contentWidth.value}
                height={contentHeight.value}
                onTypeEnd={onTypeEnd}
                onTypeStart={onTypeStart}
            ></TextContent>
        </container>
    );
}, textboxOptions);

interface TextboxStoreEmits {
    endType: () => void;
    hide: () => void;
    show: () => void;
    update: (value: TextboxProps) => void;
    setText: (text: string) => void;
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
        this.emits.update(this.data);
        this.emit('update', this.data);
    }

    /**
     * 设置显示的文本
     * @param text 要显示的文本
     */
    setText(text: string) {
        this.emits.setText(text);
    }

    /**
     * 显示文本框
     */
    show() {
        this.emits.show();
    }

    /**
     * 隐藏文本框
     */
    hide() {
        this.emits.hide();
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
