import {
    Props,
    Font,
    IActionEvent,
    MotaOffscreenCanvas2D,
    Sprite,
    onTick,
    transformCanvas
} from '@motajs/render';
import { WeatherController } from '../weather';
import {
    defineComponent,
    onMounted,
    onUnmounted,
    reactive,
    ref,
    shallowRef
} from 'vue';
import { Textbox, Tip } from '../components';
import { GameUI } from '@motajs/system-ui';
import {
    ENABLE_RIGHT_STATUS_BAR,
    MAIN_HEIGHT,
    MAIN_WIDTH,
    MAP_HEIGHT,
    MAP_WIDTH,
    RIGHT_STATUS_POS,
    STATUS_BAR_HEIGHT,
    STATUS_BAR_WIDTH
} from '../shared';
import {
    ILeftHeroStatus,
    IRightHeroStatus,
    LeftStatusBar,
    RightStatusBar
} from './statusBar';
import { ReplayingStatus } from './toolbar';
import { getHeroStatusOn } from '@user/data-state';
import { hook } from '@user/data-base';
import { FloorDamageExtends, FloorItemDetail } from '../elements';
import { FloorChange } from '../legacy/fallback';
import { mainUIController } from './controller';
import {
    ILayerGroupRenderExtends,
    LayerGroupAnimate,
    FloorViewport,
    ILayerRenderExtends,
    HeroRenderer,
    LayerDoorAnimate,
    LayerGroup
} from '../elements';
import { isNil } from 'lodash-es';

const MainScene = defineComponent(() => {
    //#region 基本定义
    const layerGroupExtends: ILayerGroupRenderExtends[] = [
        new FloorDamageExtends(),
        new FloorItemDetail(),
        new LayerGroupAnimate(),
        new FloorViewport()
    ];
    const eventExtends: ILayerRenderExtends[] = [
        new HeroRenderer(),
        new LayerDoorAnimate()
    ];
    const mainTextboxProps: Props<typeof Textbox> = {
        text: '',
        hidden: true,
        loc: [0, MAP_HEIGHT - 150, MAP_WIDTH, 150],
        zIndex: 30,
        fillStyle: '#fff',
        titleFill: 'gold',
        font: new Font('normal'),
        titleFont: new Font('normal', 20, 'px', 700),
        winskin: 'winskin.png',
        interval: 30,
        lineHeight: 4,
        width: MAP_WIDTH
    };

    const map = shallowRef<LayerGroup>();
    const hideStatus = ref(false);
    const locked = ref(false);
    const weather = new WeatherController();
    weather.extern('main');

    onMounted(() => {
        if (map.value) {
            weather.bind(map.value);
        }
    });

    const replayStatus: ReplayingStatus = reactive({
        replaying: false,
        playing: false,
        speed: 1,
        played: 0,
        total: 0
    });
    const leftStatus: ILeftHeroStatus = reactive({
        hp: 0,
        hpmax: 0,
        mana: 0,
        manamax: 0,
        atk: 0,
        def: 0,
        mdef: 0,
        money: 0,
        exp: 0,
        up: 0,
        yellowKey: 0,
        blueKey: 0,
        redKey: 0,
        greenKey: 0,
        pickaxe: 0,
        bomb: 0,
        centerFly: 0,
        poison: false,
        weak: false,
        curse: false,
        floor: 'MT0',
        lv: '',
        replay: replayStatus
    });
    const rightStatus: IRightHeroStatus = reactive({
        exampleHard: 0
    });

    //#region 状态更新
    const updateStatus = () => {
        if (!core.status || !core.status.hero || !core.status.floorId) return;
        hideStatus.value = core.getFlag('hideStatusBar', false);

        const hero = core.status.hero;
        leftStatus.atk = getHeroStatusOn('atk');
        leftStatus.hp = getHeroStatusOn('hp');
        leftStatus.hpmax = getHeroStatusOn('hpmax');
        leftStatus.mana = getHeroStatusOn('mana');
        leftStatus.manamax = getHeroStatusOn('manamax');
        leftStatus.def = getHeroStatusOn('def');
        leftStatus.mdef = getHeroStatusOn('mdef');
        leftStatus.money = getHeroStatusOn('money');
        leftStatus.exp = getHeroStatusOn('exp');
        leftStatus.up = core.getNextLvUpNeed() ?? 0;
        leftStatus.yellowKey = core.itemCount('yellowKey');
        leftStatus.blueKey = core.itemCount('blueKey');
        leftStatus.redKey = core.itemCount('redKey');
        leftStatus.greenKey = core.itemCount('greenKey');
        leftStatus.pickaxe = core.itemCount('pickaxe');
        leftStatus.bomb = core.itemCount('bomb');
        leftStatus.centerFly = core.itemCount('centerFly');
        leftStatus.poison = core.getFlag('poison', true);
        leftStatus.weak = core.getFlag('weak', true);
        leftStatus.curse = core.getFlag('curse', true);
        leftStatus.floor = core.status.floorId;
        leftStatus.lv = core.getLvName(hero.lv);

        const { pausing, speed, toReplay, totalList } = core.status.replay;
        replayStatus.replaying = core.isReplaying();
        replayStatus.playing = !pausing;
        replayStatus.speed = speed;
        replayStatus.played = totalList.length - toReplay.length;
        replayStatus.total = totalList.length;

        rightStatus.exampleHard = flags.hard;
    };

    const updateDataFallback = () => {
        // 更新 locked 状态
        locked.value = core.status.lockControl;
    };

    // 监听状态栏更新事件
    hook.on('statusBarUpdate', updateStatus);
    hook.on('statusBarUpdate', updateDataFallback);

    onUnmounted(() => {
        hook.off('statusBarUpdate', updateStatus);
        hook.off('statusBarUpdate', updateDataFallback);
    });

    //#region sprite 渲染

    let lastLength = 0;
    onTick(() => {
        const len = core.status.stepPostfix?.length ?? 0;
        if (len !== lastLength) {
            mapMiscSprite.value?.update();
            lastLength = len;
        }
    });

    const mapMiscSprite = ref<Sprite>();

    const renderMapMisc = (canvas: MotaOffscreenCanvas2D) => {
        const step = core.status.stepPostfix;
        const camera = map.value?.camera;
        if (!step || !camera) return;
        transformCanvas(canvas, camera);
        const ctx = canvas.ctx;
        ctx.fillStyle = '#fff';
        step.forEach(({ x, y, direction }) => {
            ctx.fillRect(x * 32 + 12, y * 32 + 12, 8, 8);
            if (!isNil(direction)) {
                switch (direction) {
                    case 'down':
                        ctx.fillRect(x * 32 + 12, y * 32 + 20, 8, 12);
                        break;
                    case 'left':
                        ctx.fillRect(x * 32, y * 32 + 12, 12, 8);
                        break;
                    case 'right':
                        ctx.fillRect(x * 32 + 20, y * 32 + 12, 12, 8);
                        break;
                    case 'up':
                        ctx.fillRect(x * 32 + 12, y * 32, 8, 12);
                        break;
                }
            }
        });
    };

    //#region 交互监听

    /**
     * 对于 registerAction 的 fallback
     */
    const clickMap = (ev: IActionEvent) => {
        const bx = Math.floor(ev.offsetX / 32);
        const by = Math.floor(ev.offsetY / 32);
        core.doRegisteredAction('onup', bx, by, ev.offsetX, ev.offsetY);
    };

    /**
     * 对于 registerAction 的 fallback
     */
    const downMap = (ev: IActionEvent) => {
        const bx = Math.floor(ev.offsetX / 32);
        const by = Math.floor(ev.offsetY / 32);
        core.doRegisteredAction('ondown', bx, by, ev.offsetX, ev.offsetY);
    };

    /**
     * 对于 registerAction 的 fallback
     */
    const moveMap = (ev: IActionEvent) => {
        const bx = Math.floor(ev.offsetX / 32);
        const by = Math.floor(ev.offsetY / 32);
        core.doRegisteredAction('onmove', bx, by, ev.offsetX, ev.offsetY);
    };

    return () => (
        <container
            id="main-scene"
            width={MAIN_WIDTH}
            height={MAIN_HEIGHT}
            noanti
            nocache
        >
            <LeftStatusBar
                loc={[0, 0, STATUS_BAR_WIDTH, STATUS_BAR_HEIGHT]}
                status={leftStatus}
                hidden={hideStatus.value}
            ></LeftStatusBar>
            <g-line
                line={[STATUS_BAR_WIDTH, 0, STATUS_BAR_WIDTH, MAIN_HEIGHT]}
                lineWidth={1}
            />
            <container
                id="map-draw"
                loc={[STATUS_BAR_WIDTH, 0, MAP_WIDTH, MAP_HEIGHT]}
                zIndex={10}
                onClick={clickMap}
                onDown={downMap}
                onMove={moveMap}
                noanti
            >
                <layer-group id="layer-main" ex={layerGroupExtends} ref={map}>
                    <layer layer="bg" zIndex={10}></layer>
                    <layer layer="bg2" zIndex={20}></layer>
                    <layer layer="event" zIndex={30} ex={eventExtends}></layer>
                    <layer layer="fg" zIndex={40}></layer>
                    <layer layer="fg2" zIndex={50}></layer>
                </layer-group>
                <Textbox id="main-textbox" {...mainTextboxProps}></Textbox>
                <FloorChange id="floor-change" zIndex={50}></FloorChange>
                <Tip
                    id="main-tip"
                    zIndex={80}
                    loc={[8, 8, 200, 32]}
                    pad={[12, 6]}
                    corner={16}
                />
                <sprite
                    noevent
                    loc={[0, 0, MAP_WIDTH, MAP_HEIGHT]}
                    ref={mapMiscSprite}
                    zIndex={170}
                    render={renderMapMisc}
                />
            </container>
            <g-line
                line={[RIGHT_STATUS_POS, 0, RIGHT_STATUS_POS, MAP_HEIGHT]}
                lineWidth={1}
            />
            <RightStatusBar
                loc={[RIGHT_STATUS_POS, 0, STATUS_BAR_WIDTH, STATUS_BAR_HEIGHT]}
                status={rightStatus}
                hidden={hideStatus.value && ENABLE_RIGHT_STATUS_BAR}
            ></RightStatusBar>
            <container
                loc={[0, 0, MAIN_WIDTH, MAIN_HEIGHT]}
                hidden={!mainUIController.active.value}
                zIndex={200}
            >
                {mainUIController.render()}
            </container>
            <g-rect
                loc={[0, 0, MAIN_WIDTH, MAIN_HEIGHT]}
                hidden={hideStatus.value}
                zIndex={100}
                stroke
                noevent
            ></g-rect>
            <g-line
                line={[STATUS_BAR_WIDTH, 0, RIGHT_STATUS_POS, 0]}
                hidden={!hideStatus.value}
                zIndex={100}
            />
            <g-line
                line={[
                    STATUS_BAR_WIDTH,
                    MAP_HEIGHT,
                    RIGHT_STATUS_POS,
                    MAP_HEIGHT
                ]}
                hidden={!hideStatus.value}
                zIndex={100}
            />
        </container>
    );
});

export const MainSceneUI = new GameUI('main-scene', MainScene);
