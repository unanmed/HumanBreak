import {
    computed,
    defineComponent,
    nextTick,
    onMounted,
    onUnmounted,
    onUpdated,
    ref,
    SlotsType,
    VNode,
    watch
} from 'vue';
import {
    Container,
    DefaultProps,
    ElementLocator,
    RenderItem,
    Sprite,
    Transform,
    MotaOffscreenCanvas2D,
    IActionEvent,
    IWheelEvent,
    MouseType,
    EventProgress,
    ActionEventMap,
    ContainerCustom,
    ActionType,
    CustomContainerPropagateOrigin
} from '@motajs/render';
import { hyper, linear, Transition } from 'mutate-animate';
import { clamp } from 'lodash-es';
import { transitioned } from '../use';
import { SetupComponentOptions } from '@motajs/system-ui';

export const enum ScrollDirection {
    Horizontal,
    Vertical
}

export interface ScrollExpose {
    /**
     * 控制滚动条滚动至目标位置
     * @param y 滚动至的目标位置
     * @param time 滚动的动画时长，默认为无动画
     */
    scrollTo(y: number, time?: number): void;

    /**
     * 获取这个滚动条组件最多可以滚动多长
     */
    getScrollLength(): number;
}

export interface ScrollProps extends DefaultProps {
    loc: ElementLocator;
    hor?: boolean;
    /** 是否不允许滚动 */
    noscroll?: boolean;
    /**
     * 滚动到最下方（最右方）时的填充大小，如果默认的高度计算方式有误，
     * 那么可以调整此参数来修复错误
     */
    padEnd?: number;
}

type ScrollSlots = SlotsType<{
    default: () => VNode | VNode[];
}>;

const scrollProps = {
    props: ['hor', 'noscroll', 'loc', 'padEnd']
} satisfies SetupComponentOptions<ScrollProps, {}, string, ScrollSlots>;

/** 滚动条图示的最短长度 */
const SCROLL_MIN_LENGTH = 20;
/** 滚动条图示的宽度 */
const SCROLL_WIDTH = 10;
/** 滚动条的颜色 */
const SCROLL_COLOR = '255,255,255';

/**
 * 滚动条组件，具有虚拟滚动功能，即在画面外的不渲染。参数参考 {@link ScrollProps}，暴露接口参考 {@link ScrollExpose}
 *
 * ---
 *
 * 使用时，建议使用平铺式布局，即包含很多子元素，而不要用一个 container 将所有内容包裹，
 * 每个子元素的高度（宽度）不建议过大，以更好地通过虚拟滚动优化
 *
 * **推荐写法**：
 * ```tsx
 * <Scroll>
 *   <item />
 *   <item />
 *   ...其他元素
 *   <item />
 *   <item />
 * </Scroll>
 * ```
 * **不推荐**使用这种写法：
 * ```tsx
 * <Scroll>
 *   <container>
 *     <item />
 *   </container>
 * <Scroll>
 * ```
 */
export const Scroll = defineComponent<ScrollProps, {}, string, ScrollSlots>(
    (props, { slots, expose }) => {
        /** 滚动条的定位 */
        const sp = ref<ElementLocator>([0, 0, 1, 1]);

        const listenedChild: Set<RenderItem> = new Set();
        const areaMap: Map<RenderItem, [number, number]> = new Map();
        const content = ref<Container>();
        const scroll = ref<Sprite>();

        const scrollAlpha = transitioned(0.5, 100, linear())!;

        const width = computed(() => props.loc[2] ?? 200);
        const height = computed(() => props.loc[3] ?? 200);
        const direction = computed(() =>
            props.hor ? ScrollDirection.Horizontal : ScrollDirection.Vertical
        );
        const scrollColor = computed(
            () => `rgba(${SCROLL_COLOR},${scrollAlpha.ref.value ?? 0.5})`
        );
        const padEnd = computed(() => props.padEnd ?? 0);

        watch(scrollColor, () => {
            scroll.value?.update();
        });

        /** 滚动内容的当前位置 */
        let contentPos = 0;
        /** 滚动条的当前位置 */
        let scrollPos = 0;
        /** 滚动内容的目标位置 */
        let contentTarget = 0;
        /** 滚动条的目标位置 */
        let scrollTarget = 0;
        /** 滚动内容的长度 */
        let maxLength = 0;
        /** 滚动条的长度 */
        let scrollLength = SCROLL_MIN_LENGTH;

        const transition = new Transition();
        transition.value.scroll = 0;
        transition.value.showScroll = 0;
        transition.mode(hyper('sin', 'out')).absolute();

        //#region 滚动操作

        transition.ticker.add(() => {
            if (scrollPos !== scrollTarget) {
                scrollPos = transition.value.scroll;
                content.value?.update();
            }
            if (contentPos !== contentTarget) {
                contentPos = transition.value.showScroll;
                checkAllItem();
                content.value?.update();
            }
        });

        /**
         * 滚动到目标值
         * @param time 动画时长
         */
        const scrollTo = (y: number, time: number = 0) => {
            if (maxLength < height.value) return;
            const max = maxLength - height.value;
            const target = clamp(y, 0, max);
            contentTarget = target;
            if (direction.value === ScrollDirection.Horizontal) {
                scrollTarget =
                    (width.value - scrollLength) * (contentTarget / max);
            } else {
                scrollTarget =
                    (height.value - scrollLength) * (contentTarget / max);
            }
            if (isNaN(scrollTarget)) scrollTarget = 0;
            transition.time(time).transition('scroll', scrollTarget);
            transition.time(time).transition('showScroll', target);
        };

        /**
         * 计算一个元素会在画面上显示的区域
         */
        const getArea = (item: RenderItem, rect: DOMRectReadOnly) => {
            if (direction.value === ScrollDirection.Horizontal) {
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
            if (contentPos > min - 10 && contentPos < max + 10) {
                item.show();
            } else {
                item.hide();
            }
        };

        /**
         * 对所有元素执行显示检查
         */
        const checkAllItem = () => {
            content.value?.children.forEach(v => checkItem(v));
        };

        /**
         * 当一个元素的矩阵发生变换时执行，检查其显示区域
         */
        const onTransform = (item: RenderItem) => {
            const rect = item.getBoundingRect();
            const pad = props.padEnd ?? 0;
            if (item.parent === content.value) {
                if (direction.value === ScrollDirection.Horizontal) {
                    if (rect.right > maxLength - pad) {
                        maxLength = rect.right + pad;
                        updatePosition();
                    }
                } else {
                    if (rect.bottom > maxLength - pad) {
                        maxLength = rect.bottom + pad;
                        updatePosition();
                    }
                }
            } else {
                item.off('transform', onTransform);
                listenedChild.delete(item);
            }
            getArea(item, rect);
            checkItem(item);
            scroll.value?.update();
            content.value?.update();
        };

        /**
         * 更新滚动条位置
         */
        const updatePosition = () => {
            if (direction.value === ScrollDirection.Horizontal) {
                scrollLength = clamp(
                    (height.value / maxLength) * width.value,
                    SCROLL_MIN_LENGTH,
                    width.value
                );
                const h = props.noscroll
                    ? height.value
                    : height.value - SCROLL_WIDTH;
                sp.value = [0, h, width.value, SCROLL_WIDTH];
            } else {
                scrollLength = clamp(
                    (height.value / maxLength) * height.value,
                    SCROLL_MIN_LENGTH,
                    height.value
                );
                const w = props.noscroll
                    ? width.value
                    : width.value - SCROLL_WIDTH;
                sp.value = [w, 0, SCROLL_WIDTH, height.value];
            }
        };

        let updating = false;
        const updateScroll = () => {
            if (!content.value || updating) return;
            updating = true;
            nextTick(() => {
                updating = false;
            });
            let max = 0;
            listenedChild.forEach(v => v.off('transform', onTransform));
            listenedChild.clear();
            areaMap.clear();
            content.value.children.forEach(v => {
                if (v.isComment) return;
                const rect = v.getBoundingRect();
                if (direction.value === ScrollDirection.Horizontal) {
                    if (rect.right > max) {
                        max = rect.right;
                    }
                } else {
                    if (rect.bottom > max) {
                        max = rect.bottom;
                    }
                }
                getArea(v, rect);
                if (!listenedChild.has(v)) {
                    v.on('transform', onTransform);
                    listenedChild.add(v);
                }
                checkItem(v);
            });
            maxLength = Math.max(max + padEnd.value, 10);
            updatePosition();
            scroll.value?.update();
        };

        watch(() => props.loc, updateScroll);
        onUpdated(updateScroll);
        onMounted(updateScroll);
        onUnmounted(() => {
            listenedChild.forEach(v => v.off('transform', onTransform));
        });

        //#endregion

        //#region 渲染滚动

        const drawScroll = (canvas: MotaOffscreenCanvas2D) => {
            if (props.noscroll) return;
            const ctx = canvas.ctx;
            ctx.lineCap = 'round';
            ctx.lineWidth = 3;
            ctx.strokeStyle = scrollColor.value;
            ctx.beginPath();
            const scroll = transition.value.scroll;
            if (direction.value === ScrollDirection.Horizontal) {
                ctx.moveTo(scroll + 5, 5);
                ctx.lineTo(scroll + scrollLength - 5, 5);
            } else {
                ctx.moveTo(5, scroll + 5);
                ctx.lineTo(5, scroll + scrollLength - 5);
            }
            ctx.stroke();
        };

        const renderContent = (
            canvas: MotaOffscreenCanvas2D,
            children: RenderItem[],
            transform: Transform
        ) => {
            const ctx = canvas.ctx;
            ctx.save();
            if (direction.value === ScrollDirection.Horizontal) {
                ctx.translate(-contentPos, 0);
            } else {
                ctx.translate(0, -contentPos);
            }
            children.forEach(v => {
                if (v.hidden) return;
                v.renderContent(canvas, transform);
            });
            ctx.restore();
        };

        //#endregion

        //#region 事件监听

        // todo: 滑动操作时的滚动惯性

        const customPropagate = <T extends ActionType>(
            type: T,
            progress: EventProgress,
            event: ActionEventMap[T],
            _: ContainerCustom,
            origin: CustomContainerPropagateOrigin
        ) => {
            if (progress === EventProgress.Capture) {
                if (direction.value === ScrollDirection.Horizontal) {
                    event.offsetX += contentPos;
                } else {
                    event.offsetY += contentPos;
                }
            }
            origin(type, progress, event);
        };

        const wheelScroll = (delta: number, max: number) => {
            const sign = Math.sign(delta);
            const dx = Math.abs(delta);
            const movement = Math.min(max, dx) * sign;
            scrollTo(contentTarget + movement, dx > 10 ? 300 : 0);
        };

        const wheel = (ev: IWheelEvent) => {
            if (direction.value === ScrollDirection.Horizontal) {
                if (ev.wheelX !== 0) {
                    wheelScroll(ev.wheelX, width.value / 5);
                } else if (ev.wheelY !== 0) {
                    wheelScroll(ev.wheelY, width.value / 5);
                }
            } else {
                wheelScroll(ev.wheelY, height.value / 5);
            }
        };

        const getPos = (ev: IActionEvent, absolute: boolean = false) => {
            if (absolute) {
                if (direction.value === ScrollDirection.Horizontal) {
                    return ev.absoluteX;
                } else {
                    return ev.absoluteY;
                }
            } else {
                if (direction.value === ScrollDirection.Horizontal) {
                    return ev.offsetX;
                } else {
                    return ev.offsetY;
                }
            }
        };

        let identifier = -2;
        let downPos = 0;
        /** 拖动内容时，内容原本所在的位置 */
        let contentBefore = 0;

        const down = (ev: IActionEvent) => {
            identifier = ev.identifier;
            downPos = getPos(ev, true);
            contentBefore = contentTarget;
        };

        const move = (ev: IActionEvent) => {
            if (ev.identifier !== identifier) return;
            let pos = 0;
            if (ev.touch) {
                pos = getPos(ev);
            } else {
                if (ev.buttons & MouseType.Left) {
                    pos = getPos(ev);
                } else {
                    return;
                }
            }
            const movement = pos - downPos;
            scrollTo(contentBefore - movement, 0);
        };

        /** 最初滚动条在哪 */
        let scrollBefore = 0;
        /** 本次拖动滚动条的操作标识符 */
        let scrollIdentifier = -2;
        /** 点击滚动条时，点击位置在平行于滚动条方向的位置 */
        let scrollDownPos = 0;
        /** 是否是点击了滚动条区域中滚动条之外的地方，这样视为类滚轮操作 */
        let scrollMutate = false;
        /** 点击滚动条时，点击位置垂直于滚动条方向的位置 */
        let scrollPin = 0;

        /**
         * 获取点击滚动条时，垂直于滚动条方向的位置
         */
        const getScrollPin = (ev: IActionEvent) => {
            if (direction.value === ScrollDirection.Horizontal) {
                return ev.absoluteY;
            } else {
                return ev.absoluteX;
            }
        };

        const downScroll = (ev: IActionEvent) => {
            scrollBefore = contentTarget;
            scrollIdentifier = ev.identifier;
            const pos = getPos(ev, true);
            // 计算点击在了滚动条的哪个位置
            const offsetPos = getPos(ev);
            const sEnd = scrollPos + scrollLength;
            if (offsetPos >= scrollPos && offsetPos <= sEnd) {
                scrollDownPos = pos - scrollPos;
                scrollMutate = false;
                scrollPin = getScrollPin(ev);
            } else {
                scrollMutate = true;
            }
            scrollAlpha.set(0.9);
        };

        const moveScroll = (ev: IActionEvent) => {
            if (ev.identifier !== scrollIdentifier || scrollMutate) return;
            const pos = getPos(ev, true);
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
                scrollTo(scrollBefore, 0);
            } else {
                const pos = (scrollPos / height.value) * maxLength;
                scrollTo(pos, 0);
            }
        };

        const upScroll = (ev: IActionEvent) => {
            scrollAlpha.set(0.7);
            if (!scrollMutate) return;
            const pos = getPos(ev);
            if (pos < scrollPos) {
                scrollTo(contentTarget - 50, 300);
            } else {
                scrollTo(contentTarget + 50, 300);
            }
        };

        const enter = () => {
            scrollAlpha.set(0.7);
        };

        const leave = () => {
            scrollAlpha.set(0.5);
        };

        //#endregion

        onMounted(() => {
            scroll.value?.root?.on('move', move);
            scroll.value?.root?.on('move', moveScroll);
        });

        onUnmounted(() => {
            scroll.value?.root?.off('move', move);
            scroll.value?.root?.off('move', moveScroll);
            transition.ticker.destroy();
        });

        //#region expose 函数

        const getScrollLength = () => {
            return maxLength - height.value;
        };

        expose<ScrollExpose>({
            scrollTo,
            getScrollLength
        });

        //#endregion

        return () => {
            return (
                <container loc={props.loc} onWheel={wheel}>
                    <container-custom
                        loc={[0, 0, props.loc[2], props.loc[3]]}
                        ref={content}
                        onDown={down}
                        render={renderContent}
                        propagate={customPropagate}
                        zIndex={0}
                    >
                        {slots.default?.()}
                    </container-custom>
                    <sprite
                        nocache
                        hidden={props.noscroll}
                        loc={sp.value}
                        ref={scroll}
                        render={drawScroll}
                        onDown={downScroll}
                        onUp={upScroll}
                        zIndex={10}
                        onEnter={enter}
                        onLeave={leave}
                    ></sprite>
                </container>
            );
        };
    },
    scrollProps
);
