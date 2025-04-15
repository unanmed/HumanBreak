import {
    computed,
    defineComponent,
    nextTick,
    onMounted,
    ref,
    SlotsType,
    VNode,
    watch
} from 'vue';
import { SetupComponentOptions } from './types';
import { clamp } from 'lodash-es';
import { DefaultProps, ElementLocator, Font } from '@motajs/render';

/** 圆角矩形页码距离容器的边框大小，与 pageSize 相乘 */
const RECT_PAD = 0.1;

export interface PageProps extends DefaultProps {
    /** 共有多少页 */
    pages: number;
    /** 页码组件的定位 */
    loc: ElementLocator;
    /** 页码的字体 */
    font?: Font;
    /** 只有一页的时候，是否隐藏页码 */
    hideIfSingle?: boolean;
}

export type PageEmits = {
    pageChange: (page: number) => void;
};

export interface PageExpose {
    /**
     * 切换页码
     * @param page 要切换至的页码数，0 表示第一页
     */
    changePage(page: number): void;

    /**
     * 切换到传入的页码数加上当前页码数的页码
     * @param delta 页码数增量
     */
    movePage(delta: number): void;

    /**
     * 获取当前在第几页
     */
    now(): number;
}

type PageSlots = SlotsType<{
    default: (page: number) => VNode | VNode[];
}>;

const pageProps = {
    props: ['pages', 'loc', 'font', 'hideIfSingle'],
    emits: ['pageChange']
} satisfies SetupComponentOptions<
    PageProps,
    PageEmits,
    keyof PageEmits,
    PageSlots
>;

/**
 * 分页组件，用于多页切换，例如存档界面等。参数参考 {@link PageProps}，函数接口参考 {@link PageExpose}
 *
 * ---
 *
 * 用例如下，是一个在每页显示文字的用例，其中 page 表示页码索引，第一页就是 0，第二页就是 1，以此类推：
 * ```tsx
 * <Page maxPage={5}>
 *   {
 *     (page: number) => {
 *       return items[page].map(v => <text text={v.text} />)
 *     }
 *   }
 * </Page>
 * ```
 */
export const Page = defineComponent<
    PageProps,
    PageEmits,
    keyof PageEmits,
    PageSlots
>((props, { slots, expose, emit }) => {
    const nowPage = ref(0);

    // 五个元素的位置
    const leftLoc = ref<ElementLocator>([]);
    const leftPageLoc = ref<ElementLocator>([]);
    const nowPageLoc = ref<ElementLocator>([]);
    const rightPageLoc = ref<ElementLocator>([]);
    const rightLoc = ref<ElementLocator>([]);
    /** 内容的位置 */
    const contentLoc = ref<ElementLocator>([]);
    /** 页码容器的位置 */
    const pageLoc = ref<ElementLocator>([]);
    /** 页码的矩形框的位置 */
    const rectLoc = ref<ElementLocator>([0, 0, 0, 0]);
    /** 页面文字的位置 */
    const textLoc = ref<ElementLocator>([0, 0, 0, 0]);

    // 两个监听的参数
    const leftArrow = ref<Path2D>();
    const rightArrow = ref<Path2D>();

    const hide = computed(() => props.hideIfSingle && props.pages === 1);
    const font = computed(() => props.font ?? new Font());
    const isFirst = computed(() => nowPage.value === 0);
    const isLast = computed(() => nowPage.value === props.pages - 1);
    const width = computed(() => props.loc[2] ?? 200);
    const height = computed(() => props.loc[3] ?? 200);
    const round = computed(() => font.value.size / 4);
    const nowPageFont = computed(() => Font.clone(font.value, { weight: 700 }));

    // 左右箭头的颜色
    const leftColor = computed(() => (isFirst.value ? '#666' : '#ddd'));
    const rightColor = computed(() => (isLast.value ? '#666' : '#ddd'));

    let updating = false;
    const updatePagePos = () => {
        if (updating) return;
        updating = true;
        nextTick(() => {
            updating = false;
        });
        const pageH = hide.value ? 0 : font.value.size + 8;
        contentLoc.value = [0, 0, width.value, height.value - pageH];
        pageLoc.value = [0, height.value - pageH, width.value, pageH];
        const center = width.value / 2;
        const size = font.value.size * 1.5;
        nowPageLoc.value = [center, 0, size, size, 0.5, 0];
        leftPageLoc.value = [center - size * 1.5, 0, size, size, 0.5, 0];
        leftLoc.value = [center - size * 3, 0, size, size, 0.5, 0];
        rightPageLoc.value = [center + size * 1.5, 0, size, size, 0.5, 0];
        rightLoc.value = [center + size * 3, 0, size, size, 0.5, 0];
    };

    const updateArrowPath = () => {
        const rectSize = font.value.size * 1.5;
        const size = font.value.size;
        const pad = rectSize - size;
        const left = new Path2D();
        left.moveTo(size, pad);
        left.lineTo(pad, rectSize / 2);
        left.lineTo(size, rectSize - pad);
        const right = new Path2D();
        right.moveTo(pad, pad);
        right.lineTo(size, rectSize / 2);
        right.lineTo(pad, rectSize - pad);
        leftArrow.value = left;
        rightArrow.value = right;
    };

    const updateRectAndText = () => {
        const size = font.value.size * 1.5;
        const pad = RECT_PAD * size;
        rectLoc.value = [pad, pad, size - pad * 2, size - pad * 2];
        textLoc.value = [size / 2, size / 2, void 0, void 0, 0.5, 0.5];
    };

    watch(font, () => {
        updatePagePos();
        updateArrowPath();
        updateRectAndText();
    });
    watch(
        () => props.loc,
        () => {
            updatePagePos();
            updateRectAndText();
        }
    );

    /**
     * 切换页码
     */
    const changePage = (page: number) => {
        const target = clamp(page, 0, props.pages - 1);
        if (nowPage.value !== target) {
            nowPage.value = target;
            emit('pageChange', target);
        }
    };

    const movePage = (delta: number) => {
        changePage(nowPage.value + delta);
    };

    const now = () => nowPage.value;

    const lastPage = () => {
        changePage(nowPage.value - 1);
    };

    const nextPage = () => {
        changePage(nowPage.value + 1);
    };

    onMounted(() => {
        updatePagePos();
        updateArrowPath();
        updateRectAndText();
    });

    expose<PageExpose>({ changePage, movePage, now });

    return () => {
        return (
            <container loc={props.loc}>
                <container loc={contentLoc.value}>
                    {slots.default?.(nowPage.value)}
                </container>
                <container loc={pageLoc.value} hidden={hide.value}>
                    <container
                        key={1}
                        loc={leftLoc.value}
                        onClick={lastPage}
                        cursor="pointer"
                    >
                        <g-rectr
                            loc={rectLoc.value}
                            circle={[round.value]}
                            strokeStyle={leftColor.value}
                            lineWidth={1}
                            stroke
                        ></g-rectr>
                        <g-path
                            path={leftArrow.value}
                            stroke
                            strokeStyle={leftColor.value}
                            lineWidth={1}
                        ></g-path>
                    </container>
                    {!isFirst.value && (
                        <container
                            key={2}
                            loc={leftPageLoc.value}
                            onClick={lastPage}
                            cursor="pointer"
                        >
                            <g-rectr
                                loc={rectLoc.value}
                                circle={[round.value]}
                                strokeStyle="#ddd"
                                lineWidth={1}
                                stroke
                            ></g-rectr>
                            <text
                                loc={textLoc.value}
                                text={nowPage.value.toString()}
                                font={font.value}
                            ></text>
                        </container>
                    )}
                    <container loc={nowPageLoc.value} key={3}>
                        <g-rectr
                            loc={rectLoc.value}
                            circle={[round.value]}
                            strokeStyle="#ddd"
                            fillStyle="#ddd"
                            lineWidth={1}
                            fill
                            stroke
                        ></g-rectr>
                        <text
                            loc={textLoc.value}
                            text={(nowPage.value + 1).toString()}
                            fillStyle="#222"
                            font={nowPageFont.value}
                        ></text>
                    </container>
                    {!isLast.value && (
                        <container
                            key={4}
                            loc={rightPageLoc.value}
                            onClick={nextPage}
                            cursor="pointer"
                        >
                            <g-rectr
                                loc={rectLoc.value}
                                circle={[round.value]}
                                strokeStyle="#ddd"
                                lineWidth={1}
                                stroke
                            ></g-rectr>
                            <text
                                loc={textLoc.value}
                                text={(nowPage.value + 2).toString()}
                                font={font.value}
                            ></text>
                        </container>
                    )}
                    <container
                        key={5}
                        loc={rightLoc.value}
                        onClick={nextPage}
                        cursor="pointer"
                    >
                        <g-rectr
                            loc={rectLoc.value}
                            circle={[round.value]}
                            strokeStyle={rightColor.value}
                            lineWidth={1}
                            stroke
                        ></g-rectr>
                        <g-path
                            path={rightArrow.value}
                            stroke
                            strokeStyle={rightColor.value}
                            lineWidth={1}
                        ></g-path>
                    </container>
                </container>
            </container>
        );
    };
}, pageProps);
