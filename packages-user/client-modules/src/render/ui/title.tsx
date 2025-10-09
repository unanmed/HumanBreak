import { DefaultProps } from '@motajs/render-vue';
import {
    GameUI,
    SetupComponentOptions,
    UIComponentProps
} from '@motajs/system-ui';
import { defineComponent, nextTick, onMounted, ref } from 'vue';
import {
    BUTTONS_HEIGHT,
    BUTTONS_WIDTH,
    BUTTONS_X,
    BUTTONS_Y,
    HALF_HEIGHT,
    HALF_WIDTH,
    MAIN_HEIGHT,
    MAIN_WIDTH,
    TITLE_FILL,
    TITLE_STROKE,
    TITLE_STROKE_WIDTH,
    TITLE_X,
    TITLE_Y
} from '../shared';
import { ElementLocator } from '@motajs/render-core';
import {
    ITransitionedController,
    transitioned,
    transitionedColor,
    useKey
} from '../use';
import { hyper, linear, sleep } from 'mutate-animate';
import { Font } from '@motajs/render-style';
import { ExitFullscreen, Fullscreen, SoundVolume } from '../components';
import { mainSetting, triggerFullscreen } from '@motajs/legacy-ui';
import { saveLoad } from './save';
import { MainSceneUI } from './main';
import { adjustCover } from '../utils';

const enum TitleButton {
    StartGame,
    LoadGame,
    Replay
}

interface ButtonItem {
    code: TitleButton;
    name: string;
    color: string;
}

interface ButtonOption {
    code: number;
    color: string;
    name: string;
    hard: string;
    colorTrans: ITransitionedController<string>;
}

export interface GameTitleProps extends DefaultProps, UIComponentProps {}

const gameTitleProps = {
    props: ['controller', 'instance']
} satisfies SetupComponentOptions<GameTitleProps>;

export const GameTitle = defineComponent<GameTitleProps>(props => {
    const bg = core.material.images.images['bg.jpg'];

    //#region 计算背景图
    const [width, height] = adjustCover(
        bg.width,
        bg.height,
        MAIN_WIDTH,
        MAIN_HEIGHT
    );

    //#region 标题设置

    /** 当前是否全屏 */
    const fullscreen = ref(!!document.fullscreenElement);
    /** 是否开启了声音 */
    const soundOpened = ref(true);
    /** 是否在选择难度界面 */
    const selectHard = ref(false);

    /** 开始界面按钮定义，你可以在这新增自己的按钮 */
    const buttonItems: ButtonItem[] = [
        {
            code: TitleButton.StartGame,
            color: 'rgb(40, 194, 255)',
            name: '开始游戏'
        },
        {
            code: TitleButton.LoadGame,
            color: 'rgb(0, 255, 55)',
            name: '读取存档'
        },
        {
            code: TitleButton.Replay,
            color: 'rgb(255, 251, 0)',
            name: '录像回放'
        }
    ];

    /** 开始界面按钮 */
    const buttons = buttonItems.map<ButtonOption>(v => {
        return {
            code: v.code,
            color: v.color,
            name: v.name,
            hard: '',
            colorTrans: transitionedColor('#fff', 400, hyper('sin', 'out'))!,
            scale: transitioned(1, 400, hyper('sin', 'out'))!
        };
    });

    /** 选择难度界面按钮 */
    const hard = main.levelChoose.map<ButtonOption>(v => {
        return {
            code: v.hard,
            color: core.arrayToRGBA(v.color),
            name: v.title,
            hard: v.name,
            colorTrans: transitionedColor('#fff', 400, hyper('sin', 'out'))!,
            scale: transitioned(1, 400, hyper('sin', 'out'))!
        };
    });
    // 返回按钮
    hard.push({
        code: -1,
        color: '#aaa',
        name: '返回',
        hard: '',
        colorTrans: transitionedColor('#fff', 400, hyper('sin', 'out'))!
    });

    /** 声音设置按钮的颜色 */
    const soundColor = transitionedColor('#ddd', 400, hyper('sin', 'out'))!;

    /** 开始界面按钮的不透明度，选择难度界面的不透明度使用 `1-buttonsAlpha` 计算 */
    const buttonsAlpha = transitioned(1, 300, linear())!;
    /** 开始界面的不透明度 */
    const mainAlpha = transitioned(0, 600, linear())!;

    const buttonFilter = `
        drop-shadow(3px 3px 5px rgba(0, 0, 0, 0.4))
        drop-shadow(0px 0px 2px rgba(255, 255, 255, 0.5))
    `;

    const titleFont = Font.defaults({ size: 72 });
    const buttonFont = Font.defaults({ size: 24, weight: 600 });

    /** 开始界面按钮的高度 */
    const buttonHeight = (buttons.length - 1) * 40 + 60;
    /** 选择难度界面按钮的高度 */
    const hardHeight = (hard.length - 1) * 40 + 60;
    /** 按钮的背景框高度 */
    const rectHeight = transitioned(buttonHeight, 600, hyper('sin', 'in-out'))!;

    //#region 按钮功能

    /**
     * 在开始界面和选择难度界面切换
     */
    const toggleHard = async () => {
        if (selectHard.value) {
            // 当前在难度界面，将要切换至开始界面
            enterMain(0);
            rectHeight.set(buttonHeight);
        } else {
            // 当前在开始界面，将要切换至难度界面
            enterHard(0);
            rectHeight.set(hardHeight);
        }
        buttonsAlpha.set(0);
        await sleep(300);
        selectHard.value = !selectHard.value;
        buttonsAlpha.set(1);
    };

    /**
     * 点击读取存档按钮
     */
    const loadGame = async () => {
        const loc: ElementLocator = [0, 0, MAIN_WIDTH, MAIN_HEIGHT];
        const success = await saveLoad(props.controller, loc);
        if (success) {
            props.controller.close(props.instance);
            props.controller.open(MainSceneUI, {});
        }
    };

    /**
     * 点击录像回放按钮
     */
    const replay = () => {
        core.chooseReplayFile();
    };

    /**
     * 选择难度并开始游戏
     * @param hard 选择的难度
     */
    const startGame = async (hard: string) => {
        mainAlpha.set(0);
        await sleep(600);
        props.controller.close(props.instance);
        props.controller.open(MainSceneUI, {});
        nextTick(() => {
            core.startGame(hard);
        });
    };

    /**
     * 点击按钮时触发
     * @param code 选中的按钮的代码
     */
    const clickButton = (code: number, index: number) => {
        if (selectHard.value) {
            if (index === hard.length - 1) {
                // 选中了最后一个按钮
                toggleHard();
                return;
            }
            const item = hard[index];
            startGame(item.name);
        } else {
            switch (code) {
                case TitleButton.StartGame:
                    toggleHard();
                    break;
                case TitleButton.LoadGame:
                    loadGame();
                    break;
                case TitleButton.Replay:
                    replay();
                    break;
            }
        }
    };

    //#region 键盘操作

    const selected = ref(0);

    const [key] = useKey();
    key.realize(
        '@start_up',
        () => {
            selected.value--;
            if (selected.value < 0) {
                selected.value = 0;
            }
            if (selectHard.value) {
                enterHard(selected.value);
            } else {
                enterMain(selected.value);
            }
        },
        { type: 'down' }
    )
        .realize(
            '@start_down',
            () => {
                selected.value++;
                if (selectHard.value) {
                    if (selected.value > hard.length - 1) {
                        selected.value = hard.length - 1;
                    }
                    enterHard(selected.value);
                } else {
                    if (selected.value > buttons.length - 1) {
                        selected.value = buttons.length - 1;
                    }
                    enterMain(selected.value);
                }
            },
            { type: 'down' }
        )
        .realize('confirm', () => {
            if (selectHard.value) {
                clickButton(hard[selected.value].code, selected.value);
            } else {
                clickButton(buttons[selected.value].code, selected.value);
            }
        });

    //#region 鼠标操作

    soundOpened.value = mainSetting.getValue('audio.bgmEnabled', true);
    if (soundOpened.value) {
        soundColor.set('#ddd');
    } else {
        soundColor.set('#d22');
    }

    const enterMain = (index: number) => {
        buttons.forEach((v, i) => {
            if (index !== i) {
                v.colorTrans.set('#fff');
            } else {
                v.colorTrans.set(v.color);
            }
        });
        selected.value = index;
    };

    const enterHard = (index: number) => {
        hard.forEach((v, i) => {
            if (index !== i) {
                v.colorTrans.set('#fff');
            } else {
                v.colorTrans.set(v.color);
            }
        });
        selected.value = index;
    };

    const toggleSound = () => {
        soundOpened.value = !soundOpened.value;
        mainSetting.setValue('audio.bgmEnabled', soundOpened.value);
        if (soundOpened.value) {
            soundColor.set('#ddd');
        } else {
            soundColor.set('#d22');
        }
    };

    const toggleFullscreen = async () => {
        await triggerFullscreen(!fullscreen.value);
        fullscreen.value = !!document.fullscreenElement;
    };

    onMounted(() => {
        enterMain(0);
        mainAlpha.set(1);
    });

    return () => (
        <container
            loc={[0, 0, MAIN_WIDTH, MAIN_HEIGHT]}
            alpha={mainAlpha.ref.value}
        >
            <image
                image={bg}
                loc={[HALF_WIDTH, HALF_HEIGHT, width, height]}
                anc={[0.5, 0.5]}
                zIndex={0}
            />
            <text
                text={core.firstData.title}
                loc={[TITLE_X, TITLE_Y]}
                anc={[0.5, 0.5]}
                fillStyle={TITLE_FILL}
                strokeStyle={TITLE_STROKE}
                font={titleFont}
                strokeWidth={TITLE_STROKE_WIDTH}
            />
            <container
                zIndex={15}
                loc={[BUTTONS_X, BUTTONS_Y, BUTTONS_WIDTH, BUTTONS_HEIGHT]}
                anc={[0.5, 0]}
            >
                <g-rectr
                    loc={[2, BUTTONS_HEIGHT / 2]}
                    width={BUTTONS_WIDTH - 4}
                    height={rectHeight.ref.value - 4}
                    anc={[0, 0.5]}
                    circle={[16]}
                    fill
                    stroke
                    fillStyle="rgba(50, 54, 159, 0.7)"
                    strokeStyle="rgba(255, 204, 0, 1)"
                    lineWidth={3}
                    zIndex={0}
                />
                <container
                    hidden={selectHard.value}
                    loc={[0, BUTTONS_HEIGHT / 2, BUTTONS_WIDTH, buttonHeight]}
                    anc={[0, 0.5]}
                    alpha={buttonsAlpha.ref.value}
                    zIndex={5}
                >
                    {buttons.map((v, i) => {
                        const x = BUTTONS_WIDTH / 2;
                        const y = 30 + i * 40;
                        return (
                            <text
                                text={v.name}
                                font={buttonFont}
                                loc={[x, y, void 0, void 0, 0.5, 0.5]}
                                cursor="pointer"
                                filter={buttonFilter}
                                fillStyle={v.colorTrans.ref.value}
                                onEnter={() => enterMain(i)}
                                onClick={() => clickButton(v.code, i)}
                            />
                        );
                    })}
                </container>
                <container
                    hidden={!selectHard.value}
                    loc={[0, BUTTONS_HEIGHT / 2, BUTTONS_WIDTH, hardHeight]}
                    anc={[0, 0.5]}
                    alpha={buttonsAlpha.ref.value}
                >
                    {hard.map((v, i) => {
                        const x = BUTTONS_WIDTH / 2;
                        const y = 30 + i * 40;
                        return (
                            <text
                                text={v.name}
                                font={buttonFont}
                                loc={[x, y, void 0, void 0, 0.5, 0.5]}
                                cursor="pointer"
                                filter={buttonFilter}
                                fillStyle={v.colorTrans.ref.value}
                                onEnter={() => enterHard(i)}
                                onClick={() => clickButton(v.code, i)}
                            />
                        );
                    })}
                </container>
            </container>
            <container
                zIndex={15}
                loc={[MAIN_WIDTH - 20, MAIN_HEIGHT - 20, 120, 40, 1, 1]}
            >
                <g-rectr
                    loc={[0, 0, 120, 40]}
                    circle={[20]}
                    fillStyle="rgba(0, 0, 0, 0.72)"
                />
                <SoundVolume
                    loc={[20, 0, 40, 40]}
                    cursor="pointer"
                    strokeStyle={soundColor.ref.value}
                    onClick={toggleSound}
                />
                {!fullscreen.value ? (
                    <Fullscreen
                        loc={[60, 0, 40, 40]}
                        onClick={toggleFullscreen}
                        cursor="pointer"
                    />
                ) : (
                    <ExitFullscreen
                        loc={[60, 0, 40, 40]}
                        onClick={toggleFullscreen}
                        cursor="pointer"
                    />
                )}
                <g-line
                    line={[25, 35, 55, 5]}
                    strokeStyle="gray"
                    lineWidth={3}
                    lineCap="round"
                    zIndex={5}
                    noevent
                    hidden={soundOpened.value}
                />
            </container>
        </container>
    );
}, gameTitleProps);

export const GameTitleUI = new GameUI('game-title', GameTitle);
