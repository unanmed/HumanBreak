import { DefaultProps, ElementLocator, Font, useKey } from '@/core/render';
import { computed, defineComponent, reactive, ref } from 'vue';
import { Background, Selection } from './misc';
import { TextContent, TextContentExpose, TextContentProps } from './textbox';
import { SetupComponentOptions } from './types';
import { TextAlign } from './textboxTyper';
import { Page, PageExpose } from './page';

export interface ConfirmBoxProps extends DefaultProps, TextContentProps {
    text: string;
    width: number;
    loc: ElementLocator;
    selFont?: Font;
    selFill?: CanvasStyle;
    pad?: number;
    yesText?: string;
    noText?: string;
    winskin?: ImageIds;
    defaultYes?: boolean;
    color?: CanvasStyle;
    border?: CanvasStyle;
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
        'border'
    ],
    emits: ['no', 'yes']
} satisfies SetupComponentOptions<
    ConfirmBoxProps,
    ConfirmBoxEmits,
    keyof ConfirmBoxEmits
>;

/**
 * 确认框组件，与 2.x 的 drawConfirm 类似，可以键盘操作，
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
 *   selFont="16px Verdana"
 *   // 设置选项的文本颜色
 *   selFill="#d48"
 *   // 完全继承 TextContent 的参数，因此可以填写 fontFamily 参数指定文本字体
 *   fontFamily="Arial"
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
    const content = ref<TextContentExpose>();
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
    const pad = computed(() => props.pad ?? 32);
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

    const [key] = useKey();
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
                color={props.color}
                border={props.border}
                zIndex={0}
            />
            <TextContent
                {...attrs}
                ref={content}
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

export interface ChoicesProps extends DefaultProps, TextContentProps {
    choices: [key: string | number | symbol, text: string][];
    loc: ElementLocator;
    width: number;
    maxHeight?: number;
    text?: string;
    title?: string;
    winskin?: ImageIds;
    color?: CanvasStyle;
    border?: CanvasStyle;
    selFont?: Font;
    selFill?: CanvasStyle;
    titleFont?: Font;
    titleFill?: CanvasStyle;
    pad?: number;
    defaultChoice?: string | number | symbol;
    interval?: number;
}

export type ChoicesEmits = {
    choice: (key: string | number | symbol) => void;
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
        'defaultChoice',
        'interval'
    ],
    emits: ['choice']
} satisfies SetupComponentOptions<
    ChoicesProps,
    ChoicesEmits,
    keyof ChoicesEmits
>;

export const Choices = defineComponent<
    ChoicesProps,
    ChoicesEmits,
    keyof ChoicesEmits
>((props, { emit, attrs }) => {
    const titleHeight = ref(0);
    const contentHeight = ref(0);
    const selected = ref(0);
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

    const [key] = useKey();
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
        if (selected.value === choiceCountPerPage.value - 1) {
            pageCom.value?.movePage(1);
            selected.value = 0;
        } else {
            const page = pageCom.value?.now() ?? 1;
            const index = page * choiceCountPerPage.value + selected.value;
            if (index < props.choices.length - 1) {
                selected.value++;
            }
        }
    });
    key.realize('moveLeft', () => pageCom.value?.movePage(-1));
    key.realize('moveRight', () => pageCom.value?.movePage(1));
    key.realize('confirm', () => {
        const page = pageCom.value?.now() ?? 1;
        const index = page * choiceCountPerPage.value + selected.value;
        emit('choice', props.choices[index][0]);
    });

    return () => (
        <container loc={boxLoc.value}>
            <Background
                loc={[0, 0, props.width, boxHeight.value]}
                winskin={props.winskin}
                color={props.color}
                border={props.border}
            />
            {hasTitle.value && (
                <text
                    loc={titleLoc.value}
                    text={props.title}
                    font={props.titleFont ?? new Font(void 0, 18)}
                    fillStyle={props.titleFill ?? 'gold'}
                    zIndex={5}
                    onSetText={updateTitleHeight}
                />
            )}
            {hasText.value && (
                <TextContent
                    {...attrs}
                    text={props.text}
                    loc={contentLoc.value}
                    width={contentWidth.value}
                    zIndex={5}
                    autoHeight
                    onUpdateHeight={updateContentHeight}
                />
            )}
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
                                onClick={() => emit('choice', v[0])}
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
