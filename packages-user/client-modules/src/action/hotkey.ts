import { KeyCode } from '@motajs/client-base';
import { gameKey, HotkeyJSON } from '@motajs/system-action';
import { GameStorage } from '@motajs/legacy-system';

export const mainScope = Symbol.for('@key_main');

// todo: 读取上一个手动存档，存档至下一个存档栏
// ----- Register
gameKey
    //#region 游戏按键
    .group('game', '游戏按键')
    .register({
        id: 'moveUp',
        name: '上移',
        defaults: KeyCode.UpArrow
    })
    .register({
        id: 'moveDown',
        name: '下移',
        defaults: KeyCode.DownArrow
    })
    .register({
        id: 'moveLeft',
        name: '左移',
        defaults: KeyCode.LeftArrow
    })
    .register({
        id: 'moveRight',
        name: '右移',
        defaults: KeyCode.RightArrow
    })
    //#region ui界面
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
    //#region 功能按键
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
    //#region 系统按键
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
    //#region 通用按键
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
    //#region 开始界面
    .group('@ui_start', '开始界面')
    .register({
        id: '@start_up',
        name: '上移光标',
        defaults: KeyCode.UpArrow
    })
    .register({
        id: '@start_down',
        name: '下移光标',
        defaults: KeyCode.DownArrow
    })
    //#region 怪物手册
    .group('@ui_book', '怪物手册')
    .register({
        id: '@book_up',
        name: '上移光标',
        defaults: KeyCode.UpArrow
    })
    .register({
        id: '@book_down',
        name: '下移光标',
        defaults: KeyCode.DownArrow
    })
    .register({
        id: '@book_pageDown_1',
        name: '下移5个怪物_1',
        defaults: KeyCode.RightArrow
    })
    .register({
        id: '@book_pageDown_2',
        name: '下移5个怪物_2',
        defaults: KeyCode.PageDown
    })
    .register({
        id: '@book_pageUp_1',
        name: '上移5个怪物_1',
        defaults: KeyCode.LeftArrow
    })
    .register({
        id: '@book_pageUp_2',
        name: '上移5个怪物_2',
        defaults: KeyCode.PageUp
    })
    //#region 道具栏
    .group('@ui_toolbox', '道具栏')
    .register({
        id: '@toolbox_right',
        name: '光标右移',
        defaults: KeyCode.RightArrow
    })
    .register({
        id: '@toolbox_left',
        name: '光标左移',
        defaults: KeyCode.LeftArrow
    })
    .register({
        id: '@toolbox_up',
        name: '光标上移',
        defaults: KeyCode.UpArrow
    })
    .register({
        id: '@toolbox_down',
        name: '光标下移',
        defaults: KeyCode.DownArrow
    })
    //#region 商店
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
        defaults: KeyCode.RightArrow
    })
    .register({
        id: '@shop_min',
        name: '减少购买量',
        defaults: KeyCode.LeftArrow
    })
    //#region 楼层传送
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
    //#region 传统楼传
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
    })
    // #region 存档界面
    .group('@ui_save', '存档界面')
    .register({
        id: '@save_pageUp',
        name: '向后翻页',
        defaults: KeyCode.PageUp
    })
    .register({
        id: '@save_pageDown',
        name: '向前翻页',
        defaults: KeyCode.PageDown
    })
    .register({
        id: '@save_up',
        name: '选择框向上',
        defaults: KeyCode.UpArrow
    })
    .register({
        id: '@save_down',
        name: '选择框向下',
        defaults: KeyCode.DownArrow
    })
    .register({
        id: '@save_left',
        name: '选择框向左',
        defaults: KeyCode.LeftArrow
    })
    .register({
        id: '@save_right',
        name: '选择框向右',
        defaults: KeyCode.RightArrow
    })
    //#region 浏览地图
    .group('@ui_viewMap', '浏览地图')
    .register({
        id: '@viewMap_up_1',
        name: '下一层地图_1',
        defaults: KeyCode.UpArrow
    })
    .register({
        id: '@viewMap_up_2',
        name: '下一层地图_2',
        defaults: KeyCode.PageUp
    })
    .register({
        id: '@viewMap_down_1',
        name: '上一层地图_1',
        defaults: KeyCode.DownArrow
    })
    .register({
        id: '@viewMap_down_2',
        name: '上一层地图_2',
        defaults: KeyCode.PageDown
    })
    .register({
        id: '@viewMap_up_ten',
        name: '下十层地图',
        defaults: KeyCode.UpArrow,
        ctrl: true
    })
    .register({
        id: '@viewMap_down_ten',
        name: '上十层地图',
        defaults: KeyCode.DownArrow,
        ctrl: true
    })
    .register({
        id: '@viewMap_book',
        name: '怪物手册',
        defaults: KeyCode.KeyX
    })
    .register({
        id: '@viewMap_fly',
        name: '传送至',
        defaults: KeyCode.KeyG
    })
    .register({
        id: '@viewMap_reset',
        name: '重置视角',
        defaults: KeyCode.KeyR
    });
// #endregion

gameKey.enable();
gameKey.use(mainScope);

//#region 按键实现

gameKey
    .when(
        () =>
            !core.status.lockControl && !core.isMoving() && !core.isReplaying()
    )
    .realize('book', () => {
        core.openBook(true);
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
    .realize('shop', () => {
        core.openQuickShop(true);
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
    .realize('restart', () => {
        core.confirmRestart();
    })
    .realize('comment', () => {
        core.actions._clickGameInfo_openComments();
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
