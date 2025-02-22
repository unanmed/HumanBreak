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
import { ElementLocator } from '@/core/render';

/** 圆角矩形页码距离容器的边框大小，与 pageSize 相乘 */
const RECT_PAD = 0.1;

export interface PageProps {
    /** 共有多少页 */
    pages: number;
    /** 页码组件的定位 */
    loc: ElementLocator;
    /** 页码的字体大小，默认为 14 */
    pageSize?: number;
}

export interface PageExpose {
    /**
     * 切换页码
     * @param page 要切换至的页码数，1 表示第一页
     */
    changePage(page: number): void;
}

type PageSlots = SlotsType<{
    default: (page: number) => VNode | VNode[];
}>;

const pageProps = {
    props: ['pages', 'loc', 'pageSize']
} satisfies SetupComponentOptions<PageProps, {}, string, PageSlots>;

export const Page = defineComponent<PageProps, {}, string, PageSlots>(
    (props, { slots, expose }) => {
        const nowPage = ref(1);

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
        const leftArrow = ref<Path2D>(new Path2D());
        const rightArrow = ref<Path2D>(new Path2D());

        const isFirst = computed(() => nowPage.value === 1);
        const isLast = computed(() => nowPage.value === props.pages);
        const pageSize = computed(() => props.pageSize ?? 14);
        const width = computed(() => props.loc[2] ?? 200);
        const height = computed(() => props.loc[3] ?? 200);
        const round = computed(() => pageSize.value / 4);
        const pageFont = computed(() => `${pageSize.value}px normal`);

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
            const pageH = pageSize.value + 8;
            contentLoc.value = [0, 0, width.value, height.value - pageH];
            pageLoc.value = [0, height.value - pageH, width.value, pageH];
            const center = width.value / 2;
            const size = pageSize.value * 1.5;
            nowPageLoc.value = [center, 0, size, size, 0.5, 0];
            leftPageLoc.value = [center - size * 1.5, 0, size, size, 0.5, 0];
            leftLoc.value = [center - size * 3, 0, size, size, 0.5, 0];
            rightPageLoc.value = [center + size * 1.5, 0, size, size, 0.5, 0];
            rightLoc.value = [center + size * 3, 0, size, size, 0.5, 0];
        };

        const updateArrowPath = () => {
            const rectSize = pageSize.value * 1.5;
            const size = pageSize.value;
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
            const size = pageSize.value * 1.5;
            const pad = RECT_PAD * size;
            rectLoc.value = [pad, pad, size - pad * 2, size - pad * 2];
            textLoc.value = [size / 2, size / 2, void 0, void 0, 0.5, 0.5];
        };

        watch(pageSize, () => {
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
            const target = clamp(page, 1, props.pages);
            nowPage.value = target;
        };

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

        expose({ changePage });

        return () => {
            return (
                <container loc={props.loc}>
                    <container loc={contentLoc.value}>
                        {slots.default?.(nowPage.value)}
                    </container>
                    <container loc={pageLoc.value}>
                        <container loc={leftLoc.value} onClick={lastPage}>
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
                                loc={leftPageLoc.value}
                                onClick={lastPage}
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
                                    text={(nowPage.value - 1).toString()}
                                    font={pageFont.value}
                                ></text>
                            </container>
                        )}
                        <container loc={nowPageLoc.value}>
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
                                text={nowPage.value.toString()}
                                fillStyle="#222"
                                font={pageFont.value}
                            ></text>
                        </container>
                        {!isLast.value && (
                            <container
                                loc={rightPageLoc.value}
                                onClick={nextPage}
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
                                    text={(nowPage.value + 1).toString()}
                                    font={pageFont.value}
                                ></text>
                            </container>
                        )}
                        <container loc={rightLoc.value} onClick={nextPage}>
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
    },
    pageProps
);
