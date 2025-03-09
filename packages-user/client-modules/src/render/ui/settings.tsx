import { ElementLocator } from '@motajs/render';
import { GameUI, UIComponentProps } from '@motajs/system-ui';
import { defineComponent } from 'vue';
import {
    ChoiceItem,
    ChoiceKey,
    Choices,
    ChoicesProps,
    getConfirm,
    SetupComponentOptions,
    waitbox
} from '../components';
import { mainUi } from '@motajs/legacy-ui';
import { gameKey } from '@motajs/system-action';
import { generateKeyboardEvent } from '@motajs/system-action';
import { getVitualKeyOnce } from '@motajs/legacy-ui';
import { getAllSavesData, getSaveData } from '../../utils';

export interface SettingsProps extends Partial<ChoicesProps>, UIComponentProps {
    loc: ElementLocator;
}

const settingsProps = {
    props: ['loc', 'controller', 'instance']
} satisfies SetupComponentOptions<SettingsProps>;

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

export const MainSettings = defineComponent<SettingsProps>(props => {
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

    const choose = (key: ChoiceKey) => {
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
                // todo
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
                props.controller.closeAll();
                core.restart();
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
            width={240}
            onChoose={choose}
        />
    );
}, settingsProps);

const enum ReplayChoice {
    Start,
    StartFromSave,
    ResumeReplay,
    ReplayRest,
    ChooseReplay,
    Download,
    Back
}

export const ReplaySettings = defineComponent<SettingsProps>(props => {
    const choice: ChoiceItem[] = [
        [ReplayChoice.Start, '从头回放录像'],
        [ReplayChoice.StartFromSave, '从存档开始回放'],
        [ReplayChoice.ResumeReplay, '接续播放剩余录像'],
        [ReplayChoice.ReplayRest, '播放存档剩余录像'],
        [ReplayChoice.ChooseReplay, '选择录像文件'],
        [ReplayChoice.Download, '下载当前录像'],
        [ReplayChoice.Back, '返回游戏']
    ];

    const choose = (key: ChoiceKey) => {
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
                // todo
                break;
            }
            case ReplayChoice.ResumeReplay: {
                // todo
                break;
            }
            case ReplayChoice.ReplayRest: {
                // todo
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
                    // @ts-expect-error 暂时无法推导
                    LZString.compressToBase64(
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
            width={240}
            onChoose={choose}
        />
    );
}, settingsProps);

const enum GameInfoChoice {
    Statistics,
    Project,
    Tower,
    Help,
    Download,
    Back
}

export const GameInfo = defineComponent<SettingsProps>(props => {
    const choices: ChoiceItem[] = [
        [GameInfoChoice.Statistics, '数据统计'],
        [GameInfoChoice.Project, '查看工程'],
        [GameInfoChoice.Tower, '游戏主页'],
        [GameInfoChoice.Help, '操作帮助'],
        [GameInfoChoice.Download, '下载离线版本'],
        [GameInfoChoice.Back, '返回主菜单']
    ];

    const choose = async (key: ChoiceKey) => {
        switch (key) {
            case GameInfoChoice.Statistics: {
                // todo
                break;
            }
            case GameInfoChoice.Project: {
                if (core.platform.isPC) window.open('editor.html', '_blank');
                else {
                    const confirm = await getConfirm(
                        props.controller,
                        '即将离开本游戏，跳转至工程页面，确认跳转？',
                        props.loc,
                        240
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
                        props.loc,
                        240
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
            width={240}
            onChoose={choose}
        />
    );
});

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

export const SyncSave = defineComponent<SettingsProps>(props => {
    const choices: ChoiceItem[] = [
        [SyncSaveChoice.ToServer, '同步存档至服务器'],
        [SyncSaveChoice.FromServer, '从服务器加载存档'],
        [SyncSaveChoice.ToLocal, '存档至本地文件'],
        [SyncSaveChoice.FromLocal, '存本地文件读档'],
        [SyncSaveChoice.ClearLocal, '清空本地存档'],
        [SyncSaveChoice.Back, '返回上一级']
    ];

    const choose = (key: ChoiceKey) => {
        switch (key) {
            case SyncSaveChoice.ToServer: {
                props.controller.open(SyncSaveSelectUI, { loc: props.loc });
                break;
            }
            case SyncSaveChoice.FromServer: {
                // todo
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
            width={240}
            choices={choices}
            onChoose={choose}
        />
    );
});

export const SyncSaveSelect = defineComponent<SettingsProps>(props => {
    const choices: ChoiceItem[] = [
        [SyncSaveChoice.AllSaves, '同步全部存档'],
        [SyncSaveChoice.NowSave, '同步当前存档'],
        [SyncSaveChoice.Back, '返回上一级']
    ];

    const choose = async (key: ChoiceKey) => {
        switch (key) {
            case SyncSaveChoice.AllSaves: {
                core.playSound('confirm.opus');
                const confirm = await getConfirm(
                    props.controller,
                    '你确定要同步全部存档么？这可能在存档较多的时候比较慢。',
                    props.loc,
                    240
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
                    props.loc,
                    240
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
            width={240}
            choices={choices}
            onChoose={choose}
        />
    );
});

export const DownloadSaveSelect = defineComponent<SettingsProps>(props => {
    const choices: ChoiceItem[] = [
        [SyncSaveChoice.AllSaves, '下载全部存档'],
        [SyncSaveChoice.NowSave, '下载当前存档'],
        [SyncSaveChoice.Back, '返回上一级']
    ];

    const choose = async (key: ChoiceKey) => {
        switch (key) {
            case SyncSaveChoice.AllSaves: {
                const confirm = await getConfirm(
                    props.controller,
                    '确认要下载所有存档吗？',
                    props.loc,
                    240
                );
                if (confirm) {
                    const data = await waitbox(
                        props.controller,
                        props.loc,
                        240,
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
                    props.loc,
                    240
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
            width={240}
            choices={choices}
            onChoose={choose}
        />
    );
});

export const ClearSaveSelect = defineComponent<SettingsProps>(props => {
    const choices: ChoiceItem[] = [
        [SyncSaveChoice.AllSaves, '清空全部塔存档'],
        [SyncSaveChoice.NowSave, '清空当前塔存档'],
        [SyncSaveChoice.Back, '返回上一级']
    ];

    const choose = async (key: ChoiceKey) => {
        switch (key) {
            case SyncSaveChoice.AllSaves: {
                const confirm = await getConfirm(
                    props.controller,
                    '你确定要清除【全部游戏】的所有本地存档？此行为不可逆！！！',
                    props.loc,
                    240
                );
                if (confirm) {
                    await waitbox(
                        props.controller,
                        props.loc,
                        240,
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
                        props.loc,
                        240
                    );
                }
                break;
            }
            case SyncSaveChoice.NowSave: {
                const confirm = await getConfirm(
                    props.controller,
                    '你确定要清除【当前游戏】的所有本地存档？此行为不可逆！！！',
                    props.loc,
                    240
                );
                if (confirm) {
                    await waitbox(
                        props.controller,
                        props.loc,
                        240,
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
                        props.loc,
                        240
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
        />
    );
});

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
