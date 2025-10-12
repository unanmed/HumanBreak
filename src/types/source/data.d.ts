
type FloorIds =
    | 'empty'
    | 'sample0'
    | 'sample1'
    | 'sample2'
    | 'MT0'

type ImageIds =
    | 'bear.png'
    | 'bg.jpg'
    | 'brave.png'
    | 'cloud.png'
    | 'dragon.png'
    | 'fog.png'
    | 'hero.png'
    | 'sun.png'
    | 'winskin.png'

type AnimationIds =
    | 'hand'
    | 'sword'
    | 'zone'

type SoundIds =
    | 'attack.opus'
    | 'bomb.opus'
    | 'cancel.opus'
    | 'centerFly.opus'
    | 'confirm.opus'
    | 'cursor.opus'
    | 'door.opus'
    | 'equip.opus'
    | 'error.opus'
    | 'floor.opus'
    | 'gem.opus'
    | 'icePickaxe.opus'
    | 'item.opus'
    | 'jump.opus'
    | 'load.opus'
    | 'open_ui.opus'
    | 'pickaxe.opus'
    | 'recovery.opus'
    | 'save.opus'
    | 'shop.opus'
    | 'zone.opus'

type BgmIds =
    | 'bgm.opus'

type FontIds = never

interface NameMap {
    '确定': 'confirm.opus';
    '取消': 'cancel.opus';
    '操作失败': 'error.opus';
    '光标移动': 'cursor.opus';
    '打开界面': 'open_ui.opus';
    '读档': 'load.opus';
    '存档': 'save.opus';
    '获得道具': 'item.opus';
    '回血': 'recovery.opus';
    '炸弹': 'bomb.opus';
    '飞行器': 'centerFly.opus';
    '开关门': 'door.opus';
    '上下楼': 'floor.opus';
    '跳跃': 'jump.opus';
    '破墙镐': 'pickaxe.opus';
    '破冰镐': 'icePickaxe.opus';
    '宝石': 'gem.opus';
    '阻激夹域': 'zone.opus';
    '穿脱装备': 'equip.opus';
    '背景音乐': 'bgm.opus';
    '攻击': 'attack.opus';
    '背景图': 'bg.jpg';
    '商店': 'shop.opus';
    '领域': 'zone';
}
