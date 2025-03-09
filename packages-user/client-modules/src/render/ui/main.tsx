import { LayerShadowExtends } from '@motajs/legacy-ui';
import {
    ILayerGroupRenderExtends,
    LayerGroupAnimate,
    FloorViewport,
    ILayerRenderExtends,
    HeroRenderer,
    LayerDoorAnimate,
    Props,
    LayerGroup,
    Font
} from '@motajs/render';
import { WeatherController } from '../../weather';
import {
    FloorChange,
    LayerGroupFilter,
    LayerGroupHalo,
    LayerGroupPortal,
    PopText
} from '@user/legacy-plugin-client';
import { defineComponent, onMounted, reactive, ref } from 'vue';
import { Textbox, Tip } from '../components';
import { GameUI, UIController } from '@motajs/system-ui';
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
import { getHeroStatusOn, HeroSkill, NightSpecial } from '@user/data-state';
import { jumpIgnoreFloor } from '@user/legacy-plugin-data';
import { hook } from '@user/data-base';
import { FloorDamageExtends } from '../damage';
import { FloorItemDetail } from '../itemDetail';

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
        loc: [0, 330, 480, 150],
        zIndex: 30,
        fillStyle: '#fff',
        titleFill: 'gold',
        font: new Font('normal'),
        titleFont: new Font('normal', 20, 'px', 700),
        winskin: 'winskin2.png',
        interval: 100,
        lineHeight: 4,
        width: 480
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
        replayStatus,
        night: 0
    });

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

        rightStatus.autoSkill = HeroSkill.getAutoSkill();
        rightStatus.skillName = HeroSkill.getSkillName();
        rightStatus.skillDesc = HeroSkill.getSkillDesc();
        rightStatus.night = NightSpecial.getNight(floor);
        rightStatus.floor = floor;
        rightStatus.replaying = core.isReplaying();
        const { pausing, speed, toReplay, totalList } = core.status.replay;
        replayStatus.playing = !pausing;
        replayStatus.speed = speed;
        replayStatus.played = totalList.length - toReplay.length;
        replayStatus.total = totalList.length;
        if (HeroSkill.learnedSkill(HeroSkill.Jump)) {
            if (jumpIgnoreFloor.has(floor)) {
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

    hook.on('statusBarUpdate', updateStatus);

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
                <Tip
                    id="main-tip"
                    zIndex={80}
                    loc={[8, 8, 200, 32]}
                    pad={[12, 6]}
                    corner={16}
                />
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
