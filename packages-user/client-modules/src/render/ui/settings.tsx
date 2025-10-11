import { ElementLocator } from '@motajs/render';
import {
    GameUI,
    IUIMountable,
    SetupComponentOptions,
    UIComponentProps
} from '@motajs/system-ui';
import { defineComponent } from 'vue';
import {
    ChoiceItem,
    ChoiceKey,
    Choices,
    ChoicesProps,
    getConfirm,
    waitbox
} from '../components';
import { mainUi } from '@motajs/legacy-ui';
import { gameKey } from '@motajs/system-action';
import { generateKeyboardEvent } from '@motajs/system-action';
import { getVitualKeyOnce } from '@motajs/legacy-ui';
import { getAllSavesData, getSaveData, syncFromServer } from '../utils';
import { getInput } from '../components';
import { saveWithExist } from './save';
import { compressToBase64 } from 'lz-string';
import { ViewMapUI } from './viewmap';
import { CENTER_LOC, FULL_LOC, MAIN_HEIGHT, POP_BOX_WIDTH } from '../shared';
import { useKey } from '../use';

export interface MainSettingsProps
    extends Partial<ChoicesProps>,
        UIComponentProps {
    loc: ElementLocator;
}

const mainSettingsProps = {
    props: ['loc', 'controller', 'instance']
} satisfies SetupComponentOptions<MainSettingsProps>;

const enum MainChoice {
    SystemSetting,
    VirtualKey,
    ViewMap,
    /** @see {@link ReplaySettings} */
    Replay,
    /** @see {@link SyncSave} */
    SyncSave,
    /** @see {@link GameInfo} */
    GameInfo,
    Restart,
    Back
}

export const MainSettings = defineComponent<MainSettingsProps>(props => {
    const choices: ChoiceItem[] = [
        [MainChoice.SystemSetting, '系统设置'],
        [MainChoice.VirtualKey, '虚拟键盘'],
        [MainChoice.ViewMap, '浏览地图'],
        [MainChoice.Replay, '录像回放'],
        [MainChoice.SyncSave, '同步存档'],
        [MainChoice.GameInfo, '游戏信息'],
        [MainChoice.Restart, '返回标题'],
        [MainChoice.Back, '返回游戏']
    ];

    const [key, scope] = useKey();
    key.realize('exit', () => props.controller.close(props.instance));

    const choose = async (key: ChoiceKey) => {
        switch (key) {
            case MainChoice.SystemSetting: {
                mainUi.open('settings');
                break;
            }
            case MainChoice.VirtualKey: {
                getVitualKeyOnce().then(value => {
                    gameKey.emitKey(
                        value.key,
                        value.assist,
                        'up',
                        generateKeyboardEvent(value.key, value.assist)
                    );
                });
                break;
            }
            case MainChoice.ViewMap: {
                props.controller.open(ViewMapUI, {
                    loc: FULL_LOC
                });
                break;
            }
            case MainChoice.Replay: {
                props.controller.open(ReplaySettingsUI, { loc: props.loc });
                break;
            }
            case MainChoice.SyncSave: {
                props.controller.open(SyncSaveUI, { loc: props.loc });
                break;
            }
            case MainChoice.GameInfo: {
                props.controller.open(GameInfoUI, { loc: props.loc });
                break;
            }
            case MainChoice.Restart: {
                const confirm = await getConfirm(
                    props.controller,
                    '确认要返回标题吗？',
                    CENTER_LOC,
                    POP_BOX_WIDTH
                );
                if (confirm) {
                    props.controller.closeAll();
                    core.restart();
                }
                break;
            }
            case MainChoice.Back: {
                props.controller.close(props.instance);
                break;
            }
        }
    };

    return () => (
        <Choices
            loc={props.loc}
            choices={choices}
            width={POP_BOX_WIDTH}
            onChoose={choose}
            maxHeight={MAIN_HEIGHT - 32}
            interval={8}
            scope={scope}
        />
    );
}, mainSettingsProps);

const enum ReplayChoice {
    Start,
    StartFromSave,
    ResumeReplay,
    ReplayRest,
    ChooseReplay,
    Download,
    Back
}

export const ReplaySettings = defineComponent<MainSettingsProps>(props => {
    const choice: ChoiceItem[] = [
        [ReplayChoice.Start, '从头回放录像'],
        [ReplayChoice.StartFromSave, '从存档开始回放'],
        [ReplayChoice.ResumeReplay, '接续播放剩余录像'],
        [ReplayChoice.ReplayRest, '播放存档剩余录像'],
        [ReplayChoice.ChooseReplay, '选择录像文件'],
        [ReplayChoice.Download, '下载当前录像'],
        [ReplayChoice.Back, '返回游戏']
    ];

    const [key, scope] = useKey();
    key.realize('exit', () => props.controller.close(props.instance));

    const choose = async (key: ChoiceKey) => {
        switch (key) {
            case ReplayChoice.Start: {
                props.controller.closeAll();
                core.ui.closePanel();
                const route = core.status.route.slice();
                const seed = core.getFlag<number>('__seed__');
                core.startGame(core.status.hard, seed, route);
                break;
            }
            case ReplayChoice.StartFromSave: {
                const index = await saveWithExist(props.controller, FULL_LOC);
                if (index === -2) break;
                if (index === -1) {
                    core.doSL('autoSave', 'replayLoad');
                } else {
                    core.doSL(index + 1, 'replayLoad');
                }
                props.controller.closeAll();
                break;
            }
            case ReplayChoice.ResumeReplay: {
                const index = await saveWithExist(props.controller, FULL_LOC);
                if (index === -2) break;
                const name = index === -1 ? 'autoSave' : index + 1;
                const success = core.doSL(name, 'replayRemain');
                if (!success) {
                    props.controller.closeAll();
                    break;
                }
                await getConfirm(
                    props.controller,
                    '[步骤2]请选择第二个存档。\n\\r[yellow]该存档必须是前一个存档的后续。\\r\n将尝试播放到此存档。',
                    CENTER_LOC,
                    POP_BOX_WIDTH
                );
                const index2 = await saveWithExist(props.controller, FULL_LOC);
                if (index2 === -2) break;
                const name2 = index2 === -1 ? 'autoSave' : index2 + 1;
                core.doSL(name2, 'replayRemain');
                props.controller.closeAll();
                break;
            }
            case ReplayChoice.ReplayRest: {
                const index = await saveWithExist(props.controller, FULL_LOC);
                if (index === -2) break;
                if (index === -1) {
                    core.doSL('autoSave', 'replaySince');
                } else {
                    core.doSL(index + 1, 'replaySince');
                }
                props.controller.closeAll();
                break;
            }
            case ReplayChoice.ChooseReplay: {
                props.controller.closeAll();
                core.chooseReplayFile();
                break;
            }
            case ReplayChoice.Download: {
                core.download(
                    core.firstData.name + '_' + core.formatDate2() + '.h5route',
                    compressToBase64(
                        JSON.stringify({
                            name: core.firstData.name,
                            hard: core.status.hard,
                            seed: core.getFlag('__seed__'),
                            route: core.encodeRoute(core.status.route)
                        })
                    )
                );
                break;
            }
            case ReplayChoice.Back: {
                props.controller.close(props.instance);
                break;
            }
        }
    };

    return () => (
        <Choices
            loc={props.loc}
            choices={choice}
            width={POP_BOX_WIDTH}
            onChoose={choose}
            interval={8}
            scope={scope}
            maxHeight={MAIN_HEIGHT - 32}
        />
    );
}, mainSettingsProps);

const enum GameInfoChoice {
    Statistics,
    Project,
    Tower,
    Help,
    Download,
    Back
}

export const GameInfo = defineComponent<MainSettingsProps>(props => {
    const choices: ChoiceItem[] = [
        [GameInfoChoice.Statistics, '数据统计'],
        [GameInfoChoice.Project, '查看工程'],
        [GameInfoChoice.Tower, '游戏主页'],
        [GameInfoChoice.Help, '操作帮助'],
        [GameInfoChoice.Download, '下载离线版本'],
        [GameInfoChoice.Back, '返回主菜单']
    ];

    const [key, scope] = useKey();
    key.realize('exit', () => props.controller.close(props.instance));

    const choose = async (key: ChoiceKey) => {
        switch (key) {
            case GameInfoChoice.Statistics: {
                getConfirm(
                    props.controller,
                    '数据统计尚未完工',
                    CENTER_LOC,
                    POP_BOX_WIDTH
                );
                break;
            }
            case GameInfoChoice.Project: {
                if (core.platform.isPC) window.open('editor.html', '_blank');
                else {
                    const confirm = await getConfirm(
                        props.controller,
                        '即将离开本游戏，跳转至工程页面，确认跳转？',
                        CENTER_LOC,
                        POP_BOX_WIDTH
                    );
                    if (confirm) {
                        window.location.href = 'editor-mobile.html';
                    }
                }
                break;
            }
            case GameInfoChoice.Tower: {
                const name = core.firstData.name;
                const href = `/tower/?name=${name}`;
                if (core.platform.isPC) {
                    window.open(href, '_blank');
                } else {
                    const confirm = await getConfirm(
                        props.controller,
                        '即将离开本游戏，跳转至评论页面，确认跳转？',
                        CENTER_LOC,
                        POP_BOX_WIDTH
                    );
                    if (confirm) {
                        window.location.href = href;
                    }
                }
                break;
            }
            case GameInfoChoice.Download: {
                const name = core.firstData.name;
                const href = `/games/${name}/${name}.zip`;
                if (core.platform.isPC) window.open(href);
                else window.location.href = href;
                break;
            }
            case GameInfoChoice.Help: {
                // todo
                break;
            }
            case GameInfoChoice.Back: {
                props.controller.close(props.instance);
                break;
            }
        }
    };

    return () => (
        <Choices
            loc={props.loc}
            choices={choices}
            width={POP_BOX_WIDTH}
            onChoose={choose}
            interval={8}
            scope={scope}
        />
    );
}, mainSettingsProps);

const enum SyncSaveChoice {
    // ----- 主菜单
    ToServer,
    FromServer,
    ToLocal,
    FromLocal,
    ClearLocal,
    Back,
    // ----- 子菜单
    AllSaves,
    NowSave
}

export const SyncSave = defineComponent<MainSettingsProps>(props => {
    const choices: ChoiceItem[] = [
        [SyncSaveChoice.ToServer, '同步存档至服务器'],
        [SyncSaveChoice.FromServer, '从服务器加载存档'],
        [SyncSaveChoice.ToLocal, '存档至本地文件'],
        [SyncSaveChoice.FromLocal, '从本地文件读档'],
        [SyncSaveChoice.ClearLocal, '清空本地存档'],
        [SyncSaveChoice.Back, '返回上一级']
    ];

    const [key, scope] = useKey();
    key.realize('exit', () => props.controller.close(props.instance));

    const choose = async (key: ChoiceKey) => {
        switch (key) {
            case SyncSaveChoice.ToServer: {
                props.controller.open(SyncSaveSelectUI, { loc: props.loc });
                break;
            }
            case SyncSaveChoice.FromServer: {
                const replay = await getInput(
                    props.controller,
                    '请输入存档编号+密码',
                    CENTER_LOC,
                    POP_BOX_WIDTH
                );
                await syncFromServer(props.controller, replay);
                break;
            }
            case SyncSaveChoice.ToLocal: {
                props.controller.open(DownloadSaveSelectUI, { loc: props.loc });
                break;
            }
            case SyncSaveChoice.FromLocal: {
                // todo
                break;
            }
            case SyncSaveChoice.ClearLocal: {
                props.controller.open(ClearSaveSelectUI, { loc: props.loc });
                break;
            }
            case SyncSaveChoice.Back: {
                props.controller.close(props.instance);
                break;
            }
        }
    };

    return () => (
        <Choices
            loc={props.loc}
            width={POP_BOX_WIDTH}
            choices={choices}
            onChoose={choose}
            interval={8}
            scope={scope}
        />
    );
}, mainSettingsProps);

export const SyncSaveSelect = defineComponent<MainSettingsProps>(props => {
    const choices: ChoiceItem[] = [
        [SyncSaveChoice.AllSaves, '同步全部存档'],
        [SyncSaveChoice.NowSave, '同步当前存档'],
        [SyncSaveChoice.Back, '返回上一级']
    ];

    const [key, scope] = useKey();
    key.realize('exit', () => props.controller.close(props.instance));

    const choose = async (key: ChoiceKey) => {
        switch (key) {
            case SyncSaveChoice.AllSaves: {
                core.playSound('confirm.opus');
                const confirm = await getConfirm(
                    props.controller,
                    '你确定要同步全部存档么？这可能在存档较多的时候比较慢。',
                    CENTER_LOC,
                    POP_BOX_WIDTH
                );
                if (confirm) {
                    core.syncSave('all');
                }
                break;
            }
            case SyncSaveChoice.NowSave: {
                core.playSound('confirm.opus');
                const confirm = await getConfirm(
                    props.controller,
                    '确定要同步当前存档吗？',
                    CENTER_LOC,
                    POP_BOX_WIDTH
                );
                if (confirm) {
                    core.syncSave();
                }
                break;
            }
            case SyncSaveChoice.Back: {
                props.controller.close(props.instance);
                break;
            }
        }
    };

    return () => (
        <Choices
            loc={props.loc}
            width={POP_BOX_WIDTH}
            choices={choices}
            onChoose={choose}
            interval={8}
            scope={scope}
        />
    );
}, mainSettingsProps);

export const DownloadSaveSelect = defineComponent<MainSettingsProps>(props => {
    const choices: ChoiceItem[] = [
        [SyncSaveChoice.AllSaves, '下载全部存档'],
        [SyncSaveChoice.NowSave, '下载当前存档'],
        [SyncSaveChoice.Back, '返回上一级']
    ];

    const [key, scope] = useKey();
    key.realize('exit', () => props.controller.close(props.instance));

    const choose = async (key: ChoiceKey) => {
        switch (key) {
            case SyncSaveChoice.AllSaves: {
                const confirm = await getConfirm(
                    props.controller,
                    '确认要下载所有存档吗？',
                    CENTER_LOC,
                    POP_BOX_WIDTH
                );
                if (confirm) {
                    const data = await waitbox(
                        props.controller,
                        CENTER_LOC,
                        POP_BOX_WIDTH,
                        getAllSavesData(),
                        { text: '请等待处理完毕' }
                    );
                    core.download(
                        `${core.firstData.name}_${core.formatDate2(
                            new Date()
                        )}.h5save`,
                        data
                    );
                }
                break;
            }
            case SyncSaveChoice.NowSave: {
                const confirm = await getConfirm(
                    props.controller,
                    '确认要下载当前存档吗？',
                    CENTER_LOC,
                    POP_BOX_WIDTH
                );
                if (confirm) {
                    const data = await getSaveData(core.saves.saveIndex);
                    core.download(
                        `${core.firstData.name}_${core.formatDate2(
                            new Date()
                        )}.h5save`,
                        data
                    );
                }
                break;
            }
            case SyncSaveChoice.Back: {
                props.controller.close(props.instance);
                break;
            }
        }
    };

    return () => (
        <Choices
            loc={props.loc}
            width={POP_BOX_WIDTH}
            choices={choices}
            onChoose={choose}
            interval={8}
            scope={scope}
        />
    );
}, mainSettingsProps);

export const ClearSaveSelect = defineComponent<MainSettingsProps>(props => {
    const choices: ChoiceItem[] = [
        [SyncSaveChoice.AllSaves, '清空全部塔存档'],
        [SyncSaveChoice.NowSave, '清空当前塔存档'],
        [SyncSaveChoice.Back, '返回上一级']
    ];

    const [key, scope] = useKey();
    key.realize('exit', () => props.controller.close(props.instance));

    const choose = async (key: ChoiceKey) => {
        switch (key) {
            case SyncSaveChoice.AllSaves: {
                const confirm = await getConfirm(
                    props.controller,
                    '你确定要清除【全部游戏】的所有本地存档？此行为不可逆！！！',
                    CENTER_LOC,
                    POP_BOX_WIDTH
                );
                if (confirm) {
                    await waitbox(
                        props.controller,
                        CENTER_LOC,
                        POP_BOX_WIDTH,
                        new Promise<void>(res => {
                            core.clearLocalForage(() => {
                                core.saves.ids = {};
                                core.saves.autosave.data = null;
                                core.saves.autosave.updated = false;
                                core.saves.autosave.now = 0;
                                // @ts-expect-error 沙比样板
                                core.saves.cache = {};
                                core.saves.saveIndex = 1;
                                core.saves.favorite = [];
                                core.saves.favoriteName = {};
                                // @ts-expect-error 沙比样板
                                core.control._updateFavoriteSaves();
                                core.removeLocalStorage('saveIndex');
                                res();
                            });
                        }),
                        { text: '正在情况，请稍后...' }
                    );
                    await getConfirm(
                        props.controller,
                        '所有塔的存档已经全部清空',
                        CENTER_LOC,
                        POP_BOX_WIDTH
                    );
                }
                break;
            }
            case SyncSaveChoice.NowSave: {
                const confirm = await getConfirm(
                    props.controller,
                    '你确定要清除【当前游戏】的所有本地存档？此行为不可逆！！！',
                    CENTER_LOC,
                    POP_BOX_WIDTH
                );
                if (confirm) {
                    await waitbox(
                        props.controller,
                        CENTER_LOC,
                        POP_BOX_WIDTH,
                        new Promise<void>(res => {
                            Object.keys(core.saves.ids).forEach(function (v) {
                                core.removeLocalForage('save' + v);
                            });
                            core.removeLocalForage('autoSave', () => {
                                core.saves.ids = {};
                                core.saves.autosave.data = null;
                                core.saves.autosave.updated = false;
                                core.saves.autosave.now = 0;
                                core.ui.closePanel();
                                core.saves.saveIndex = 1;
                                core.saves.favorite = [];
                                core.saves.favoriteName = {};
                                // @ts-expect-error 沙比样板
                                core.control._updateFavoriteSaves();
                                core.removeLocalStorage('saveIndex');
                                res();
                            });
                        }),
                        { text: '正在情况，请稍后...' }
                    );
                    await getConfirm(
                        props.controller,
                        '当前塔的存档已被清空',
                        CENTER_LOC,
                        POP_BOX_WIDTH
                    );
                }
                break;
            }
            case SyncSaveChoice.Back: {
                props.controller.close(props.instance);
                break;
            }
        }
    };

    return () => (
        <Choices
            loc={props.loc}
            width={240}
            choices={choices}
            onChoose={choose}
            interval={8}
            scope={scope}
        />
    );
}, mainSettingsProps);

/** @see {@link MainSettings} */
export const MainSettingsUI = new GameUI('main-settings', MainSettings);
/** @see {@link ReplaySettings} */
export const ReplaySettingsUI = new GameUI('replay-settings', ReplaySettings);
/** @see {@link GameInfo} */
export const GameInfoUI = new GameUI('game-info', GameInfo);
/** @see {@link SyncSave} */
export const SyncSaveUI = new GameUI('sync-save', SyncSave);
/** @see {@link SyncSaveSelect} */
export const SyncSaveSelectUI = new GameUI('sync-save-select', SyncSaveSelect);
/** @see {@link DownloadSaveSelect} */
export const DownloadSaveSelectUI = new GameUI(
    'download-save-select',
    DownloadSaveSelect
);
/** @see {@link ClearSaveSelect} */
export const ClearSaveSelectUI = new GameUI(
    'clear-save-select',
    ClearSaveSelect
);

export function openSettings(
    controller: IUIMountable,
    loc: ElementLocator,
    props?: MainSettingsProps
) {
    controller.open(MainSettingsUI, {
        ...props,
        loc
    });
}

export function openReplay(
    controller: IUIMountable,
    loc: ElementLocator,
    props?: MainSettingsProps
) {
    controller.open(ReplaySettingsUI, {
        ...props,
        loc
    });
}
