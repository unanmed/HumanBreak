
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
    | 'dragon.png'
    | 'hero.png'
    | 'winskin.png'

type AnimationIds =
    | 'amazed'
    | 'angry'
    | 'angry2'
    | 'bulb'
    | 'emm'
    | 'explosion1'
    | 'explosion2'
    | 'explosion3'
    | 'explosion4'
    | 'fire'
    | 'focus'
    | 'fret'
    | 'hand'
    | 'ice'
    | 'jianji'
    | 'luv'
    | 'magicAtk'
    | 'stone'
    | 'sweat'
    | 'sweat2'
    | 'sword'
    | 'zone'

type SoundIds =
    | '008-System08.opus'
    | '015-Jump01.opus'
    | '050-Explosion03.opus'
    | '051-Explosion04.opus'
    | '087-Action02.opus'
    | '094-Attack06.opus'
    | '118-Fire02.opus'
    | '119-Fire03.opus'
    | '120-Ice01.opus'
    | 'arrow.opus'
    | 'attack.opus'
    | 'bomb.opus'
    | 'cancel.opus'
    | 'centerFly.opus'
    | 'chapter.opus'
    | 'confirm.opus'
    | 'cursor.opus'
    | 'danger.opus'
    | 'door.opus'
    | 'drink.opus'
    | 'electron.opus'
    | 'equip.opus'
    | 'error.opus'
    | 'floor.opus'
    | 'gem.opus'
    | 'icePickaxe.opus'
    | 'item.opus'
    | 'jump.opus'
    | 'load.opus'
    | 'open_ui.opus'
    | 'paper.opus'
    | 'pickaxe.opus'
    | 'quake.opus'
    | 'recovery.opus'
    | 'save.opus'
    | 'shake.opus'
    | 'shop.opus'
    | 'thunder.opus'
    | 'tree.opus'
    | 'zone.opus'

type BgmIds =
    | 'beforeBoss.opus'
    | 'beforeNight.opus'
    | 'cave.opus'
    | 'chapter2ED.opus'
    | 'escape.opus'
    | 'escape2.opus'
    | 'grass.opus'
    | 'mount.opus'
    | 'night.opus'
    | 'palaceCenter.opus'
    | 'palaceNorth.opus'
    | 'palaceSouth.opus'
    | 'plot1.opus'
    | 'road.opus'
    | 'title.opus'
    | 'tower.opus'
    | 'towerBoss.opus'
    | 'towerBoss2.opus'
    | 'towerBoss3.opus'
    | 'winter.opus'
    | 'winterTown.opus'

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
