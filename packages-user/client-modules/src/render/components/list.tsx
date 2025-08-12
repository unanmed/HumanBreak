import { DefaultProps } from '@motajs/render-vue';
import { computed, defineComponent, ref, SlotsType, VNode } from 'vue';
import { Selection } from './misc';
import { ElementLocator } from '@motajs/render-core';
import { Font } from '@motajs/render-style';
import { SetupComponentOptions } from '@motajs/system-ui';
import { Scroll } from './scroll';

export interface ListProps extends DefaultProps {
    /** 列表内容，第一项表示 id，第二项表示显示的内容 */
    list: [string, string][];
    /** 当前选中的项 */
    selected: string;
    /** 定位 */
    loc: ElementLocator;
    /** 每行的高度，默认 18 */
    lineHeight?: number;
    /** 字体 */
    font?: Font;
    /** 使用 winskin 作为光标 */
    winskin?: ImageIds;
    /** 使用指定样式作为光标背景 */
    color?: CanvasStyle;
    /** 使用指定样式作为光标边框 */
    border?: CanvasStyle;
    /** 选择图标的不透明度范围 */
    alphaRange?: [number, number];
}

export type ListEmits = {
    /**
     * 当用户选中某一项时触发
     * @param key 选中的项的 id
     */
    update: (key: string) => void;

    'update:selected': (value: string) => void;
};

const listProps = {
    props: [
        'list',
        'selected',
        'loc',
        'lineHeight',
        'font',
        'winskin',
        'color',
        'border',
        'alphaRange'
    ],
    emits: ['update', 'update:selected']
} satisfies SetupComponentOptions<ListProps, ListEmits, keyof ListEmits>;

export const List = defineComponent<ListProps, ListEmits, keyof ListEmits>(
    (props, { emit }) => {
        const selected = ref(props.list[0][0]);
        const lineHeight = computed(() => props.lineHeight ?? 18);

        const select = (value: string) => {
            selected.value = value;
            emit('update', value);
            emit('update:selected', value);
        };

        return () => (
            <Scroll loc={props.loc}>
                {props.list.map((v, i) => {
                    const [key, value] = v;
                    const loc: ElementLocator = [
                        0,
                        lineHeight.value * i,
                        props.loc[2] ?? 200,
                        lineHeight.value
                    ];
                    const selectionLoc: ElementLocator = [
                        0,
                        0,
                        (props.loc[2] ?? 200) - 10,
                        lineHeight.value
                    ];
                    const textLoc: ElementLocator = [
                        10,
                        lineHeight.value / 2,
                        void 0,
                        void 0,
                        0,
                        0.5
                    ];
                    return (
                        <container loc={loc} onClick={() => select(key)}>
                            {selected.value === key && (
                                <Selection
                                    loc={selectionLoc}
                                    color={props.color}
                                    border={props.border}
                                    winskin={props.winskin}
                                    alphaRange={props.alphaRange}
                                />
                            )}
                            <text
                                loc={textLoc}
                                text={value}
                                font={props.font}
                            />
                        </container>
                    );
                })}
            </Scroll>
        );
    },
    listProps
);

export interface ListPageProps extends ListProps {
    /** 组件定位 */
    loc: ElementLocator;
    /** 列表所占比例 */
    basis?: number;
    /** 列表是否排列在右侧 */
    right?: boolean;
    /** 是否显示关闭按钮 */
    close?: boolean;
    /** 关闭按钮的位置，相对于组件定位 */
    closeLoc?: ElementLocator;
}

export type ListPageEmits = {
    close: () => void;
} & ListEmits;

export type ListPageSlots = SlotsType<{
    default: (key: string) => VNode | VNode[];

    [x: string]: (key: string) => VNode | VNode[];
}>;

const listPageProps = {
    props: [
        'basis',
        'right',
        'list',
        'selected',
        'loc',
        'lineHeight',
        'font',
        'winskin',
        'color',
        'border',
        'alphaRange',
        'close',
        'closeLoc'
    ],
    emits: ['update', 'update:selected', 'close']
} satisfies SetupComponentOptions<
    ListPageProps,
    ListPageEmits,
    keyof ListPageEmits,
    ListPageSlots
>;

export const ListPage = defineComponent<
    ListPageProps,
    ListPageEmits,
    keyof ListPageEmits,
    ListPageSlots
>((props, { emit, slots }) => {
    const selected = ref(props.selected);

    const basis = computed(() => props.basis ?? 0.3);
    const width = computed(() => props.loc[2] ?? 200);
    const height = computed(() => props.loc[3] ?? 200);
    const listLoc = computed<ElementLocator>(() => {
        const listWidth = width.value * basis.value;
        if (props.right) {
            return [width.value - listWidth, 0, listWidth, height.value];
        } else {
            return [0, 0, listWidth, height.value];
        }
    });
    const contentLoc = computed<ElementLocator>(() => {
        const contentWidth = width.value * (1 - basis.value);
        if (props.right) {
            return [0, 0, contentWidth, height.value];
        } else {
            return [width.value - contentWidth, 0, contentWidth, height.value];
        }
    });

    const update = (key: string) => {
        emit('update', key);
        emit('update:selected', key);
    };

    const close = () => emit('close');

    return () => (
        <container loc={props.loc}>
            <List
                {...props}
                loc={listLoc.value}
                list={props.list}
                v-model:selected={selected.value}
                onUpdate={update}
            ></List>
            <container loc={contentLoc.value}>
                {slots[selected.value]?.(selected.value) ??
                    slots.default?.(selected.value)}
            </container>
            {props.close && (
                <text
                    loc={props.closeLoc}
                    text="关闭"
                    cursor="pointer"
                    font={props.font}
                    onClick={close}
                ></text>
            )}
        </container>
    );
}, listPageProps);
