import { LayerShadowExtends } from '@/core/fx/shadow';
import {
    ILayerGroupRenderExtends,
    FloorDamageExtends,
    LayerGroupAnimate,
    FloorViewport,
    ILayerRenderExtends,
    HeroRenderer,
    LayerDoorAnimate,
    Props,
    LayerGroup
} from '@/core/render';
import { WeatherController } from '@/module/weather';
import { FloorChange } from '@/plugin/fallback';
import { LayerGroupFilter } from '@/plugin/fx/gameCanvas';
import { LayerGroupHalo } from '@/plugin/fx/halo';
import { FloorItemDetail } from '@/plugin/fx/itemDetail';
import { PopText } from '@/plugin/fx/pop';
import { LayerGroupPortal } from '@/plugin/fx/portal';
import { defineComponent, onMounted, reactive, ref } from 'vue';
import { Textbox } from '../components';
import { GameUI, UIController } from '@/core/system';
import {
    MAIN_HEIGHT,
    MAIN_WIDTH,
    STATUS_BAR_HEIGHT,
    STATUS_BAR_WIDTH
} from '../shared';
import {
    ILeftHeroStatus,
    IRightHeroStatus,
    LeftStatusBar,
    RightStatusBar
} from './statusBar';
import { onLoaded } from '../use';
import { ReplayingStatus } from './toolbar';

const MainScene = defineComponent(() => {
    const layerGroupExtends: ILayerGroupRenderExtends[] = [
        new FloorDamageExtends(),
        new FloorItemDetail(),
        new LayerGroupFilter(),
        new LayerGroupPortal(),
        new LayerGroupHalo(),
        new LayerGroupAnimate(),
        new FloorViewport()
    ];
    const eventExtends: ILayerRenderExtends[] = [
        new HeroRenderer(),
        new LayerDoorAnimate(),
        new LayerShadowExtends()
    ];
    const mapDrawProps: Props<'container'> = {
        width: core._PX_,
        height: core._PY_
    };
    const mainTextboxProps: Props<typeof Textbox> = {
        text: '',
        hidden: true,
        width: 480,
        height: 150,
        y: 330,
        zIndex: 30,
        fillStyle: '#fff',
        titleFill: 'gold',
        fontFamily: 'normal',
        titleFont: '700 20px normal',
        winskin: 'winskin2.png',
        interval: 100,
        lineHeight: 6
    };

    const map = ref<LayerGroup>();
    const hideStatus = ref(false);
    const weather = new WeatherController('main');

    onMounted(() => {
        weather.bind(map.value);
    });

    const leftStatus: ILeftHeroStatus = reactive({
        hp: 0,
        atk: 0,
        def: 0,
        mdef: 0,
        money: 0,
        exp: 0,
        yellowKey: 0,
        blueKey: 0,
        redKey: 0,
        floor: 'MT0',
        lv: '',
        regen: 0,
        exAtk: 0,
        magicDef: 0
    });
    const replayStatus: ReplayingStatus = reactive({
        playing: false,
        speed: 1,
        played: 0,
        total: 0
    });
    const rightStatus: IRightHeroStatus = reactive({
        autoSkill: false,
        skillName: '',
        skillDesc: '',
        jumpCount: 0,
        springCount: 0,
        floor: 'MT0',
        replaying: false,
        replayStatus
    });

    const { getHeroStatusOn } = Mota.requireAll('fn');

    const updateStatus = () => {
        if (!core.status || !core.status.hero || !core.status.floorId) return;
        hideStatus.value = core.getFlag('hideStatusBar', false);

        const hero = core.status.hero;
        const floor = core.status.floorId;
        leftStatus.atk = getHeroStatusOn('atk');
        leftStatus.hp = getHeroStatusOn('hp');
        leftStatus.def = getHeroStatusOn('def');
        leftStatus.mdef = getHeroStatusOn('mdef');
        leftStatus.money = getHeroStatusOn('money');
        leftStatus.exp = core.getNextLvUpNeed() ?? 0;
        leftStatus.yellowKey = core.itemCount('yellowKey');
        leftStatus.blueKey = core.itemCount('blueKey');
        leftStatus.redKey = core.itemCount('redKey');
        leftStatus.floor = core.status.floorId;
        leftStatus.lv = core.getLvName(hero.lv);
        leftStatus.regen = getHeroStatusOn('hpmax');
        leftStatus.exAtk = getHeroStatusOn('mana');
        leftStatus.magicDef = getHeroStatusOn('magicDef');

        const { HeroSkill } = Mota.require('module', 'Mechanism');
        rightStatus.autoSkill = HeroSkill.getAutoSkill();
        rightStatus.skillName = HeroSkill.getSkillName();
        rightStatus.skillDesc = HeroSkill.getSkillDesc();
        rightStatus.floor = floor;
        rightStatus.replaying = core.isReplaying();
        const { pausing, speed, toReplay, totalList } = core.status.replay;
        replayStatus.playing = !pausing;
        replayStatus.speed = speed;
        replayStatus.played = totalList.length - toReplay.length;
        replayStatus.total = totalList.length;
        if (HeroSkill.learnedSkill(HeroSkill.Jump)) {
            if (Mota.Plugin.require('skill_g').jumpIgnoreFloor.has(floor)) {
                rightStatus.jumpCount = -2;
            } else {
                rightStatus.jumpCount = 3 - (flags[`jump_${floor}`] ?? 0);
            }
        } else {
            rightStatus.jumpCount = -1;
        }
        if (core.hasFlag('spring')) {
            rightStatus.springCount = 50 - (flags.springCount ?? 0);
        } else {
            rightStatus.springCount = -1;
        }
    };

    const loaded = ref(false);
    onLoaded(() => {
        loaded.value = true;
    });

    Mota.require('var', 'hook').on('statusBarUpdate', updateStatus);

    return () => (
        <container id="main-scene" width={MAIN_WIDTH} height={MAIN_HEIGHT}>
            {loaded.value && (
                <LeftStatusBar
                    loc={[0, 0, STATUS_BAR_WIDTH, STATUS_BAR_HEIGHT]}
                    status={leftStatus}
                    hidden={hideStatus.value}
                ></LeftStatusBar>
            )}
            <g-line line={[180, 0, 180, 480]} lineWidth={1} />
            <container id="map-draw" {...mapDrawProps} x={180} zIndex={10}>
                <layer-group id="layer-main" ex={layerGroupExtends} ref={map}>
                    <layer layer="bg" zIndex={10}></layer>
                    <layer layer="bg2" zIndex={20}></layer>
                    <layer layer="event" zIndex={30} ex={eventExtends}></layer>
                    <layer layer="fg" zIndex={40}></layer>
                    <layer layer="fg2" zIndex={50}></layer>
                    <PopText id="pop-main" zIndex={80}></PopText>
                </layer-group>
                <Textbox id="main-textbox" {...mainTextboxProps}></Textbox>
                <FloorChange id="floor-change" zIndex={50}></FloorChange>
            </container>
            <g-line line={[180 + 480, 0, 180 + 480, 480]} lineWidth={1} />
            {loaded.value && (
                <RightStatusBar
                    loc={[480 + 180, 0, STATUS_BAR_WIDTH, STATUS_BAR_HEIGHT]}
                    status={rightStatus}
                    hidden={hideStatus.value}
                ></RightStatusBar>
            )}
            <container
                loc={[0, 0, MAIN_WIDTH, MAIN_HEIGHT]}
                hidden={mainUIController.showBack.value}
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
                line={[180, 0, 480 + 180, 0]}
                hidden={!hideStatus.value}
                zIndex={100}
            />
            <g-line
                line={[180, 480, 480 + 180, 480]}
                hidden={!hideStatus.value}
                zIndex={100}
            />
        </container>
    );
});

export const mainSceneUI = new GameUI('main-scene', MainScene);
export const mainUIController = new UIController('main-ui');
