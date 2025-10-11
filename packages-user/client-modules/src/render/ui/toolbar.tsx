import { DefaultProps, ElementLocator, Font } from '@motajs/render';
import { computed, defineComponent, ref } from 'vue';
import {
    DoubleArrow,
    NumpadIcon,
    PauseIcon,
    PlayIcon,
    ReplayIcon,
    RetweetIcon,
    RollbackIcon,
    StepForward,
    ViewMapIcon
} from '../components/icons';
import { getVitualKeyOnce } from '@motajs/legacy-ui';
import { gameKey } from '@motajs/system-action';
import { generateKeyboardEvent } from '@motajs/system-action';
import { transitioned } from '../use';
import { linear } from 'mutate-animate';
import { KeyCode } from '@motajs/client-base';
import { Progress } from '../components/misc';
import { generateBinary } from '@motajs/legacy-common';
import { SetupComponentOptions } from '@motajs/system-ui';
import { saveSave, saveLoad } from './save';
import { mainUIController } from './controller';
import { MAIN_HEIGHT, FULL_LOC, POP_BOX_WIDTH, CENTER_LOC } from '../shared';
import { openReplay, openSettings } from './settings';
import { openViewMap } from './viewmap';

interface ToolbarProps extends DefaultProps {
    loc?: ElementLocator;
}

type ToolbarEmits = {
    numpad: () => void;
};

const toolbarProps = {
    props: ['loc'],
    emits: ['numpad']
} satisfies SetupComponentOptions<
    ToolbarProps,
    ToolbarEmits,
    keyof ToolbarEmits
>;

const im = (col: number, row: number): ElementLocator => {
    return [5 + 34 * col, 5 + 36 * row, 32, 32];
};

const ic = (col: number, row: number): ElementLocator => {
    return [7 + 34 * col, 7 + 36 * row, 28, 28];
};

const ic2 = (col: number, row: number): ElementLocator => {
    return [9 + 34 * col, 9 + 36 * row, 24, 24];
};

const middle = (col: number, row: number): ElementLocator => {
    return [21 + 34 * col, 21 + 36 * row, void 0, void 0, 0.5, 0.5];
};

const middle2 = (
    col: number,
    row: number,
    width: number,
    height: number
): ElementLocator => {
    return [21 + 34 * col, 21 + 36 * row, width, height, 0.5, 0.5];
};

export const PlayingToolbar = defineComponent<
    ToolbarProps,
    ToolbarEmits,
    keyof ToolbarEmits
>((props, { emit }) => {
    const bookIcon = core.statusBar.icons.book;
    const flyIcon = core.statusBar.icons.fly;
    const toolIcon = core.statusBar.icons.toolbox;
    const equipIcon = core.statusBar.icons.equipbox;
    const keyIcon = core.statusBar.icons.keyboard;
    const shopIcon = core.statusBar.icons.shop;
    const saveIcon = core.statusBar.icons.save;
    const loadIcon = core.statusBar.icons.load;
    const setIcon = core.statusBar.icons.settings;

    const iconFont = new Font('Verdana', 12);

    const book = () => core.openBook(true);
    const tool = () => core.openToolbox(true);
    const fly = () => core.useFly(true);
    const save = () => {
        saveSave(mainUIController, FULL_LOC);
    };
    const load = () => {
        saveLoad(mainUIController, FULL_LOC);
    };
    const equip = () => core.openEquipbox(true);
    const shop = () => core.openQuickShop(true);
    const key = () => {
        getVitualKeyOnce().then(value => {
            gameKey.emitKey(
                value.key,
                value.assist,
                'up',
                generateKeyboardEvent(value.key, value.assist)
            );
        });
    };
    const undo = () => core.doSL('autoSave', 'load');
    const redo = () => core.doSL('autoSave', 'reload');
    const numpad = () => emit('numpad');
    const view = () => {
        openViewMap(mainUIController, FULL_LOC);
    };
    const replay = () => {
        const loc = CENTER_LOC.slice() as ElementLocator;
        loc[2] = POP_BOX_WIDTH;
        openReplay(mainUIController, loc);
    };
    const settings = () => {
        const loc = CENTER_LOC.slice() as ElementLocator;
        loc[2] = POP_BOX_WIDTH;
        loc[3] = MAIN_HEIGHT - 72;
        openSettings(mainUIController, loc);
    };

    return () => (
        <container loc={props.loc} cursor="pointer">
            <image image={bookIcon} loc={im(0, 0)} noanti onClick={book} />
            <image image={toolIcon} loc={im(1, 0)} noanti onClick={tool} />
            <image image={flyIcon} loc={im(2, 0)} noanti onClick={fly} />
            <image image={saveIcon} loc={im(3, 0)} noanti onClick={save} />
            <image image={loadIcon} loc={im(4, 0)} noanti onClick={load} />
            <image image={equipIcon} loc={im(0, 1)} noanti onClick={equip} />
            <image image={shopIcon} loc={im(1, 1)} noanti onClick={shop} />
            <image image={keyIcon} loc={im(2, 1)} noanti onClick={key} />
            <RollbackIcon loc={ic(3, 1)} strokeStyle="#eee" onClick={undo} />
            <RetweetIcon loc={ic(4, 1)} strokeStyle="#eee" onClick={redo} />
            <NumpadIcon loc={ic(0, 2)} strokeStyle="#eee" onClick={numpad} />
            <ViewMapIcon loc={ic(1, 2)} strokeStyle="#eee" onClick={view} />
            <ReplayIcon loc={ic(3, 2)} strokeStyle="#eee" onClick={replay} />
            <text text="R" loc={middle(3, 2)} font={iconFont} noevent />
            <image image={setIcon} loc={im(4, 2)} noanti onClick={settings} />
        </container>
    );
}, toolbarProps);

export interface ReplayingStatus {
    /** 是否处在录像播放状态 */
    replaying: boolean;
    /** 是否正在播放 */
    playing: boolean;
    /** 录像播放速度 */
    speed: number;
    /** 已播放的长度 */
    played: number;
    /** 总长度 */
    total: number;
}

export interface ReplayingProps extends ToolbarProps {
    /** 录像播放状态 */
    status: ReplayingStatus;
}

const replayingProps = {
    props: ['status', 'loc']
} satisfies SetupComponentOptions<ReplayingProps>;

export const ReplayingToolbar = defineComponent<ReplayingProps>(props => {
    const status = props.status;

    const bookIcon = core.statusBar.icons.book;
    const saveIcon = core.statusBar.icons.save;
    const font1 = Font.defaults({ size: 16 });
    const font2 = new Font('Verdana', 12);

    const speedText = computed(() => `${status.speed}速`);
    const progress = computed(() => status.played / status.total);
    const progressText1 = computed(() => `${status.played}/${status.total}`);
    const progressText2 = computed(
        () => `${(progress.value * 100).toFixed(2)}%`
    );

    const play = () => core.resumeReplay();
    const pause = () => core.pauseReplay();
    const stop = () => core.stopReplay(true);
    const speedDown = () => core.speedDownReplay();
    const speedUp = () => core.speedUpReplay();
    const book = () => core.openBook(true);
    const save = () => {
        saveSave(mainUIController, FULL_LOC);
    };
    const view = () => {
        if (core.isPlaying() && !core.isMoving() && !core.status.lockControl) {
            core.ui._drawViewMaps();
        }
    };
    const rewind = () => core.rewindReplay();
    const step = () => core.stepReplay();

    return () => {
        return (
            <container loc={props.loc} cursor="pointer">
                {status.playing ? (
                    <PauseIcon loc={ic(0, 0)} onClick={pause} />
                ) : (
                    <PlayIcon loc={ic(0, 0)} onClick={play} />
                )}
                <g-rectr loc={[47, 13, 16, 16]} circle={[2]} onClick={stop} />
                <DoubleArrow
                    loc={middle2(2, 0, 28, 28)}
                    scale={[-1, 1]}
                    onClick={speedDown}
                />
                <text text={speedText.value} loc={middle(3, 0)} font={font1} />
                <DoubleArrow loc={ic(4, 0)} onClick={speedUp} />
                <image image={bookIcon} loc={im(0, 1)} noanti onClick={book} />
                <image image={saveIcon} loc={im(1, 1)} noanti onClick={save} />
                <ViewMapIcon loc={ic(2, 1)} onClick={view} />
                <StepForward
                    loc={middle2(3, 1, 28, 28)}
                    scale={[-1, 1]}
                    onClick={rewind}
                />
                <StepForward loc={ic(4, 1)} onClick={step} />
                <text
                    text={progressText1.value}
                    loc={[12, 98, void 0, void 0, 0, 1]}
                    font={font2}
                />
                <text
                    text={progressText2.value}
                    loc={[168, 98, void 0, void 0, 1, 1]}
                    font={font2}
                />
                <Progress
                    loc={[12, 101, 156, 4]}
                    progress={progress.value}
                    success="lightgreen"
                />
            </container>
        );
    };
}, replayingProps);

export const NumpadToolbar = defineComponent<
    ToolbarProps,
    ToolbarEmits,
    keyof ToolbarEmits
>((props, { emit }) => {
    const numpad = () => emit('numpad');
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    const font = new Font('Verdana', 14);

    const ctrlEnabled = ref(false);
    const shiftEnabled = ref(false);
    const altEnabled = ref(false);

    const ctrlAlpha = transitioned(0, 100, linear())!;
    const shiftAlpha = transitioned(0, 100, linear())!;
    const altAlpha = transitioned(0, 100, linear())!;

    const ctrlColor = computed(
        () => `rgba(221,221,221,${ctrlAlpha.ref.value})`
    );
    const ctrlTextColor = computed(() => {
        const rgb = Math.floor(255 - ctrlAlpha.ref.value * 255);
        return `rgba(${rgb},${rgb},${rgb},1)`;
    });

    const shiftColor = computed(
        () => `rgba(221,221,221,${shiftAlpha.ref.value})`
    );
    const shiftTextColor = computed(() => {
        const rgb = Math.floor(255 - shiftAlpha.ref.value * 255);
        return `rgba(${rgb},${rgb},${rgb},1)`;
    });

    const altColor = computed(() => `rgba(221,221,221,${altAlpha.ref.value})`);
    const altTextColor = computed(() => {
        const rgb = Math.floor(255 - altAlpha.ref.value * 255);
        return `rgba(${rgb},${rgb},${rgb},1)`;
    });

    const clickCtrl = () => {
        ctrlEnabled.value = !ctrlEnabled.value;
        ctrlAlpha.set(ctrlEnabled.value ? 1 : 0);
    };

    const clickShift = () => {
        shiftEnabled.value = !shiftEnabled.value;
        shiftAlpha.set(shiftEnabled.value ? 1 : 0);
    };

    const clickAlt = () => {
        altEnabled.value = !altEnabled.value;
        altAlpha.set(altEnabled.value ? 1 : 0);
    };

    const clickNum = (num: number) => {
        const bin = generateBinary([
            ctrlEnabled.value,
            shiftEnabled.value,
            altEnabled.value
        ]);
        const code = (KeyCode.Digit0 + num) as KeyCode;
        gameKey.emitKey(code, bin, 'up', generateKeyboardEvent(code, bin));
    };

    return () => (
        <container loc={props.loc} cursor="pointer">
            <container loc={[0, 0, 180, 81]}>
                {nums
                    .map((v, i) => {
                        const col = i % 5;
                        const row = Math.floor(i / 5);
                        return [
                            <g-rectr
                                loc={ic2(col, row)}
                                circle={[4]}
                                stroke
                                onClick={() => clickNum(v)}
                            />,
                            <text
                                text={v.toString()}
                                loc={middle(col, row)}
                                font={font}
                                noevent
                            />
                        ];
                    })
                    .flat()}
            </container>
            <g-rectr
                loc={[41, 81, 36, 24]}
                circle={[4]}
                stroke
                fill
                fillStyle={ctrlColor.value}
                onClick={clickCtrl}
            ></g-rectr>
            <text
                text="Ctrl"
                loc={[59, 93, void 0, void 0, 0.5, 0.5]}
                fillStyle={ctrlTextColor.value}
                font={font}
                noevent
            />
            <g-rectr
                loc={[86, 81, 44, 24]}
                circle={[4]}
                stroke
                fill
                fillStyle={shiftColor.value}
                onClick={clickShift}
            ></g-rectr>
            <text
                text="Shift"
                loc={[108, 93, void 0, void 0, 0.5, 0.5]}
                fillStyle={shiftTextColor.value}
                font={font}
                noevent
            />
            <g-rectr
                loc={[139, 81, 30, 24]}
                circle={[4]}
                stroke
                fill
                fillStyle={altColor.value}
                onClick={clickAlt}
            ></g-rectr>
            <text
                text="Alt"
                loc={[154, 93, void 0, void 0, 0.5, 0.5]}
                fillStyle={altTextColor.value}
                font={font}
                noevent
            />
            <NumpadIcon loc={ic(0, 2)} strokeStyle="gold" onClick={numpad} />
        </container>
    );
}, toolbarProps);

export const MixedToolbar = defineComponent<ReplayingProps>(props => {
    const inNumpad = ref(false);

    const onNumpad = () => {
        inNumpad.value = !inNumpad.value;
    };

    return () =>
        inNumpad.value ? (
            <NumpadToolbar loc={props.loc} onNumpad={onNumpad} />
        ) : props.status.replaying ? (
            <ReplayingToolbar loc={props.loc} status={props.status} />
        ) : (
            <PlayingToolbar loc={props.loc} onNumpad={onNumpad} />
        );
}, replayingProps);
