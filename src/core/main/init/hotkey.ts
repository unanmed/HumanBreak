import { KeyCode } from '@/plugin/keyCodes';
import { Hotkey, HotkeyJSON } from '../custom/hotkey';
import {
    generateBinary,
    keycode,
    openDanmakuPoster,
    tip
} from '@/plugin/utils';
import { hovered } from './fixed';
import { hasMarkedEnemy, markEnemy, unmarkEnemy } from '@/plugin/mark';
import { mainUi } from './ui';
import { GameStorage } from '../storage';

export const mainScope = Symbol.for('@key_main');
export const gameKey = new Hotkey('gameKey', '游戏按键');

// todo: 读取上一个手动存档，存档至下一个存档栏
// ----- Register
gameKey
    // --------------------
    .group('ui', 'ui界面')
    .register({
        id: 'book',
        name: '怪物手册',
        defaults: KeyCode.KeyX
    })
    .register({
        id: 'save',
        name: '存档界面',
        defaults: KeyCode.KeyS
    })
    .register({
        id: 'load',
        name: '读档界面',
        defaults: KeyCode.KeyD
    })
    .register({
        id: 'toolbox',
        name: '道具栏',
        defaults: KeyCode.KeyT
    })
    .register({
        id: 'equipbox',
        name: '装备栏',
        defaults: KeyCode.KeyQ
    })
    .register({
        id: 'fly',
        name: '楼层传送',
        defaults: KeyCode.KeyG
    })
    .register({
        id: 'menu',
        name: '菜单',
        defaults: KeyCode.Escape
    })
    .register({
        id: 'replay',
        name: '录像回放',
        defaults: KeyCode.KeyR
    })
    .register({
        id: 'shop',
        name: '快捷商店',
        defaults: KeyCode.KeyV
    })
    .register({
        id: 'statistics',
        name: '数据统计',
        defaults: KeyCode.KeyB
    })
    .register({
        id: 'viewMap_1',
        name: '浏览地图_1',
        defaults: KeyCode.PageUp
    })
    .register({
        id: 'viewMap_2',
        name: '浏览地图_2',
        defaults: KeyCode.PageDown
    })
    .register({
        id: 'skillTree',
        name: '技能树',
        defaults: KeyCode.KeyJ
    })
    .register({
        id: 'desc',
        name: '百科全书',
        defaults: KeyCode.KeyH
    })
    // --------------------
    .group('function', '功能按键')
    .register({
        id: 'undo_1',
        name: '回退_1',
        defaults: KeyCode.KeyA
    })
    .register({
        id: 'undo_2',
        name: '回退_2',
        defaults: KeyCode.Digit5
    })
    .register({
        id: 'redo_1',
        name: '恢复_1',
        defaults: KeyCode.KeyW
    })
    .register({
        id: 'redo_2',
        name: '恢复_2',
        defaults: KeyCode.Digit6
    })
    .register({
        id: 'turn',
        name: '勇士转向',
        defaults: KeyCode.KeyZ
    })
    .register({
        id: 'getNext_1',
        name: '轻按_1',
        defaults: KeyCode.Space
    })
    .register({
        id: 'getNext_2',
        name: '轻按_2',
        defaults: KeyCode.Digit7
    })
    .register({
        id: 'mark',
        name: '标记怪物',
        defaults: KeyCode.KeyM
    })
    .register({
        id: 'special',
        name: '鼠标位置怪物属性',
        defaults: KeyCode.KeyE
    })
    .register({
        id: 'critical',
        name: '鼠标位置怪物临界',
        defaults: KeyCode.KeyC
    })
    .register({
        id: 'danmaku',
        name: '发送弹幕',
        defaults: KeyCode.KeyA,
        ctrl: true
    })
    .register({
        id: 'quickEquip_1',
        name: '切换/保存套装_1',
        defaults: KeyCode.Digit1,
        alt: true
    })
    .register({
        id: 'quickEquip_2',
        name: '切换/保存套装_2',
        defaults: KeyCode.Digit2,
        alt: true
    })
    .register({
        id: 'quickEquip_3',
        name: '切换/保存套装_3',
        defaults: KeyCode.Digit3,
        alt: true
    })
    .register({
        id: 'quickEquip_4',
        name: '切换/保存套装_4',
        defaults: KeyCode.Digit4,
        alt: true
    })
    .register({
        id: 'quickEquip_5',
        name: '切换/保存套装_5',
        defaults: KeyCode.Digit5,
        alt: true
    })
    .register({
        id: 'quickEquip_6',
        name: '切换/保存套装_6',
        defaults: KeyCode.Digit6,
        alt: true
    })
    .register({
        id: 'quickEquip_7',
        name: '切换/保存套装_7',
        defaults: KeyCode.Digit7,
        alt: true
    })
    .register({
        id: 'quickEquip_8',
        name: '切换/保存套装_8',
        defaults: KeyCode.Digit8,
        alt: true
    })
    .register({
        id: 'quickEquip_9',
        name: '切换/保存套装_9',
        defaults: KeyCode.Digit9,
        alt: true
    })
    .register({
        id: 'quickEquip_0',
        name: '切换/保存套装_0',
        defaults: KeyCode.Digit0,
        alt: true
    })
    // --------------------
    .group('skill', '技能按键')
    .register({
        id: 'skill1',
        name: '断灭之刃',
        defaults: KeyCode.Digit1
    })
    .register({
        id: 'skill2',
        name: '跳跃',
        defaults: KeyCode.Digit2
    })
    .register({
        id: 'skill3',
        name: '铸剑为盾',
        defaults: KeyCode.Digit3
    })
    // --------------------
    .group('system', '系统按键')
    .register({
        id: 'restart',
        name: '回到开始界面',
        defaults: KeyCode.KeyN
    })
    .register({
        id: 'comment',
        name: '评论区',
        defaults: KeyCode.KeyP
    })
    .register({
        id: 'debug',
        name: '调试模式',
        defaults: KeyCode.F8
    })
    // --------------------
    .group('general', '通用按键')
    .register({
        id: 'exit_1',
        name: '退出ui界面_1',
        defaults: KeyCode.KeyX
    })
    .register({
        id: 'exit_2',
        name: '退出ui界面_2',
        defaults: KeyCode.Escape
    })
    .register({
        id: 'confirm_1',
        name: '确认_1',
        defaults: KeyCode.Enter
    })
    .register({
        id: 'confirm_2',
        name: '确认_2',
        defaults: KeyCode.Space
    })
    .register({
        id: 'confirm_3',
        name: '确认_3',
        defaults: KeyCode.KeyC
    })
    // --------------------
    .group('@ui_start', '开始界面')
    .register({
        id: '@start_up',
        name: '上移光标',
        defaults: KeyCode.UpArrow,
        type: 'down'
    })
    .register({
        id: '@start_down',
        name: '下移光标',
        defaults: KeyCode.DownArrow,
        type: 'down'
    })
    // --------------------
    .group('@ui_book', '怪物手册')
    .register({
        id: '@book_up',
        name: '上移光标',
        defaults: KeyCode.UpArrow,
        type: 'down'
    })
    .register({
        id: '@book_down',
        name: '下移光标',
        defaults: KeyCode.DownArrow,
        type: 'down'
    })
    .register({
        id: '@book_pageDown_1',
        name: '下移5个怪物_1',
        defaults: KeyCode.RightArrow,
        type: 'down'
    })
    .register({
        id: '@book_pageDown_2',
        name: '下移5个怪物_2',
        defaults: KeyCode.PageDown,
        type: 'down'
    })
    .register({
        id: '@book_pageUp_1',
        name: '上移5个怪物_1',
        defaults: KeyCode.LeftArrow,
        type: 'down'
    })
    .register({
        id: '@book_pageUp_2',
        name: '上移5个怪物_2',
        defaults: KeyCode.PageUp,
        type: 'down'
    })
    // --------------------
    .group('@ui_toolbox', '道具栏')
    .register({
        id: '@toolbox_right',
        name: '光标右移',
        defaults: KeyCode.RightArrow,
        type: 'down'
    })
    .register({
        id: '@toolbox_left',
        name: '光标左移',
        defaults: KeyCode.LeftArrow,
        type: 'down'
    })
    .register({
        id: '@toolbox_up',
        name: '光标上移',
        defaults: KeyCode.UpArrow,
        type: 'down'
    })
    .register({
        id: '@toolbox_down',
        name: '光标下移',
        defaults: KeyCode.DownArrow,
        type: 'down'
    })
    // --------------------
    .group('@ui_shop', '商店')
    .register({
        id: '@shop_up',
        name: '上移光标',
        defaults: KeyCode.UpArrow
    })
    .register({
        id: '@shop_down',
        name: '下移光标',
        defaults: KeyCode.DownArrow
    })
    .register({
        id: '@shop_add',
        name: '增加购买量',
        defaults: KeyCode.RightArrow,
        type: 'down'
    })
    .register({
        id: '@shop_min',
        name: '减少购买量',
        defaults: KeyCode.LeftArrow,
        type: 'down'
    })
    // --------------------
    .group('@ui_fly', '楼层传送')
    .register({
        id: '@fly_left',
        name: '左移地图',
        defaults: KeyCode.LeftArrow
    })
    .register({
        id: '@fly_right',
        name: '右移地图',
        defaults: KeyCode.RightArrow
    })
    .register({
        id: '@fly_up',
        name: '上移地图',
        defaults: KeyCode.UpArrow
    })
    .register({
        id: '@fly_down',
        name: '下移地图',
        defaults: KeyCode.DownArrow
    })
    .register({
        id: '@fly_last',
        name: '上一张地图',
        defaults: KeyCode.PageDown
    })
    .register({
        id: '@fly_next',
        name: '下一张地图',
        defaults: KeyCode.PageUp
    })
    // --------------------
    .group('@ui_fly_tradition', '楼层传送-传统按键')
    .register({
        id: '@fly_down_t',
        name: '上一张地图',
        defaults: KeyCode.DownArrow
    })
    .register({
        id: '@fly_up_t',
        name: '下一张地图',
        defaults: KeyCode.UpArrow
    })
    .register({
        id: '@fly_left_t_1',
        name: '前10张地图_1',
        defaults: KeyCode.LeftArrow
    })
    .register({
        id: '@fly_left_t_2',
        name: '前10张地图_2',
        defaults: KeyCode.PageDown
    })
    .register({
        id: '@fly_right_t_1',
        name: '后10张地图_1',
        defaults: KeyCode.RightArrow
    })
    .register({
        id: '@fly_right_t_2',
        name: '后10张地图_2',
        defaults: KeyCode.PageUp
    });

gameKey.enable();
gameKey.use(mainScope);

// ----- Realization

gameKey
    .when(() => !core.status.lockControl && !core.isMoving())
    .realize('book', () => {
        core.openBook(true);
    })
    .realize('save', () => {
        core.save(true);
    })
    .realize('load', () => {
        core.load(true);
    })
    .realize('toolbox', () => {
        core.openToolbox(true);
    })
    .realize('equipbox', () => {
        core.openEquipbox(true);
    })
    .realize('fly', () => {
        core.useFly(true);
    })
    .realize('menu', () => {
        core.openSettings(true);
    })
    .realize('replay', () => {
        core.ui._drawReplay();
    })
    .realize('shop', () => {
        core.openQuickShop(true);
    })
    .realize('statistics', () => {
        core.ui._drawStatistics();
    })
    .realize('viewMap', () => {
        core.ui._drawViewMaps();
    })
    .realize('skillTree', () => {
        core.useItem('skill1', true);
    })
    .realize('desc', () => {
        core.useItem('I560', true);
    })
    .realize('undo', () => {
        core.doSL('autoSave', 'load');
    })
    .realize('redo', () => {
        core.doSL('autoSave', 'reload');
    })
    .realize('turn', () => {
        core.turnHero();
    })
    .realize('getNext', () => {
        core.getNextItem();
    })
    .realize('mark', () => {
        const cls = hovered?.event.cls;
        if (cls === 'enemys' || cls === 'enemy48') {
            const id = hovered!.event.id as EnemyIds;
            if (hasMarkedEnemy(id)) unmarkEnemy(id);
            else markEnemy(id);
        }
    })
    .realize('special', () => {
        if (hovered) {
            const { x, y } = hovered;
            const enemy = core.status.thisMap.enemy.list.find(v => {
                return v.x === x && v.y === y;
            });
            if (enemy) mainUi.open('fixedDetail', { panel: 'special' });
        }
    })
    .realize('critical', () => {
        if (hovered) {
            const { x, y } = hovered;
            const enemy = core.status.thisMap.enemy.list.find(v => {
                return v.x === x && v.y === y;
            });
            if (enemy) mainUi.open('fixedDetail', { panel: 'critical' });
        }
    })
    .realize('danmaku', () => {
        openDanmakuPoster();
    })
    .realize('restart', () => {
        core.confirmRestart();
    })
    .realize('comment', () => {
        core.actions._clickGameInfo_openComments();
    })
    .realize('skill1', () => {
        if (!flags.bladeOn) return;
        if (flags.autoSkill) {
            tip('error', '已开启自动切换技能！');
            return;
        }
        core.playSound('光标移动');
        if (flags.blade) flags.blade = false;
        else flags.blade = true;
        core.updateStatusBar();
    })
    .realize('skill2', () => {
        if (
            !flags.chase &&
            !core.status.floorId.startsWith('tower') &&
            flags.skill2
        ) {
            Mota.Plugin.require('skill_g').jumpSkill();
        } else {
            if (core.hasItem('pickaxe')) {
                core.useItem('pickaxe');
            }
        }
    })
    .realize('skill3', () => {
        if (!flags.shieldOn) return;
        if (flags.autoSkill) {
            tip('error', '已开启自动切换技能！');
            return;
        }
        core.playSound('光标移动');
        if (flags.shield) flags.shield = false;
        else flags.shield = true;
        core.updateStatusBar();
    })
    .realize('debug', () => {
        core.debug();
    });

// ----- Storage
const keyStorage = new GameStorage<Record<string, HotkeyJSON>>(
    GameStorage.fromAuthor('AncTe', 'gameKey')
);
keyStorage.data = {};
keyStorage.read();
gameKey.on('set', (id, key, assist) => {
    keyStorage.setValue(id, { key, assist });
});
gameKey.fromJSON(keyStorage.toJSON());

// ----- Listening
document.addEventListener('keyup', e => {
    const assist = generateBinary([e.ctrlKey, e.shiftKey, e.altKey]);
    const code = keycode(e.keyCode);
    if (gameKey.emitKey(code, assist, 'up', e)) {
        e.preventDefault();
    } else {
        // polyfill样板
        if (
            main.dom.startPanel.style.display == 'block' &&
            (main.dom.startButtons.style.display == 'block' ||
                main.dom.levelChooseButtons.style.display == 'block')
        ) {
            if (e.keyCode == 38 || e.keyCode == 33)
                // up/pgup
                main.selectButton((main.selectedButton || 0) - 1);
            else if (e.keyCode == 40 || e.keyCode == 34)
                // down/pgdn
                main.selectButton((main.selectedButton || 0) + 1);
            else if (e.keyCode == 67 || e.keyCode == 13 || e.keyCode == 32)
                // C/Enter/Space
                main.selectButton(main.selectedButton);
            else if (
                e.keyCode == 27 &&
                main.dom.levelChooseButtons.style.display == 'block'
            ) {
                // ESC
                core.showStartAnimate(true);
                e.preventDefault();
            }
            e.stopPropagation();
            return;
        }
        if (main.dom.inputDiv.style.display == 'block') {
            if (e.keyCode == 13) {
                setTimeout(function () {
                    main.dom.inputYes.click();
                }, 50);
            } else if (e.keyCode == 27) {
                setTimeout(function () {
                    main.dom.inputNo.click();
                }, 50);
            }
            return;
        }
        if (
            core &&
            core.isPlaying &&
            core.status &&
            (core.isPlaying() || core.status.lockControl)
        )
            core.onkeyUp(e);
    }
});
document.addEventListener('keydown', e => {
    const assist = generateBinary([e.ctrlKey, e.shiftKey, e.altKey]);
    const code = keycode(e.keyCode);
    if (gameKey.emitKey(code, assist, 'down', e)) {
        e.preventDefault();
    }
});
