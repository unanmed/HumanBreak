import { DefaultProps } from '@motajs/render-vue';
import { SetupComponentOptions } from '@motajs/system-ui';
import { clamp, isNil } from 'lodash-es';
import { computed, defineComponent, ref, watch } from 'vue';
import { Scroll, ScrollExpose } from './scroll';
import { Font } from '@motajs/render-style';
import { MotaOffscreenCanvas2D } from '@motajs/render-core';

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

    const now = ref(props.now ?? 0);
    const selList = ref(0);

    const scrollRef = ref<ScrollExpose>();

    const floorId = computed(() => props.floors[now.value]);
    const floorName = computed(() => core.floors[floorId.value].title);

    watch(
        () => props.now,
        value => {
            if (!isNil(value)) now.value = value;
        }
    );

    let gradient: CanvasGradient | null = null;

    const getGradient = (ctx: CanvasRenderingContext2D) => {
        if (gradient) return gradient;
        gradient = ctx.createLinearGradient(0, 0, 0, 200);
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

    const changeTo = (index: number) => {
        const res = clamp(index, 0, props.floors.length - 1);
        now.value = res;
        selList.value = res;
        const y = res * 24;
        scrollRef.value?.scrollTo(y, 500);
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

    return () => (
        <container>
            <text text={floorName.value} loc={[90, 24]} anc={[0.5, 0.5]} />
            <g-line line={[48, 40, 132, 40]} lineWidth={1} />
            <g-line line={[48, 440, 132, 440]} lineWidth={1} />
            <text
                text="退出"
                loc={[90, 456]}
                anc={[0.5, 0.5]}
                cursor="pointer"
                onClick={close}
            />
            <text
                text="「 上移十层 」"
                loc={[90, 70]}
                anc={[0.5, 0.5]}
                cursor="pointer"
                onClick={() => changeFloor(-10)}
            />
            <text
                text="「 上移一层 」"
                loc={[90, 110]}
                anc={[0.5, 0.5]}
                cursor="pointer"
                onClick={() => changeFloor(-1)}
            />
            <text
                text="「 下移一层 」"
                loc={[90, 370]}
                anc={[0.5, 0.5]}
                cursor="pointer"
                onClick={() => changeFloor(1)}
            />
            <text
                text="「 下移十层 」"
                loc={[90, 410]}
                anc={[0.5, 0.5]}
                cursor="pointer"
                onClick={() => changeFloor(10)}
            />
            <container loc={[0, 140, 144, 200]}>
                <Scroll
                    ref={scrollRef}
                    loc={[0, 0, 144, 200]}
                    noscroll
                    zIndex={10}
                    padEnd={88}
                >
                    {props.floors.map((v, i) => {
                        const floor = core.floors[v];
                        const highlight =
                            now.value === i || selList.value === i;
                        const color = highlight ? '#fff' : '#aaa';
                        const fill = highlight ? '#fff' : '#000';
                        return (
                            <container
                                nocache
                                loc={[0, i * 24 + 88, 144, 24]}
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
                                    onLeave={() => enterList(now.value)}
                                    onClick={() => changeTo(i)}
                                />
                                <g-circle
                                    stroke
                                    fill
                                    lineWidth={1}
                                    circle={[130, 12, 3]}
                                    strokeStyle={color}
                                    fillStyle={now.value === i ? fill : '#000'}
                                />
                            </container>
                        );
                    })}
                </Scroll>
                <g-line
                    line={[130, 0, 130, 200]}
                    zIndex={5}
                    lineWidth={1}
                    strokeStyle="#aaa"
                />
                <sprite
                    zIndex={20}
                    loc={[0, 0, 144, 200]}
                    nocache
                    noevent
                    render={renderMask}
                    composite="destination-in"
                />
            </container>
        </container>
    );
}, floorSelectorProps);
