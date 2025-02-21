import {
    computed,
    defineComponent,
    onMounted,
    onUnmounted,
    onUpdated,
    reactive,
    ref,
    SlotsType,
    VNode,
    watch
} from 'vue';
import { SetupComponentOptions } from './types';
import {
    Container,
    ContainerProps,
    ElementLocator,
    RenderItem,
    Sprite,
    SpriteProps
} from '@/core/render';
import { MotaOffscreenCanvas2D } from '@/core/fx/canvas2d';
import { hyper, Transition } from 'mutate-animate';
import { clamp } from 'lodash-es';
import { IActionEvent, IWheelEvent, MouseType } from '@/core/render/event';

export const enum ScrollDirection {
    Horizontal,
    Vertical
}

interface ScrollProps {
    direction: ScrollDirection;
    loc: ElementLocator;
    noscroll?: boolean;
    /**
     * 滚动到最下方（最右方）时的填充大小，如果默认的高度计算方式有误，
     * 那么可以调整此参数来修复错误
     */
    padHeight?: number;
}

type ScrollSlots = SlotsType<{
    default: () => VNode | VNode[];
}>;

const scrollProps = {
    props: ['direction', 'noscroll']
} satisfies SetupComponentOptions<ScrollProps, {}, string, ScrollSlots>;

/** 滚动条图示的最短长度 */
const SCROLL_MIN_LENGTH = 20;
/** 滚动条图示的宽度 */
const SCROLL_WIDTH = 10;

export const Scroll = defineComponent<ScrollProps, {}, string, ScrollSlots>(
    (props, { slots }) => {
        const scrollProps: SpriteProps = reactive({
            loc: [0, 0, 0, 0]
        });
        const contentProps: ContainerProps = reactive({
            loc: [0, 0, 0, 0]
        });

        const listenedChild: Set<RenderItem> = new Set();
        const areaMap: Map<RenderItem, [number, number]> = new Map();
        const content = ref<Container>();
        const scroll = ref<Sprite>();

        const width = computed(() => props.loc[2] ?? 200);
        const height = computed(() => props.loc[3] ?? 200);

        let showScroll = 0;
        let nowScroll = 0;
        let maxLength = 0;
        let scrollLength = SCROLL_MIN_LENGTH;

        const transition = new Transition();
        transition.value.scroll = 0;
        transition.mode(hyper('sin', 'out')).absolute();

        transition.ticker.add(() => {
            if (transition.value.scroll !== nowScroll) {
                showScroll = transition.value.scroll;
                scroll.value?.update();
                content.value?.update();
            }
        });

        watch(
            () => props.loc,
            value => {
                const width = value[2] ?? 200;
                const height = value[3] ?? 200;
                if (props.direction === ScrollDirection.Horizontal) {
                    props.loc = [0, height - SCROLL_WIDTH, width, SCROLL_WIDTH];
                } else {
                    props.loc = [width - SCROLL_WIDTH, 0, SCROLL_WIDTH, height];
                }
            }
        );

        /**
         * 滚动到目标值
         * @param time 动画时长
         */
        const scrollTo = (y: number, time: number = 1) => {
            const target = clamp(y, 0, maxLength);
            transition.time(time).transition('scroll', target);
            nowScroll = y;
        };

        /**
         * 计算一个元素会在画面上显示的区域
         */
        const getArea = (item: RenderItem, rect: DOMRectReadOnly) => {
            if (props.direction === ScrollDirection.Horizontal) {
                areaMap.set(item, [rect.left - width.value, rect.right]);
            } else {
                areaMap.set(item, [rect.top - height.value, rect.bottom]);
            }
        };

        /**
         * 检查一个元素是否需要显示，不需要则隐藏
         */
        const checkItem = (item: RenderItem) => {
            const area = areaMap.get(item);
            if (!area) {
                item.show();
                return;
            }
            const [min, max] = area;
            if (nowScroll > min - 10 && nowScroll < max + 10) {
                item.show();
            } else {
                item.hide();
            }
        };

        /**
         * 当一个元素的矩阵发生变换时执行，检查其显示区域
         */
        const onTransform = (item: RenderItem) => {
            const rect = item.getBoundingRect();
            getArea(item, rect);
            checkItem(item);
        };

        const updateScroll = () => {
            if (!content.value) return;
            let max = 0;
            listenedChild.forEach(v => v.off('transform', onTransform));
            listenedChild.clear();
            areaMap.clear();
            content.value.children.forEach(v => {
                const rect = v.getBoundingRect();
                if (props.direction === ScrollDirection.Horizontal) {
                    if (rect.right > max) {
                        max = rect.right;
                    }
                } else {
                    if (rect.bottom > max) {
                        max = rect.bottom;
                    }
                }
                v.on('transform', onTransform);
                listenedChild.add(v);
            });
            maxLength = max + (props.padHeight ?? 0);
            if (props.direction === ScrollDirection.Horizontal) {
                scrollLength = Math.max(
                    SCROLL_MIN_LENGTH,
                    (width.value / max) * width.value
                );
                const h = props.noscroll
                    ? height.value
                    : height.value - SCROLL_WIDTH;
                contentProps.loc = [-showScroll, 0, width.value, h];
            } else {
                scrollLength = clamp(
                    (height.value / max) * height.value,
                    SCROLL_MIN_LENGTH,
                    height.value - 10
                );
                const w = props.noscroll
                    ? width.value
                    : width.value - SCROLL_WIDTH;
                contentProps.loc = [0, -showScroll, w, height.value];
            }
            scroll.value?.update();
        };

        onUpdated(updateScroll);
        onMounted(updateScroll);
        onUnmounted(() => {
            listenedChild.forEach(v => v.off('transform', onTransform));
        });

        const drawScroll = (canvas: MotaOffscreenCanvas2D) => {
            if (props.noscroll) return;
            const ctx = canvas.ctx;
            ctx.lineCap = 'round';
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            if (props.direction === ScrollDirection.Horizontal) {
                ctx.moveTo(nowScroll + 5, 5);
                ctx.lineTo(nowScroll + scrollLength + 5, 5);
            } else {
                ctx.moveTo(5, nowScroll + 5);
                ctx.lineTo(5, nowScroll + scrollLength + 5);
            }
            ctx.stroke();
        };

        const wheel = (ev: IWheelEvent) => {
            if (props.direction === ScrollDirection.Horizontal) {
                if (ev.wheelX !== 0) {
                    scrollTo(nowScroll + ev.wheelX, 300);
                } else if (ev.wheelY !== 0) {
                    scrollTo(nowScroll + ev.wheelY, 300);
                }
            } else {
                scrollTo(nowScroll + ev.wheelY, 300);
            }
        };

        const getPos = (ev: IActionEvent) => {
            if (props.direction === ScrollDirection.Horizontal) {
                return ev.offsetX;
            } else {
                return ev.offsetY;
            }
        };

        let identifier: number = -1;
        let lastPos: number = 0;
        const down = (ev: IActionEvent) => {
            identifier = ev.identifier;
            lastPos = getPos(ev);
        };

        const move = (ev: IActionEvent) => {
            if (ev.identifier !== identifier) return;
            let pos = 0;
            if (ev.touch) {
                pos = getPos(ev);
            } else {
                if (ev.buttons & MouseType.Left) {
                    pos = getPos(ev);
                }
            }
            const movement = pos - lastPos;
            scrollTo(nowScroll + movement, 1);
            lastPos = pos;
        };

        let scrollBefore = 0;
        let scrollIdentifier = -1;
        let scrollDownPos = 0;
        let scrollMutate = false;
        let scrollPin = 0;

        /**
         * 获取点击滚动条时，垂直于滚动条方向的位置
         */
        const getScrollPin = (ev: IActionEvent) => {
            if (props.direction === ScrollDirection.Horizontal) {
                return ev.absoluteY;
            } else {
                return ev.absoluteX;
            }
        };

        const downScroll = (ev: IActionEvent) => {
            scrollBefore = nowScroll;
            scrollIdentifier = ev.identifier;
            const pos = getPos(ev);
            // 计算点击在了滚动条的哪个位置
            const sEnd = nowScroll + scrollLength;
            if (pos >= nowScroll && pos <= sEnd) {
                scrollDownPos = pos - nowScroll;
                scrollMutate = false;
                scrollPin = getScrollPin(ev);
            } else {
                scrollMutate = true;
            }
        };

        const moveScroll = (ev: IActionEvent) => {
            if (ev.identifier !== scrollIdentifier) return;
            const pos = getPos(ev);
            const scrollPos = pos - scrollDownPos;
            let deltaPin = 0;
            let threshold = 0;
            if (ev.touch) {
                const pin = getScrollPin(ev);
                deltaPin = Math.abs(pin - scrollPin);
                threshold = 200;
            } else {
                const pin = getScrollPin(ev);
                deltaPin = Math.abs(pin - scrollPin);
                threshold = 100;
            }
            if (deltaPin > threshold) {
                scrollTo(scrollBefore, 1);
            } else {
                scrollTo(scrollPos, 1);
            }
        };

        const upScroll = (ev: IActionEvent) => {
            if (!scrollMutate) return;
            const pos = getPos(ev);
            if (pos < nowScroll) {
                scrollTo(pos - 50);
            } else {
                scrollTo(pos + 50);
            }
        };

        onMounted(() => {
            scroll.value?.root?.on('move', move);
            scroll.value?.root?.on('move', moveScroll);
        });

        onUnmounted(() => {
            scroll.value?.root?.off('move', move);
            scroll.value?.root?.off('move', moveScroll);
        });

        return () => {
            return (
                <container loc={props.loc} onWheel={wheel}>
                    <container {...contentProps} ref={content} onDown={down}>
                        {slots.default()}
                    </container>
                    <sprite
                        {...scrollProps}
                        ref={scroll}
                        render={drawScroll}
                        onDown={downScroll}
                        onUp={upScroll}
                    ></sprite>
                </container>
            );
        };
    },
    scrollProps
);
