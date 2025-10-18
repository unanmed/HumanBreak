import { DefaultProps, onTick } from '@motajs/render-vue';
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
    HALF_TITLE_HEIGHT,
    HALF_TITLE_WIDTH,
    HALF_WIDTH,
    MAIN_HEIGHT,
    MAIN_WIDTH,
    TITLE_HEIGHT,
    TITLE_WIDTH,
    TITLE_X,
    TITLE_Y
} from '../shared';
import {
    ElementLocator,
    IActionEvent,
    MotaOffscreenCanvas2D,
    Shader,
    Sprite
} from '@motajs/render-core';
import { Image3DEffect } from '../fx';
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
    Replay,
    Achievement
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
    scale: ITransitionedController<number>;
}

export interface GameTitleProps extends DefaultProps, UIComponentProps {}

const gameTitleProps = {
    props: ['controller', 'instance']
} satisfies SetupComponentOptions<GameTitleProps>;

export const GameTitle = defineComponent<GameTitleProps>(props => {
    const bg = core.material.images.images['bg.webp'];

    //#region 计算背景图
    const [width, height] = adjustCover(
        bg.width,
        bg.height,
        MAIN_WIDTH,
        MAIN_HEIGHT
    );

    //#region 标题设置

    const fullscreen = ref(!!document.fullscreenElement);
    const soundOpened = ref(true);
    const selectHard = ref(false);

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
        },
        {
            code: TitleButton.Achievement,
            color: 'rgb(0, 208, 255)',
            name: '查看成就'
        }
    ];

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

    const hard = main.levelChoose.map<ButtonOption>(v => {
        return {
            code: v.hard,
            color: core.arrayToRGBA(v.color ?? [1, 1, 1]),
            name: v.title,
            hard: v.name,
            colorTrans: transitionedColor('#fff', 400, hyper('sin', 'out'))!,
            scale: transitioned(1, 400, hyper('sin', 'out'))!
        };
    });
    hard.push({
        code: -1,
        color: '#aaa',
        name: '返回',
        hard: '',
        colorTrans: transitionedColor('#fff', 400, hyper('sin', 'out'))!,
        scale: transitioned(1, 400, hyper('sin', 'out'))!
    });

    //#region 渐变动画
    const maskPos = transitioned(
        -MAIN_HEIGHT - 100,
        7000,
        hyper('sin', 'out')
    )!;
    const cursorX = transitioned(40, 400, hyper('sin', 'out'))!;
    const cursorY = transitioned(20, 400, hyper('sin', 'out'))!;

    const soundColor = transitionedColor('#ddd', 400, hyper('sin', 'out'))!;

    const buttonsAlpha = transitioned(1, 300, linear())!;
    const mainAlpha = transitioned(1, 600, linear())!;

    const buttonFilter = `
        drop-shadow(3px 3px 5px rgba(0, 0, 0, 0.4))
        drop-shadow(0px 0px 2px rgba(255, 255, 255, 0.5))
    `;

    let cursorScale = 1;

    const titleFont = Font.defaults({ size: 72 });
    const buttonFont = Font.defaults({ size: 24, weight: 600 });

    //#region 按钮功能

    const toggleHard = async () => {
        if (selectHard.value) {
            enterMain(0);
        } else {
            enterHard(0);
        }
        buttonsAlpha.set(0);
        await sleep(300);
        selectHard.value = !selectHard.value;
        buttonsAlpha.set(1);
    };

    const loadGame = async () => {
        const loc: ElementLocator = [0, 0, MAIN_WIDTH, MAIN_HEIGHT];
        const success = await saveLoad(props.controller, loc);
        if (success) {
            props.controller.close(props.instance);
            props.controller.open(MainSceneUI, {});
        }
    };

    const replay = () => {
        core.chooseReplayFile();
    };

    const startGame = async (hard: string) => {
        mainAlpha.set(0);
        await sleep(600);
        props.controller.close(props.instance);
        props.controller.open(MainSceneUI, {});
        nextTick(() => {
            core.startGame(hard);
        });
    };

    const clickButton = (code: number, index: number) => {
        if (selectHard.value) {
            if (index === hard.length - 1) {
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
                case TitleButton.Achievement:
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

    const moveCursor = (index: number) => {
        cursorX.set(40 - index * 10);
        cursorY.set(20 + 30 * index);
    };

    const enterMain = (index: number) => {
        buttons.forEach((v, i) => {
            if (index !== i) {
                v.colorTrans.set('#fff');
                v.scale.set(1);
            } else {
                v.colorTrans.set(v.color);
                v.scale.set(1.1);
            }
        });
        selected.value = index;
        moveCursor(index);
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
        moveCursor(index);
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

    //#region 渲染

    const imageEffect = new Image3DEffect();
    const imageShader = ref<Shader>();

    const maskSprite = ref<Sprite>();
    const cursorSprite = ref<Sprite>();

    let maskGradient: CanvasGradient | null = null;
    let titleGradient: CanvasGradient | null = null;

    const createImageEffect = () => {
        if (!imageShader.value) return;
        imageEffect.create(imageShader.value);
        const model = imageEffect.getModel();
        const view = imageEffect.getView();
        view.lookAt([0, 0, 1], [0, 0, 0], [0, 1, 0]);
        model.scale(1.1, 1.1, 1.1);
        imageEffect.use();
    };

    const createMaskGradient = (ctx: CanvasRenderingContext2D) => {
        maskGradient = ctx.createLinearGradient(100, 100, 200, 0);
        maskGradient.addColorStop(0, 'rgba(255,255,255,0)');
        maskGradient.addColorStop(1, 'rgba(0,0,0,1)');
    };

    const createTitleGradient = (ctx: CanvasRenderingContext2D) => {
        titleGradient = ctx.createLinearGradient(0, 0, 640, 0);
        titleGradient.addColorStop(0, 'rgb(0, 65, 62)');
        titleGradient.addColorStop(0.25, 'rgb(0, 33, 71)');
        titleGradient.addColorStop(0.5, 'rgb(136, 0, 214)');
        titleGradient.addColorStop(0.75, 'rgb(0, 2, 97)');
        titleGradient.addColorStop(1, 'rgb(0, 2, 97)');
    };

    const titleSprite = ref<Sprite>();
    onMounted(() => {
        createImageEffect();
        maskPos.set(MAIN_WIDTH);
        enterMain(0);
    });

    onTick(time => {
        if (maskPos.value < MAIN_WIDTH) {
            maskSprite.value?.update();
        }
        cursorScale = Math.sin(time / 600);
        cursorSprite.value?.update();
    });

    const moveBackground = (ev: IActionEvent) => {
        const model = imageEffect.getModel();
        const px = (ev.offsetX / MAIN_WIDTH - 0.5) * 2;
        const py = (ev.offsetY / MAIN_HEIGHT - 0.5) * 2;
        model.reset();
        model.scale(1.1, 1.1, 1.1);
        model.rotateY(px / 24);
        model.rotateX(py / 24);
    };

    const renderMask = (canvas: MotaOffscreenCanvas2D) => {
        const ctx = canvas.ctx;
        if (maskGradient === null) {
            createMaskGradient(ctx);
        }
        const pos = maskPos.value;
        ctx.translate(pos, 0);
        ctx.fillStyle = maskGradient!;
        ctx.fillRect(0, 0, MAIN_WIDTH + MAIN_HEIGHT + 200, MAIN_HEIGHT);
    };

    const renderTitle = (canvas: MotaOffscreenCanvas2D) => {
        const ctx = canvas.ctx;
        if (titleGradient === null) {
            createTitleGradient(ctx);
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = titleFont.string();
        ctx.fillStyle = titleGradient!;
        ctx.filter = `
            drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5))
            drop-shadow(-3px -3px 4px rgba(255,255,255,0.3))
            drop-shadow(12px 12px 4px rgba(0, 0, 0, 0.4))
            blur(1px)
        `;
        ctx.fillText(core.firstData.title, HALF_TITLE_WIDTH, HALF_TITLE_HEIGHT);
    };

    const renderCursor = (canvas: MotaOffscreenCanvas2D) => {
        const ctx = canvas.ctx;
        ctx.translate(0, 5);
        ctx.scale(1, cursorScale);
        ctx.beginPath();
        ctx.moveTo(1, -4);
        ctx.lineTo(9, 0);
        ctx.lineTo(1, 4);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    };

    return () => (
        <container
            loc={[0, 0, MAIN_WIDTH, MAIN_HEIGHT]}
            onMoveCapture={moveBackground}
            alpha={mainAlpha.ref.value}
        >
            <image
                image={bg}
                loc={[HALF_WIDTH, HALF_HEIGHT, width, height]}
                anc={[0.5, 0.5]}
                filter="brightness(120%)contrast(110%)"
                zIndex={0}
            />
            <shader
                ref={imageShader}
                zIndex={5}
                loc={[0, 0, MAIN_WIDTH, MAIN_HEIGHT]}
            />
            <sprite
                ref={maskSprite}
                render={renderMask}
                composite="multiply"
                loc={[0, 0, MAIN_WIDTH, MAIN_HEIGHT]}
                zIndex={20}
                noevent
            />
            <sprite
                ref={titleSprite}
                render={renderTitle}
                loc={[TITLE_X, TITLE_Y, TITLE_WIDTH, TITLE_HEIGHT, 0.5, 0.5]}
                zIndex={10}
            />
            <container
                zIndex={15}
                loc={[BUTTONS_X, BUTTONS_Y, BUTTONS_WIDTH, BUTTONS_HEIGHT]}
            >
                <container
                    hidden={selectHard.value}
                    loc={[0, 0, BUTTONS_WIDTH, BUTTONS_HEIGHT]}
                    alpha={buttonsAlpha.ref.value}
                >
                    {buttons.map((v, i) => {
                        const x = 50 - i * 10;
                        const y = 20 + i * 30;
                        return (
                            <text
                                text={v.name}
                                font={buttonFont}
                                loc={[x, y, void 0, void 0, 0, 0.5]}
                                cursor="pointer"
                                filter={buttonFilter}
                                fillStyle={v.colorTrans.ref.value}
                                // 这个缩放性能影响极大，原因不明
                                // scale={[v.scale.ref.value, v.scale.ref.value]}
                                onEnter={() => enterMain(i)}
                                onClick={() => clickButton(v.code, i)}
                            />
                        );
                    })}
                </container>
                <container
                    hidden={!selectHard.value}
                    loc={[0, 0, BUTTONS_WIDTH, BUTTONS_HEIGHT]}
                    alpha={buttonsAlpha.ref.value}
                >
                    {hard.map((v, i) => {
                        const x = 50 - i * 10;
                        const y = 20 + i * 30;
                        return (
                            <text
                                text={v.name}
                                font={buttonFont}
                                loc={[x, y, void 0, void 0, 0, 0.5]}
                                cursor="pointer"
                                filter={buttonFilter}
                                fillStyle={v.colorTrans.ref.value}
                                onEnter={() => enterHard(i)}
                                onClick={() => clickButton(v.code, i)}
                            />
                        );
                    })}
                </container>
                <sprite
                    ref={cursorSprite}
                    width={10}
                    height={10}
                    render={renderCursor}
                    loc={[cursorX.ref.value, cursorY.ref.value]}
                    anc={[1, 0.5]}
                    nocache
                />
            </container>
            <container
                zIndex={15}
                loc={[MAIN_WIDTH - 40, MAIN_HEIGHT - 20, 80, 40, 1, 1]}
            >
                <SoundVolume
                    loc={[0, 0, 40, 40]}
                    cursor="pointer"
                    strokeStyle={soundColor.ref.value}
                    onClick={toggleSound}
                />
                {!fullscreen.value ? (
                    <Fullscreen
                        loc={[40, 0, 40, 40]}
                        onClick={toggleFullscreen}
                        cursor="pointer"
                    />
                ) : (
                    <ExitFullscreen
                        loc={[40, 0, 40, 40]}
                        onClick={toggleFullscreen}
                        cursor="pointer"
                    />
                )}
                <g-line
                    line={[5, 35, 35, 5]}
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
