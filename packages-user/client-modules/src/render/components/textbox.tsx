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
import EventEmitter from 'eventemitter3';
import {
    ITextContentConfig,
    TextContentTyper,
    TyperRenderable,
    TextContentType,
    WordBreak,
    TextAlign
} from './textboxTyper';
import { SetupComponentOptions } from '@motajs/system-ui';
import { texture } from '../elements';

//#region TextContent

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
    const loc = shallowRef<ElementLocator>(
        (props.loc?.slice() as ElementLocator) ?? []
    );

    if (props.width < 0) {
        logger.warn(41, String(props.width));
    }

    const typer = new TextContentTyper(props);
    let renderable: TyperRenderable[] = [];
    let needUpdate = false;

    const retype = () => {
        if (needUpdate || props.hidden) return;
        needUpdate = true;
        if (!spriteElement.value) {
            needUpdate = false;
        }
        renderable = [];

        typer.setConfig(props);
        typer.setText(props.text ?? '');
        typer.type();
        needUpdate = false;
        updateLoc();
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
            const [x = 0, y = 0, width = props.width, , ax = 0, ay = 0] =
                loc.value;
            loc.value = [x, y, width, height, ax, ay];
        }
        emit('updateHeight', height);
    };

    expose<TextContentExpose>({ retype, showAll, getHeight });

    const spriteElement = shallowRef<Sprite>();
    const renderContent = (canvas: MotaOffscreenCanvas2D) => {
        const ctx = canvas.ctx;
        ctx.textBaseline = 'top';
        ctx.lineWidth = props.strokeWidth ?? 2;
        ctx.lineJoin = 'round';
        for (const data of renderable) {
            if (data.cut) break;
            switch (data.type) {
                case TextContentType.Text: {
                    if (data.text.length === 0) continue;
                    ctx.fillStyle = data.fillStyle;
                    ctx.strokeStyle = data.strokeStyle;
                    ctx.font = data.font;

                    const text = data.text.slice(0, data.pointer);

                    if (props.stroke) {
                        ctx.strokeText(text, data.x, data.y);
                    }
                    if (props.fill ?? true) {
                        ctx.fillText(text, data.x, data.y);
                    }
                    break;
                }
                case TextContentType.Icon: {
                    const { renderable: r, x: dx, y: dy, width, height } = data;
                    const render = r.render;
                    const [x, y, w, h] = render[0];
                    const icon = r.autotile ? r.image[0] : r.image;
                    ctx.drawImage(icon, x, y, w, h, dx, dy, width, height);
                    break;
                }
            }
        }
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

//#region Textbox

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
    /** 图标 */
    icon?: AllIdsWithNone;
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
    const data = shallowReactive<TextboxProps>({ width: 200 });

    const setTextboxData = () => {
        // Textbox
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
        data.icon = props.icon;

        // TextContent
        data.breakChars = props.breakChars ?? '';
        data.font = props.font ?? new Font();
        data.ignoreLineEnd = props.ignoreLineEnd ?? '';
        data.ignoreLineStart = props.ignoreLineStart ?? '';
        data.interval = props.interval ?? 0;
        data.keepLast = props.keepLast ?? false;
        data.lineHeight = props.lineHeight ?? 0;
        data.text = props.text ?? '';
        data.textAlign = props.textAlign ?? TextAlign.Left;
        data.wordBreak = props.wordBreak ?? WordBreak.Space;
        data.fill = props.fill ?? true;
        data.stroke = props.stroke ?? false;
        data.fillStyle = props.fillStyle ?? '#fff';
        data.strokeStyle = props.strokeStyle ?? '#000';
        data.strokeWidth = props.strokeWidth ?? 2;
        data.loc = props.loc;
        data.width = props.width;
    };

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
    const contentX = computed(() => {
        if (hasIcon.value) {
            return data.padding! + 40;
        } else {
            return data.padding!;
        }
    });
    const contentY = computed(() => {
        const height = th.value;
        return data.title ? height : 0;
    });
    const backHeight = computed(() => data.height! - contentY.value);
    const contentWidth = computed(() => {
        if (hasIcon.value) {
            return data.width! - data.padding! * 2 - 40;
        } else {
            return data.width! - data.padding! * 2;
        }
    });
    const contentHeight = computed(
        () => data.height! - data.padding! * 2 - contentY.value
    );
    const iconLoc = computed<ElementLocator>(() => {
        const y = contentY.value;
        const pad = data.padding!;
        const icon = data.icon;
        if (isNil(icon) || icon === 'none') {
            return [];
        } else {
            const num = texture.idNumberMap[icon];
            const renderable = texture.getRenderable(num);
            if (!renderable) return [];
            const [, , w, h] = renderable.render[0];
            return [pad, pad + y, w, h];
        }
    });
    const hasIcon = computed(() => {
        return !isNil(data.icon) && data.icon !== 'none';
    });

    const onSetText = () => {
        nextTick(() => {
            titleElement.value?.requestBeforeFrame(() => {
                if (titleElement.value) {
                    const { width, height } = titleElement.value;
                    tw.value = width + data.titlePadding! * 2;
                    th.value = height + data.titlePadding! * 2;
                }
            });
        });
    };

    //#region store

    let lastTitle = data.title;

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
            if (value.title !== lastTitle) {
                onSetText();
                lastTitle = value.title;
            }
        },
        setText(text) {
            if (data.text === text) {
                content.value?.retype();
            } else {
                data.text = text;
            }
        }
    };

    const store = TextboxStore.use(
        props.id ?? getNextTextboxId(),
        data,
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
            loc={data.loc}
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
                        strokeWidth={2}
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
            {hasIcon.value && (
                <icon icon={data.icon as AllIds} loc={iconLoc.value} animate />
            )}
            {hasIcon.value && (
                <g-rect
                    loc={iconLoc.value}
                    strokeStyle="gold"
                    fillStyle="#222"
                    lineWidth={2}
                    fill
                    stroke
                />
            )}
            <TextContent
                {...data}
                ref={content}
                x={contentX.value}
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
    /** 结束打字机动画的回调函数 */
    endType: () => void;
    /** 隐藏文本框的回调函数 */
    hide: () => void;
    /** 显示文本框的回调函数 */
    show: () => void;
    /** 更新文本框配置的回调函数 */
    update: (value: TextboxProps) => void;
    /** 设置显示文本的回调函数 */
    setText: (text: string) => void;
}

interface TextboxStoreEvent {
    /** 文本框配置更新事件，传递更新后的配置值 */
    update: [value: TextboxProps];
    /** 文本框显示事件 */
    show: [];
    /** 文本框隐藏事件 */
    hide: [];
    /** 打字机开始打字事件 */
    typeStart: [];
    /** 打字机结束打字事件 */
    typeEnd: [];
}

export class TextboxStore extends EventEmitter<TextboxStoreEvent> {
    static list: Map<string, TextboxStore> = new Map();

    typing: boolean = false;

    private constructor(
        public readonly data: TextboxProps,
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
