import { DefaultProps } from '@motajs/render-vue';
import { SetupComponentOptions } from '@motajs/system-ui';
import { clamp, isNil } from 'lodash-es';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { Scroll, ScrollExpose } from './scroll';
import { Font } from '@motajs/render-style';
import { MotaOffscreenCanvas2D } from '@motajs/render-core';
import {
    HALF_STATUS_WIDTH,
    STATUS_BAR_HEIGHT,
    STATUS_BAR_WIDTH
} from '../shared';

const SCROLL_HEIGHT = STATUS_BAR_HEIGHT - 280;
const HALF_HEIGHT = SCROLL_HEIGHT / 2;

export interface FloorSelectorProps extends DefaultProps {
    floors: FloorIds[];
    now?: number;
}

export type FloorSelectorEmits = {
    /**
     * 点击关闭按钮时触发
     */
    close: () => void;

    /**
     * 当选中的楼层改变时触发
     * @param floor 楼层索引
     * @param floorId 楼层 id
     */
    update: (floor: number, floorId: FloorIds) => void;

    'update:now': (value: number) => void;
};

const floorSelectorProps = {
    props: ['floors', 'now'],
    emits: ['close', 'update', 'update:now']
} satisfies SetupComponentOptions<
    FloorSelectorProps,
    FloorSelectorEmits,
    keyof FloorSelectorEmits
>;

export const FloorSelector = defineComponent<
    FloorSelectorProps,
    FloorSelectorEmits,
    keyof FloorSelectorEmits
>((props, { emit }) => {
    const listFont = new Font(Font.defaultFamily, 12);

    /** 当前选中楼层，不反向 */
    const now = ref(props.now ?? 0);
    /** 当前鼠标选中楼层，反向 */
    const selList = ref(0);

    const scrollRef = ref<ScrollExpose>();

    const floors = computed(() => props.floors.toReversed());
    const floorId = computed(() => props.floors[now.value]);
    const floorName = computed(() => core.floors[floorId.value].title);

    watch(
        () => props.now,
        value => {
            if (!isNil(value)) {
                changeTo(value);
            }
        }
    );

    let gradient: CanvasGradient | null = null;

    const getGradient = (ctx: CanvasRenderingContext2D) => {
        if (gradient) return gradient;
        gradient = ctx.createLinearGradient(0, 0, 0, SCROLL_HEIGHT);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.8, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        return gradient;
    };

    const renderMask = (canvas: MotaOffscreenCanvas2D) => {
        const { ctx } = canvas;
        const gradient = getGradient(ctx);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 144, 200);
    };

    const changeTo = (index: number, time: number = 500) => {
        // 取反是为了符合 2.x 的操作习惯
        const res = clamp(index, 0, floors.value.length - 1);
        const reversed = floors.value.length - res - 1;
        now.value = res;
        selList.value = reversed;
        const y = reversed * 24;
        scrollRef.value?.scrollTo(y, time);
        emit('update', now.value, floorId.value);
        emit('update:now', now.value);
    };

    const changeFloor = (delta: number) => {
        changeTo(now.value + delta);
    };

    const enterList = (index: number) => {
        selList.value = index;
    };

    const close = () => {
        emit('close');
    };

    onMounted(() => {
        changeTo(now.value, 0);
    });

    return () => (
        <container>
            <text
                text={floorName.value}
                loc={[HALF_STATUS_WIDTH, 24]}
                anc={[0.5, 0.5]}
            />
            <g-line line={[48, 40, STATUS_BAR_WIDTH - 48, 40]} lineWidth={1} />
            <g-line
                line={[
                    48,
                    STATUS_BAR_HEIGHT - 40,
                    STATUS_BAR_WIDTH - 48,
                    STATUS_BAR_HEIGHT - 40
                ]}
                lineWidth={1}
            />
            <text
                text="退出"
                loc={[90, STATUS_BAR_HEIGHT - 24]}
                anc={[0.5, 0.5]}
                cursor="pointer"
                onClick={close}
            />
            <text
                text="「 上移十层 」"
                loc={[90, 70]}
                anc={[0.5, 0.5]}
                cursor="pointer"
                onClick={() => changeFloor(10)}
            />
            <text
                text="「 上移一层 」"
                loc={[90, 110]}
                anc={[0.5, 0.5]}
                cursor="pointer"
                onClick={() => changeFloor(1)}
            />
            <text
                text="「 下移一层 」"
                loc={[90, STATUS_BAR_HEIGHT - 110]}
                anc={[0.5, 0.5]}
                cursor="pointer"
                onClick={() => changeFloor(-1)}
            />
            <text
                text="「 下移十层 」"
                loc={[90, STATUS_BAR_HEIGHT - 70]}
                anc={[0.5, 0.5]}
                cursor="pointer"
                onClick={() => changeFloor(-10)}
            />
            <container loc={[0, 140, 144, SCROLL_HEIGHT]}>
                <Scroll
                    ref={scrollRef}
                    loc={[0, 0, 144, SCROLL_HEIGHT]}
                    noscroll
                    zIndex={10}
                    padEnd={HALF_HEIGHT - 12}
                >
                    {floors.value.map((v, i, a) => {
                        const floor = core.floors[v];
                        const reversed = a.length - i - 1;
                        const nowFloor = a.length - now.value - 1;
                        const highlight = nowFloor === i || selList.value === i;
                        const color = highlight ? '#fff' : '#aaa';
                        const fill = highlight ? '#fff' : '#000';
                        return (
                            <container
                                nocache
                                loc={[0, i * 24 + HALF_HEIGHT - 12, 144, 24]}
                                key={v}
                            >
                                <text
                                    cursor="pointer"
                                    text={floor.title}
                                    loc={[114, 12]}
                                    anc={[1, 0.5]}
                                    font={listFont}
                                    fillStyle={color}
                                    onEnter={() => enterList(i)}
                                    onLeave={() => enterList(nowFloor)}
                                    onClick={() => changeTo(reversed)}
                                />
                                <g-circle
                                    stroke
                                    fill
                                    lineWidth={1}
                                    circle={[130, 12, 3]}
                                    strokeStyle={color}
                                    fillStyle={nowFloor === i ? fill : '#000'}
                                />
                            </container>
                        );
                    })}
                </Scroll>
                <g-line
                    line={[130, 0, 130, SCROLL_HEIGHT]}
                    zIndex={5}
                    lineWidth={1}
                    strokeStyle="#aaa"
                />
                <sprite
                    zIndex={20}
                    loc={[0, 0, 144, SCROLL_HEIGHT]}
                    nocache
                    noevent
                    render={renderMask}
                    composite="destination-in"
                />
            </container>
        </container>
    );
}, floorSelectorProps);
