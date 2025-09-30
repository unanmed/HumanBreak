import {
    ElementLocator,
    IActionEvent,
    IActionEventBase,
    IWheelEvent,
    MotaOffscreenCanvas2D
} from '@motajs/render-core';
import { BaseProps } from '@motajs/render-vue';
import {
    GameUI,
    IUIMountable,
    SetupComponentOptions,
    UIComponentProps
} from '@motajs/system-ui';
import {
    computed,
    defineComponent,
    markRaw,
    onMounted,
    onUnmounted,
    ref,
    shallowRef,
    watch
} from 'vue';
import { FloorSelector } from '../components/floorSelect';
import {
    ILayerGroupRenderExtends,
    FloorDamageExtends,
    FloorItemDetail,
    LayerGroupAnimate,
    LayerGroup,
    LayerGroupFloorBinder
} from '../elements';
import { Font } from '@motajs/render-style';
import { clamp, mean } from 'lodash-es';
import { calculateStatisticsOne, StatisticsDataOneFloor } from './statistics';
import { Tip, TipExpose } from '../components';
import { useKey } from '../use';
import {
    ENABLE_RIGHT_STATUS_BAR,
    FULL_LOC,
    HALF_MAP_WIDTH,
    HALF_STATUS_WIDTH,
    MAIN_HEIGHT,
    MAP_HEIGHT,
    MAP_WIDTH,
    RIGHT_STATUS_POS,
    STATUS_BAR_HEIGHT,
    STATUS_BAR_WIDTH
} from '../shared';

export interface ViewMapProps extends UIComponentProps, BaseProps {
    loc: ElementLocator;
    floorId?: FloorIds;
}

const viewMapProps = {
    props: ['loc', 'floorId', 'controller', 'instance']
} satisfies SetupComponentOptions<ViewMapProps>;

export const ViewMap = defineComponent<ViewMapProps>(props => {
    const nowFloorId = core.status.floorId;

    const layerGroupExtends: ILayerGroupRenderExtends[] = [
        new FloorDamageExtends(),
        new FloorItemDetail(),
        new LayerGroupAnimate()
    ];

    const restHeight = STATUS_BAR_HEIGHT - 292;
    const col = restHeight / 4;
    const loc1: ElementLocator = [HALF_STATUS_WIDTH, col * 1 + 292];
    const loc2: ElementLocator = [HALF_STATUS_WIDTH, col * 2 + 292];
    const loc3: ElementLocator = [HALF_STATUS_WIDTH, col * 3 + 292];

    const rightFont = new Font(Font.defaultFamily, 15);

    const viewableFloor = markRaw(
        core.floorIds.filter(v => {
            return (
                !core.floors[v].cannotViewMap &&
                !core.status?.hero?.flags?.__removed__?.includes(v)
            );
        })
    );

    const group = ref<LayerGroup>();
    const tip = ref<TipExpose>();
    const statistics = shallowRef<StatisticsDataOneFloor>();

    const now = ref(0);
    if (props.floorId) {
        const index = viewableFloor.indexOf(props.floorId);
        if (index !== -1) now.value = index;
    }

    const floorId = computed(() => viewableFloor[now.value]);

    //#region 按键实现

    const [key] = useKey();
    key.realize('@viewMap_up', () => changeFloor(1), { type: 'down-repeat' })
        .realize('@viewMap_down', () => changeFloor(-1), {
            type: 'down-repeat'
        })
        .realize('@viewMap_up_ten', () => changeFloor(10))
        .realize('@viewMap_down_ten', () => changeFloor(-10))
        .realize('@viewMap_book', () => openBook())
        .realize('@viewMap_fly', () => fly())
        .realize('@viewMap_reset', () => resetCamera())
        .realize('confirm', () => close())
        .realize('exit', (_, code, assist) => {
            // 如果按键不能触发怪物手册，则关闭界面，因为怪物手册和退出默认使用同一个按键，需要特判
            if (!key.willEmit(code, assist, 'book')) {
                props.controller.close(props.instance);
            }
        });

    //#region 功能函数

    const close = () => {
        props.controller.close(props.instance);
    };

    const format = (num?: number) => {
        return core.formatBigNumber(num ?? 0, 6);
    };

    const changeTo = (index: number) => {
        const res = clamp(index, 0, viewableFloor.length - 1);
        now.value = res;
    };

    const changeFloor = (delta: number) => {
        changeTo(now.value + delta);
    };

    const openBook = () => core.openBook(true);

    const fly = () => {
        if (!core.hasItem('fly')) return;
        const id = viewableFloor[now.value];
        const success = core.flyTo(id);
        if (success) close();
        else tip.value?.drawTip(`无法飞往${core.floors[id].title}`);
    };

    const resetCamera = () => {
        group.value?.camera.reset();
        group.value?.update();
    };

    //#region 渐变渲染

    const topAlpha = ref(0.7);
    const bottomAlpha = ref(0.7);

    let topGradient: CanvasGradient | null = null;
    let bottomGradient: CanvasGradient | null = null;

    const getTopGradient = (ctx: CanvasRenderingContext2D) => {
        if (topGradient) return topGradient;
        topGradient = ctx.createLinearGradient(0, 0, 0, 64);
        topGradient.addColorStop(0, 'rgba(0,0,0,1)');
        topGradient.addColorStop(0.75, 'rgba(0,0,0,0.5)');
        topGradient.addColorStop(1, 'rgba(0,0,0,0)');
        return topGradient;
    };

    const getBottomGradient = (ctx: CanvasRenderingContext2D) => {
        if (bottomGradient) return bottomGradient;
        bottomGradient = ctx.createLinearGradient(0, 64, 0, 0);
        bottomGradient.addColorStop(0, 'rgba(0,0,0,1)');
        bottomGradient.addColorStop(0.75, 'rgba(0,0,0,0.5)');
        bottomGradient.addColorStop(1, 'rgba(0,0,0,0)');
        return bottomGradient;
    };

    const renderTop = (canvas: MotaOffscreenCanvas2D) => {
        const ctx = canvas.ctx;
        ctx.fillStyle = getTopGradient(ctx);
        ctx.fillRect(0, 0, MAP_WIDTH, 64);
    };

    const renderBottom = (canvas: MotaOffscreenCanvas2D) => {
        const ctx = canvas.ctx;
        ctx.fillStyle = getBottomGradient(ctx);
        ctx.fillRect(0, 0, MAP_HEIGHT, 64);
    };

    const enterTop = () => (topAlpha.value = 0.9);
    const enterBottom = () => (bottomAlpha.value = 0.9);
    const leaveTop = () => (topAlpha.value = 0.7);
    const leaveBottom = () => (bottomAlpha.value = 0.7);

    //#region 地图渲染

    const renderLayer = (floorId: FloorIds) => {
        const binder = group.value?.getExtends(
            'floor-binder'
        ) as LayerGroupFloorBinder;
        binder.bindFloor(floorId);
        group.value?.camera.reset();
        core.status.floorId = floorId;
        core.status.thisMap = core.status.maps[floorId];
        statistics.value = calculateStatisticsOne(floorId);
    };

    const moveCamera = (dx: number, dy: number) => {
        const camera = group.value?.camera;
        if (!camera) return;
        camera.translate(dx / camera.scaleX, dy / camera.scaleX);
        group.value?.update();
    };

    const scaleCamera = (scale: number, x: number, y: number) => {
        const camera = group.value?.camera;
        if (!camera) return;
        const [cx, cy] = camera.untransformed(x, y);
        camera.translate(cx, cy);
        camera.scale(scale);
        camera.translate(-cx, -cy);
        group.value?.update();
    };

    //#region 事件监听

    const clickTop = (ev: IActionEvent) => {
        const col = MAP_WIDTH / 3;
        if (ev.offsetX < col * 2) {
            changeFloor(1);
        } else {
            resetCamera();
        }
    };

    const clickBottom = (ev: IActionEvent) => {
        const col = MAP_WIDTH / 3;
        if (ev.offsetX < col) {
            openBook();
        } else if (ev.offsetX < col * 2) {
            changeFloor(-1);
        } else {
            fly();
        }
    };

    //#region 地图交互

    let mouseDown = false;
    let moved = false;
    let scaled = false;
    let lastMoveX = 0;
    let lastMoveY = 0;
    let lastDis = 0;
    let movement = 0;

    const touches = new Map<number, IActionEvent>();

    const downMap = (ev: IActionEvent) => {
        moved = false;
        lastMoveX = ev.offsetX;
        lastMoveY = ev.offsetY;
        movement = 0;

        if (ev.touch) {
            touches.set(ev.identifier, ev);
            if (touches.size >= 2) {
                const [touch1, touch2] = touches.values();
                lastDis = Math.hypot(
                    touch1.offsetX - touch2.offsetX,
                    touch1.offsetY - touch2.offsetY
                );
            }
        } else {
            mouseDown = true;
        }
    };

    const upMap = (ev: IActionEvent) => {
        if (ev.touch) {
            touches.delete(ev.identifier);
        } else {
            mouseDown = false;
        }
        if (touches.size === 0) {
            scaled = false;
        }
    };

    const move = (ev: IActionEvent) => {
        if (moved) {
            const dx = ev.offsetX - lastMoveX;
            const dy = ev.offsetY - lastMoveY;
            movement += Math.hypot(dx, dy);
            moveCamera(dx, dy);
        }
        moved = true;
        lastMoveX = ev.offsetX;
        lastMoveY = ev.offsetY;
    };

    const moveMap = (ev: IActionEvent) => {
        if (ev.touch) {
            if (touches.size === 0) return;
            else if (touches.size === 1) {
                // 移动
                if (scaled) return;
                move(ev);
            } else {
                // 缩放
                const [touch1, touch2] = touches.values();
                const cx = mean([touch1.offsetX, touch2.offsetX]);
                const cy = mean([touch1.offsetY, touch2.offsetY]);
                const dis = Math.hypot(
                    touch1.offsetX - touch2.offsetX,
                    touch1.offsetY - touch2.offsetY
                );
                const scale = dis / lastDis;
                if (!scaled) {
                    lastDis = dis;
                    return;
                }
                if (!isFinite(scale) || scale === 0) return;
                scaleCamera(scale, cx, cy);
            }
        } else {
            if (mouseDown) {
                move(ev);
            }
        }
    };

    const leaveMap = (ev: IActionEventBase) => {
        if (ev.touch) {
            touches.delete(ev.identifier);
        } else {
            mouseDown = false;
        }
    };

    const wheelMap = (ev: IWheelEvent) => {
        if (ev.altKey) {
            const scale = ev.wheelY < 0 ? 1.1 : 0.9;
            scaleCamera(scale, ev.offsetX, ev.offsetY);
        } else if (ev.ctrlKey) {
            changeFloor(-Math.sign(ev.wheelY) * 10);
        } else {
            changeFloor(-Math.sign(ev.wheelY));
        }
    };

    const clickMap = (ev: IActionEvent) => {
        if (movement > 5) return;
        if (ev.touch) {
            if (touches.size === 0) {
                close();
            }
        } else {
            close();
        }
    };

    onMounted(() => {
        renderLayer(floorId.value);
    });

    onUnmounted(() => {
        core.status.floorId = nowFloorId;
        core.status.thisMap = core.status.maps[nowFloorId];
    });

    watch(floorId, value => {
        renderLayer(value);
    });

    //#region 组件树

    return () => (
        <container loc={props.loc} nocache>
            <g-rect fillStyle="black" fill loc={FULL_LOC} />
            <g-rect stroke zIndex={100} loc={FULL_LOC} noevent />
            <g-line
                line={[STATUS_BAR_WIDTH, 0, STATUS_BAR_WIDTH, MAIN_HEIGHT]}
                lineWidth={1}
            />
            <g-line
                line={[RIGHT_STATUS_POS, 0, RIGHT_STATUS_POS, MAIN_HEIGHT]}
                lineWidth={1}
            />
            <FloorSelector
                loc={[0, 0, STATUS_BAR_WIDTH, MAIN_HEIGHT]}
                floors={viewableFloor}
                v-model:now={now.value}
                onClose={close}
            />
            <layer-group
                ref={group}
                ex={layerGroupExtends}
                loc={[STATUS_BAR_WIDTH, 0, MAP_WIDTH, MAP_HEIGHT]}
                onDown={downMap}
                onMove={moveMap}
                onUp={upMap}
                onLeave={leaveMap}
                onWheel={wheelMap}
                onClick={clickMap}
            >
                <layer layer="bg" zIndex={10}></layer>
                <layer layer="bg2" zIndex={20}></layer>
                <layer layer="event" zIndex={30}></layer>
                <layer layer="fg" zIndex={40}></layer>
                <layer layer="fg2" zIndex={50}></layer>
            </layer-group>
            <Tip
                ref={tip}
                zIndex={40}
                loc={[STATUS_BAR_WIDTH + 8, 8, 200, 32]}
                pad={[12, 6]}
                corner={16}
            />
            <sprite
                loc={[STATUS_BAR_WIDTH, 0, MAP_WIDTH, 64]}
                render={renderTop}
                alpha={topAlpha.value}
                zIndex={10}
                cursor="pointer"
                onEnter={enterTop}
                onLeave={leaveTop}
                onClick={clickTop}
            />
            <sprite
                loc={[STATUS_BAR_WIDTH, MAP_HEIGHT - 64, MAP_WIDTH, 64]}
                render={renderBottom}
                alpha={bottomAlpha.value}
                zIndex={10}
                cursor="pointer"
                onEnter={enterBottom}
                onLeave={leaveBottom}
                onClick={clickBottom}
            />
            <text
                text="上移地图"
                loc={[HALF_MAP_WIDTH + STATUS_BAR_WIDTH, 24]}
                anc={[0.5, 0.5]}
                zIndex={20}
                noevent
            />
            <text
                text="下移地图"
                loc={[HALF_MAP_WIDTH + STATUS_BAR_WIDTH, MAP_HEIGHT - 24]}
                anc={[0.5, 0.5]}
                zIndex={20}
                noevent
            />
            <text
                text="「 怪物手册 」"
                loc={[32 + STATUS_BAR_WIDTH, MAP_HEIGHT - 24]}
                anc={[0, 0.5]}
                zIndex={20}
                noevent
            />
            <text
                text="「 传送至此 」"
                loc={[RIGHT_STATUS_POS - 32, MAP_HEIGHT - 24]}
                anc={[1, 0.5]}
                zIndex={20}
                noevent
            />
            <text
                text="「 重置视角 」"
                loc={[RIGHT_STATUS_POS - 32, 24]}
                anc={[1, 0.5]}
                zIndex={20}
                noevent
            />
            <container
                loc={[RIGHT_STATUS_POS, 0, STATUS_BAR_WIDTH, STATUS_BAR_HEIGHT]}
                hidden={!ENABLE_RIGHT_STATUS_BAR}
            >
                <text
                    text="鼠标 / 单指拖动地图"
                    font={rightFont}
                    loc={[90, 24]}
                    anc={[0.5, 0.5]}
                    fillStyle="yellow"
                />
                <text
                    text="Alt+滚轮 / 双指缩放地图"
                    font={rightFont}
                    loc={[90, 48]}
                    anc={[0.5, 0.5]}
                    fillStyle="yellow"
                />
                <text
                    text="Ctrl+滚轮 / 滚轮切换地图"
                    font={rightFont}
                    loc={[90, 72]}
                    anc={[0.5, 0.5]}
                    fillStyle="yellow"
                />
                <g-line line={[12, 96, 168, 96]} lineWidth={1} />
                <text
                    text={`怪物数量：${statistics.value?.enemyCount}`}
                    loc={[20, 120]}
                    anc={[0, 0.5]}
                />
                <text
                    text={`血瓶数量：${statistics.value?.potionCount}`}
                    loc={[20, 144]}
                    anc={[0, 0.5]}
                />
                <text
                    text={`宝石数量：${statistics.value?.gemCount}`}
                    loc={[20, 168]}
                    anc={[0, 0.5]}
                />
                <text
                    text={`血瓶数值：${format(statistics.value?.potionValue)}`}
                    loc={[20, 192]}
                    anc={[0, 0.5]}
                />
                <text
                    text={`攻击数值：${format(statistics.value?.atkValue)}`}
                    loc={[20, 216]}
                    anc={[0, 0.5]}
                />
                <text
                    text={`防御数值：${format(statistics.value?.defValue)}`}
                    loc={[20, 240]}
                    anc={[0, 0.5]}
                />
                <text
                    text={`智慧数值：${format(statistics.value?.mdefValue)}`}
                    loc={[20, 264]}
                    anc={[0, 0.5]}
                />
                <g-line line={[12, 292, 168, 292]} lineWidth={1} />
                <text
                    text="「 怪物手册 」"
                    loc={loc1}
                    anc={[0.5, 0.5]}
                    cursor="pointer"
                    onClick={openBook}
                />
                <text
                    text="「 传送至此 」"
                    loc={loc2}
                    anc={[0.5, 0.5]}
                    cursor="pointer"
                    onClick={fly}
                />
                <text
                    text="「 重置视角 」"
                    loc={loc3}
                    anc={[0.5, 0.5]}
                    cursor="pointer"
                    onClick={resetCamera}
                />
            </container>
        </container>
    );
}, viewMapProps);

export const ViewMapUI = new GameUI('view-map', ViewMap);

export function openViewMap(
    controller: IUIMountable,
    loc: ElementLocator,
    props?: ViewMapProps
) {
    controller.open(ViewMapUI, {
        ...props,
        loc,
        floorId: core.status.floorId
    });
}
