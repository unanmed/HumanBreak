import { DefaultProps, ElementLocator, Font } from '@motajs/render';
import { computed, defineComponent, reactive, ref } from 'vue';
import { Background, Selection } from './misc';
import { TextContent, TextContentProps } from './textbox';
import { TextAlign } from './textboxTyper';
import { Page, PageExpose } from './page';
import { GameUI, IUIMountable, SetupComponentOptions } from '@motajs/system-ui';
import { useKey } from '../use';
import { sleep } from 'mutate-animate';

export interface ConfirmBoxProps extends DefaultProps, TextContentProps {
    /** 确认框的提示文本内容 */
    text: string;
    /** 确认框对话框的宽度 */
    width: number;
    /** 确认框对话框的位置 */
    loc: ElementLocator;
    /** 确认/取消按钮的字体样式 */
    selFont?: Font;
    /** 确认/取消按钮的文本颜色 */
    selFill?: CanvasStyle;
    /** 对话框内部所有元素的内边距 */
    pad?: number;
    /** 确认按钮的显示文本，默认为"确认" */
    yesText?: string;
    /** 取消按钮的显示文本，默认为"取消" */
    noText?: string;
    /** 窗口皮肤图片ID，用于对话框背景绘制 */
    winskin?: ImageIds;
    /** 是否默认选中确认按钮 */
    defaultYes?: boolean;
    /** 对话框背景颜色，当未设置 winskin 时生效 */
    color?: CanvasStyle;
    /** 对话框边框颜色，当未设置 winskin 时生效 */
    border?: CanvasStyle;
    /** 按键作用域，如果需要同作用域按键，那么需要传入 */
    scope?: symbol;
}

export type ConfirmBoxEmits = {
    yes: () => void;
    no: () => void;
};

const confirmBoxProps = {
    props: [
        'text',
        'width',
        'loc',
        'selFont',
        'selFill',
        'pad',
        'yesText',
        'noText',
        'winskin',
        'defaultYes',
        'color',
        'border',
        'scope'
    ],
    emits: ['no', 'yes']
} satisfies SetupComponentOptions<
    ConfirmBoxProps,
    ConfirmBoxEmits,
    keyof ConfirmBoxEmits
>;

/**
 * 确认框组件，与 2.x 的 drawConfirm 类似，可以键盘操作，单次调用参考 {@link getConfirm}。
 * 参数参考 {@link ConfirmBoxProps}，事件参考 {@link ConfirmBoxEmits}，用例如下：
 * ```tsx
 * const onYes = () => console.log('yes');
 * const onNo = () => console.log('no');
 *
 * <ConfirmBox
 *   text="是否要返回标题界面"
 *   width={240}
 *   // 确认框会自动计算宽度和高度，因此不需要手动指定，即使手动指定也无效
 *   loc={[240, 240, void 0, void 0, 0.5, 0.5]}
 *   // 使用 winskin 图片作为背景
 *   winskin="winskin.png"
 *   // 使用颜色作为背景和边框，如果设置了 winskin，那么此参数无效
 *   color="#333"
 *   border="gold"
 *   // 设置选项的字体
 *   selFont={new Font('Verdana', 16)}
 *   // 设置选项的文本颜色
 *   selFill="#d48"
 *   // 完全继承 TextContent 的参数，因此可以填写 font 参数指定文本字体
 *   font={new Font('arial')}
 *   onYes={onYes}
 *   onNo={onNo}
 * />
 * ```
 */
export const ConfirmBox = defineComponent<
    ConfirmBoxProps,
    ConfirmBoxEmits,
    keyof ConfirmBoxEmits
>((props, { emit, attrs }) => {
    const height = ref(200);
    const selected = ref(props.defaultYes ? true : false);
    const yesSize = ref<[number, number]>([0, 0]);
    const noSize = ref<[number, number]>([0, 0]);

    const loc = computed<ElementLocator>(() => {
        const [x = 0, y = 0, , , ax = 0, ay = 0] = props.loc;
        return [x, y, props.width, height.value, ax, ay];
    });
    const yesText = computed(() => props.yesText ?? '确认');
    const noText = computed(() => props.noText ?? '取消');
    const pad = computed(() => props.pad ?? 24);
    const yesLoc = computed<ElementLocator>(() => {
        const y = height.value - pad.value;
        return [props.width / 3, y, void 0, void 0, 0.5, 1];
    });
    const noLoc = computed<ElementLocator>(() => {
        const y = height.value - pad.value;
        return [(props.width / 3) * 2, y, void 0, void 0, 0.5, 1];
    });
    const contentLoc = computed<ElementLocator>(() => {
        const width = props.width - pad.value * 2;
        return [props.width / 2, pad.value, width, 0, 0.5, 0];
    });
    const selectLoc = computed<ElementLocator>(() => {
        if (selected.value) {
            const [x = 0, y = 0] = yesLoc.value;
            const [width, height] = yesSize.value;
            return [x, y + 4, width + 8, height + 8, 0.5, 1];
        } else {
            const [x = 0, y = 0] = noLoc.value;
            const [width, height] = noSize.value;
            return [x, y + 4, width + 8, height + 8, 0.5, 1];
        }
    });

    const onUpdateHeight = (textHeight: number) => {
        height.value = textHeight + pad.value * 4;
    };

    const setYes = (_: string, width: number, height: number) => {
        yesSize.value = [width, height];
    };

    const setNo = (_: string, width: number, height: number) => {
        noSize.value = [width, height];
    };

    const [key] = useKey(false, props.scope);
    key.realize('confirm', () => {
        if (selected.value) emit('yes');
        else emit('no');
    });
    key.realize('moveLeft', () => void (selected.value = true));
    key.realize('moveRight', () => void (selected.value = false));

    return () => (
        <container loc={loc.value}>
            <Background
                loc={[0, 0, props.width, height.value]}
                winskin={props.winskin}
                color={props.color ?? '#333'}
                border={props.border}
                zIndex={0}
            />
            <TextContent
                {...attrs}
                loc={contentLoc.value}
                text={props.text}
                width={props.width - pad.value * 2}
                zIndex={5}
                textAlign={TextAlign.Center}
                autoHeight
                onUpdateHeight={onUpdateHeight}
            />
            <Selection
                loc={selectLoc.value}
                winskin={props.winskin}
                border={props.border}
                noevent
                zIndex={10}
            />
            <text
                loc={yesLoc.value}
                text={yesText.value}
                fillStyle={props.selFill}
                font={props.selFont}
                cursor="pointer"
                zIndex={15}
                onClick={() => emit('yes')}
                onEnter={() => (selected.value = true)}
                onSetText={setYes}
            />
            <text
                loc={noLoc.value}
                text={noText.value}
                fillStyle={props.selFill}
                font={props.selFont}
                cursor="pointer"
                zIndex={15}
                onClick={() => emit('no')}
                onEnter={() => (selected.value = false)}
                onSetText={setNo}
            />
        </container>
    );
}, confirmBoxProps);

export type ChoiceKey = string | number;
export type ChoiceItem<T extends ChoiceKey = ChoiceKey> = [
    key: T,
    text: string
];

export interface ChoicesProps extends DefaultProps, TextContentProps {
    /** 选项数组 */
    choices: ChoiceItem[];
    /** 选择框对话框的位置 */
    loc: ElementLocator;
    /** 选择框对话框的宽度 */
    width: number;
    /** 选择框的最大高度，超过时将分页显示 */
    maxHeight?: number;
    /** 选择框的提示文本内容 */
    text?: string;
    /** 选择框的标题文本 */
    title?: string;
    /** 窗口皮肤图片ID，用于对话框背景绘制 */
    winskin?: ImageIds;
    /** 对话框背景颜色，当未设置 winskin 时生效 */
    color?: CanvasStyle;
    /** 对话框边框颜色，当未设置 winskin 时生效 */
    border?: CanvasStyle;
    /** 选项文本的字体样式 */
    selFont?: Font;
    /** 选项文本的颜色 */
    selFill?: CanvasStyle;
    /** 标题文本的字体样式 */
    titleFont?: Font;
    /** 标题文本的颜色 */
    titleFill?: CanvasStyle;
    /** 对话框内部所有元素的内边距 */
    pad?: number;
    /** 选项之间的垂直间隔 */
    interval?: number;
    /** 默认选中的选项索引 */
    selected?: number;
    /** 按键作用域，如果需要同作用域按键，那么需要传入，例如系统设置 UI */
    scope?: symbol;
}

export type ChoicesEmits = {
    choose: (key: ChoiceKey) => void;
};

const choicesProps = {
    props: [
        'choices',
        'loc',
        'width',
        'maxHeight',
        'text',
        'title',
        'winskin',
        'color',
        'border',
        'selFont',
        'selFill',
        'titleFont',
        'titleFill',
        'pad',
        'interval',
        'selected',
        'scope'
    ],
    emits: ['choose']
} satisfies SetupComponentOptions<
    ChoicesProps,
    ChoicesEmits,
    keyof ChoicesEmits
>;

/**
 * 选项框组件，用于在多个选项中选择一个，例如样板的系统设置就由它实现。单次调用参考 {@link getChoice}。
 * 参数参考 {@link ChoicesProps}，事件参考 {@link ChoicesEmits}。用例如下：
 * ```tsx
 * <Choices
 *   // 选项数组，每一项是一个二元素数组，第一项表示这个选项的 id，在选中时会以此作为参数传递给事件
 *   // 第二项表示这一项的内容，即展示给玩家看的内容
 *   choices={[[0, '选项1'], [100, '选项2']]}
 *   // 选项框会自动计算宽度和高度，因此不需要手动指定，即使手动指定也无效
 *   loc={[240, 240, void 0, void 0, 0.5, 0.5]}
 *   text="请选择一项"
 *   title="选项"
 *   // 使用 winskin 图片作为背景
 *   winskin="winskin.png"
 *   // 使用颜色作为背景和边框，如果设置了 winskin，那么此参数无效
 *   color="#333"
 *   border="gold"
 *   // 调整每两个选项之间的间隔
 *   interval={12}
 *   // 设置选项的字体
 *   selFont={new Font('Verdana', 16)}
 *   // 设置选项的文本颜色
 *   selFill="#d48"
 *   // 设置标题的字体
 *   titleFont={new Font('Verdana', 16)}
 *   // 设置标题的文本颜色
 *   selFill="gold"
 *   // 完全继承 TextContent 的参数，因此可以填写 font 参数指定文本字体
 *   font={new Font('arial')}
 *   // 当选择某一项时触发
 *   onChoice={(choice) => console.log(choice)}
 * />
 * ```
 */
export const Choices = defineComponent<
    ChoicesProps,
    ChoicesEmits,
    keyof ChoicesEmits
>((props, { emit, attrs }) => {
    const titleHeight = ref(0);
    const contentHeight = ref(0);
    const selected = ref(props.selected ?? 0);
    const pageCom = ref<PageExpose>();
    const choiceSize = reactive<[number, number][]>([]);

    const selFont = computed(() => props.selFont ?? new Font());
    const maxHeight = computed(() => props.maxHeight ?? 360);
    const pad = computed(() => props.pad ?? 28);
    const choiceInterval = computed(() => props.interval ?? 16);
    const hasText = computed(() => !!props.text);
    const hasTitle = computed(() => !!props.title);
    const contentWidth = computed(() => props.width - pad.value * 2);
    const choiceHeight = computed(
        () => selFont.value.size + 8 + choiceInterval.value
    );
    const contentY = computed(() => {
        if (hasTitle.value) {
            return pad.value * 2 + titleHeight.value;
        } else {
            return pad.value;
        }
    });
    const choicesY = computed(() => {
        const padding = pad.value;
        const text = hasText.value;
        let y = padding;
        if (hasTitle.value) {
            y += titleHeight.value;
            if (text) {
                y += padding / 2;
            } else {
                y += padding;
            }
        }
        if (text) {
            y += contentHeight.value;
            y += padding / 2;
        }
        return y;
    });
    const choicesMaxHeight = computed(
        () =>
            maxHeight.value -
            choicesY.value -
            pad.value * 2 -
            selFont.value.size -
            8
    );
    const choiceCountPerPage = computed(() =>
        Math.max(Math.floor(choicesMaxHeight.value / choiceHeight.value), 1)
    );
    const pages = computed(() =>
        Math.ceil(props.choices.length / choiceCountPerPage.value)
    );
    const choicesHeight = computed(() => {
        const padBottom = pages.value > 1 ? pad.value + selFont.value.size : 0;
        if (props.choices.length > choiceCountPerPage.value) {
            return choiceCountPerPage.value * choiceHeight.value + padBottom;
        } else {
            return props.choices.length * choiceHeight.value + padBottom;
        }
    });
    const boxHeight = computed(() => {
        if (props.choices.length > choiceCountPerPage.value) {
            return (
                choicesHeight.value +
                choicesY.value +
                // 不乘2是因为 choiceY 已经算上了顶部填充
                pad.value
            );
        } else {
            return (
                choicesHeight.value +
                choicesY.value +
                // 不乘2是因为 choiceY 已经算上了顶部填充
                pad.value
            );
        }
    });
    const boxLoc = computed<ElementLocator>(() => {
        const [x = 0, y = 0, , , ax = 0, ay = 0] = props.loc;
        return [x, y, props.width, boxHeight.value, ax, ay];
    });
    const titleLoc = computed<ElementLocator>(() => {
        return [props.width / 2, pad.value, void 0, void 0, 0.5, 0];
    });
    const contentLoc = computed<ElementLocator>(() => {
        return [
            props.width / 2,
            contentY.value,
            contentWidth.value,
            void 0,
            0.5,
            0
        ];
    });
    const choiceLoc = computed<ElementLocator>(() => {
        return [
            props.width / 2,
            choicesY.value,
            contentWidth.value,
            choicesHeight.value,
            0.5,
            0
        ];
    });
    const selectionLoc = computed<ElementLocator>(() => {
        const [width = 200, height = 200] = choiceSize[selected.value] ?? [];
        return [
            props.width / 2 - pad.value,
            (selected.value + 0.5) * choiceHeight.value,
            width + 8,
            height + 8,
            0.5,
            0.5
        ];
    });

    const getPageContent = (page: number) => {
        const count = choiceCountPerPage.value;
        return props.choices.slice(page * count, (page + 1) * count);
    };

    const getChoiceLoc = (index: number): ElementLocator => {
        return [
            props.width / 2 - pad.value,
            choiceHeight.value * (index + 0.5),
            void 0,
            void 0,
            0.5,
            0.5
        ];
    };

    const updateContentHeight = (height: number) => {
        contentHeight.value = height;
    };

    const updateTitleHeight = (_0: string, _1: number, height: number) => {
        titleHeight.value = height;
    };

    const updateChoiceSize = (index: number, width: number, height: number) => {
        choiceSize[index] = [width, height];
    };

    const onPageChange = () => {
        selected.value = 0;
    };

    const [key] = useKey(false, props.scope);
    key.realize('moveUp', () => {
        if (selected.value === 0) {
            if (pageCom.value?.now() !== 0) {
                pageCom.value?.movePage(-1);
                selected.value = choiceCountPerPage.value - 1;
            }
        } else {
            selected.value--;
        }
    });
    key.realize('moveDown', () => {
        const page = pageCom.value?.now() ?? 0;
        if (selected.value === choiceCountPerPage.value - 1) {
            if (page < pages.value - 1) {
                pageCom.value?.movePage(1);
                selected.value = 0;
            }
        } else {
            const index = page * choiceCountPerPage.value + selected.value;
            if (index < props.choices.length - 1) {
                selected.value++;
            }
        }
    });
    key.realize('moveLeft', () => pageCom.value?.movePage(-1));
    key.realize('moveRight', () => pageCom.value?.movePage(1));
    key.realize('confirm', () => {
        const page = pageCom.value?.now() ?? 0;
        const index = page * choiceCountPerPage.value + selected.value;
        emit('choose', props.choices[index][0]);
    });

    return () => (
        <container loc={boxLoc.value}>
            <Background
                loc={[0, 0, props.width, boxHeight.value]}
                winskin={props.winskin}
                color={props.color ?? '#333'}
                border={props.border}
            />
            <text
                hidden={!hasTitle.value}
                loc={titleLoc.value}
                text={props.title}
                font={props.titleFont ?? new Font(void 0, 18)}
                fillStyle={props.titleFill ?? 'gold'}
                zIndex={5}
                onSetText={updateTitleHeight}
            />
            <TextContent
                {...attrs}
                hidden={!hasText.value}
                text={props.text}
                loc={contentLoc.value}
                width={contentWidth.value}
                zIndex={5}
                autoHeight
                onUpdateHeight={updateContentHeight}
            />
            <Page
                ref={pageCom}
                loc={choiceLoc.value}
                pages={pages.value}
                font={props.selFont}
                hideIfSingle
                onPageChange={onPageChange}
            >
                {(page: number) => [
                    <Selection
                        loc={selectionLoc.value}
                        winskin={props.winskin}
                        color={props.color}
                        border={props.border}
                    />,
                    ...getPageContent(page).map((v, i) => {
                        return (
                            <text
                                text={v[1]}
                                loc={getChoiceLoc(i)}
                                font={props.selFont}
                                cursor="pointer"
                                zIndex={5}
                                fillStyle={props.selFill}
                                onClick={() => emit('choose', v[0])}
                                onSetText={(_, width, height) =>
                                    updateChoiceSize(i, width, height)
                                }
                                onEnter={() => (selected.value = i)}
                            />
                        );
                    })
                ]}
            </Page>
        </container>
    );
}, choicesProps);

/**
 * 弹出一个确认框，然后将确认结果返回，例如给玩家弹出一个确认框，并获取玩家是否确认：
 * ```ts
 * const confirm = await getConfirm(
 *   // 在哪个 UI 控制器上打开，对于一般 UI 组件来说，直接填写 props.controller 即可
 *   props.controller,
 *   // 确认内容
 *   '确认要 xxx 吗？',
 *   // 确认框的位置，宽度由下一个参数指定，高度参数由组件内部计算得出，指定无效
 *   [240, 240, void 0, void 0, 0.5, 0.5],
 *   // 宽度设为 240
 *   240,
 *   // 可以给选择框传入其他的 props，例如指定字体，此项可选
 *   { font: new Font('Verdana', 20) }
 * );
 * // 之后，就可以直接判断 confirm 来执行不同的操作了
 * if (confirm) { ... }
 * ```
 * @param controller UI 控制器
 * @param text 确认文本内容
 * @param loc 确认框的位置
 * @param width 确认框的宽度
 * @param props 额外的 props，参考 {@link ConfirmBoxProps}
 */
export function getConfirm(
    controller: IUIMountable,
    text: string,
    loc: ElementLocator,
    width: number,
    props?: Partial<ConfirmBoxProps>
) {
    return new Promise<boolean>(res => {
        const instance = controller.open(
            ConfirmBoxUI,
            {
                ...(props ?? {}),
                loc,
                text,
                width,
                onYes: () => {
                    controller.close(instance);
                    res(true);
                },
                onNo: () => {
                    controller.close(instance);
                    res(false);
                }
            },
            true
        );
    });
}

/**
 * 弹出一个选择框，然后将选择结果返回，例如给玩家弹出一个选择框，并获取玩家选择了哪个：
 * ```ts
 * const choice = await getChoice(
 *   // 在哪个 UI 控制器上打开，对于一般 UI 组件来说，直接填写 props.controller 即可
 *   props.controller,
 *   // 选项内容，参考 Choices 的注释
 *   [[0, '选项1'], [1, '选项2'], [2, '选项3']],
 *   // 选择框的位置，宽度由下一个参数指定，高度参数由组件内部计算得出，指定无效
 *   [240, 240, void 0, void 0, 0.5, 0.5],
 *   // 宽度设为 240
 *   240,
 *   // 可以给选择框传入其他的 props，例如指定标题，此项可选
 *   { title: '选项标题' }
 * );
 * // 之后，就可以直接判断 choice 来执行不同的操作了
 * if (choice === 0) { ... }
 * ```
 * @param controller UI 控制器
 * @param choices 选择框的选项
 * @param loc 选择框的位置
 * @param width 选择框的宽度
 * @param props 额外的 props，参考 {@link ChoicesProps}
 */
export function getChoice<T extends ChoiceKey = ChoiceKey>(
    controller: IUIMountable,
    choices: ChoiceItem<T>[],
    loc: ElementLocator,
    width: number,
    props?: Partial<ChoicesProps>
): Promise<T> {
    return new Promise<T>(res => {
        const instance = controller.open(
            ChoicesUI,
            {
                ...(props ?? {}),
                choices,
                loc,
                width,
                onChoose: key => {
                    controller.close(instance);
                    res(key as T);
                }
            },
            true
        );
    });
}

function getChoiceRoute(defaults: number) {
    const route = core.status.replay.toReplay[0];
    if (!route.startsWith('choices:')) {
        return defaults;
    } else {
        return Number(route.slice(8));
    }
}

/**
 * 弹出一个确认框，然后将确认结果返回，与 getConfirm 不同的是内置录像支持，如果这个选择框需要进录像，
 * 需要使用此方法。例如给玩家弹出一个确认框，并获取玩家是否确认：
 * ```ts
 * const confirm = await routedConfirm(
 *   // 在哪个 UI 控制器上打开，对于一般 UI 组件来说，直接填写 props.controller 即可
 *   props.controller,
 *   // 确认内容
 *   '确认要 xxx 吗？',
 *   // 确认框的位置，宽度由下一个参数指定，高度参数由组件内部计算得出，指定无效
 *   [240, 240, void 0, void 0, 0.5, 0.5],
 *   // 宽度设为 240
 *   240,
 *   // 可以给选择框传入其他的 props，例如指定字体，此项可选
 *   { font: new Font('Verdana', 20) }
 * );
 * // 之后，就可以直接判断 confirm 来执行不同的操作了
 * if (confirm) { ... }
 * ```
 * @param controller UI 控制器
 * @param text 确认文本内容
 * @param loc 确认框的位置
 * @param width 确认框的宽度
 * @param props 额外的 props，参考 {@link ConfirmBoxProps}
 */
export async function routedConfirm(
    controller: IUIMountable,
    text: string,
    loc: ElementLocator,
    width: number,
    props?: Partial<ConfirmBoxProps>
) {
    if (core.isReplaying()) {
        const confirm = getChoiceRoute(1) === 0;
        const timeout = core.control.__replay_getTimeout();
        core.status.route.push(`choices:${confirm ? 0 : 1}`);
        core.status.replay.toReplay.shift();
        if (timeout === 0) return confirm;
        const instance = controller.open(ConfirmBoxUI, {
            ...(props ?? {}),
            text,
            loc,
            width,
            defaultYes: confirm
        });
        await sleep(core.control.__replay_getTimeout());
        controller.close(instance);
        return confirm;
    } else {
        const confirm = await getConfirm(controller, text, loc, width, props);
        core.status.route.push(`choices:${confirm ? 0 : 1}`);
        return confirm;
    }
}

/**
 * 弹出一个选择框，然后将选择结果返回，与 getChoice 不同的是内置录像支持，如果这个选择框需要进录像，
 * 需要使用此方法。例如给玩家弹出一个选择框，并获取玩家选择了哪个：
 * ```ts
 * const choice = await routedChoice(
 *   // 在哪个 UI 控制器上打开，对于一般 UI 组件来说，直接填写 props.controller 即可
 *   props.controller,
 *   // 选项内容，参考 Choices 的注释
 *   [[0, '选项1'], [1, '选项2'], [2, '选项3']],
 *   // 选择框的位置，宽度由下一个参数指定，高度参数由组件内部计算得出，指定无效
 *   [240, 240, void 0, void 0, 0.5, 0.5],
 *   // 宽度设为 240
 *   240,
 *   // 可以给选择框传入其他的 props，例如指定标题，此项可选
 *   { title: '选项标题' }
 * );
 * // 之后，就可以直接判断 choice 来执行不同的操作了
 * if (choice === 0) { ... }
 * ```
 * @param controller UI 控制器
 * @param choices 选择框的选项
 * @param loc 选择框的位置
 * @param width 选择框的宽度
 * @param props 额外的 props，参考 {@link ChoicesProps}
 */
export async function routedChoices<T extends ChoiceKey>(
    controller: IUIMountable,
    choices: ChoiceItem<T>[],
    loc: ElementLocator,
    width: number,
    props?: Partial<ChoicesProps>
): Promise<T> {
    if (core.isReplaying()) {
        const selected = getChoiceRoute(0);
        const timeout = core.control.__replay_getTimeout();
        core.status.route.push(`choices:${selected}`);
        core.status.replay.toReplay.shift();
        if (timeout === 0) return choices[selected][0];
        const instance = controller.open(ChoicesUI, {
            ...(props ?? {}),
            choices,
            loc,
            width,
            selected
        });
        await sleep(core.control.__replay_getTimeout());
        controller.close(instance);
        return choices[selected][0];
    } else {
        const choice = await getChoice(controller, choices, loc, width, props);
        const index = choices.findIndex(v => v[0] === choice);
        core.status.route.push(`choices:${index}`);
        return choice;
    }
}

/** @see {@link ConfirmBox} */
export const ConfirmBoxUI = new GameUI('confirm-box', ConfirmBox);
/** @see {@link Choices} */
export const ChoicesUI = new GameUI('choices', Choices);
