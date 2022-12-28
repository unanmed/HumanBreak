
type FloorIds =
    | 'MT0'
    | 'MT1'
    | 'MT2'
    | 'MT3'
    | 'MT4'
    | 'MT5'
    | 'MT6'
    | 'MT7'
    | 'MT8'
    | 'MT9'
    | 'MT10'
    | 'MT11'
    | 'MT12'
    | 'MT13'
    | 'MT14'
    | 'MT15'
    | 'MT16'
    | 'MT17'
    | 'MT18'
    | 'MT19'
    | 'MT20'
    | 'MT21'
    | 'tower1'
    | 'tower2'
    | 'tower3'
    | 'tower4'
    | 'tower5'
    | 'tower6'
    | 'tower7'

type ImageIds =
    | 'IQ.png'
    | 'arrow.png'
    | 'atk.png'
    | 'beforeBoss.jpg'
    | 'bg.jpg'
    | 'boom.png'
    | 'botton.png'
    | 'cave.jpg'
    | 'cave1.jpg'
    | 'cave2.jpg'
    | 'def.png'
    | 'escape.jpg'
    | 'exp.png'
    | 'grass.jpg'
    | 'hero1.png'
    | 'hero2.png'
    | 'hp.png'
    | 'money.png'
    | 'mount.jpg'
    | 'plot1.jpg'
    | 'skill.png'
    | 'skill0.png'
    | 'skill1.png'
    | 'skill2.png'
    | 'skill3.png'
    | 'skill4.png'
    | 'skill5.png'
    | 'skill6.png'
    | 'skill7.png'
    | 'title.jpg'
    | 'tower.jpg'
    | 'tower6.jpeg'
    | 'tower7.jpeg'
    | 'towerBoss.jpg'
    | 'towerBoss2.jpg'
    | 'towerBoss3.jpg'
    | 'winskin.png'
    | 'winskin2.png'
    | 'winskin3.png'

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
    | '008-System08.ogg'
    | '015-Jump01.ogg'
    | '050-Explosion03.ogg'
    | '051-Explosion04.ogg'
    | '087-Action02.ogg'
    | '094-Attack06.ogg'
    | '118-Fire02.ogg'
    | '119-Fire03.ogg'
    | '120-Ice01.ogg'
    | 'arrow.mp3'
    | 'attack.mp3'
    | 'bomb.mp3'
    | 'cancel.mp3'
    | 'centerFly.mp3'
    | 'chapter.mp3'
    | 'confirm.mp3'
    | 'cursor.mp3'
    | 'danger.mp3'
    | 'door.mp3'
    | 'electron.mp3'
    | 'equip.mp3'
    | 'error.mp3'
    | 'floor.mp3'
    | 'item.mp3'
    | 'jump.mp3'
    | 'load.mp3'
    | 'open_ui.mp3'
    | 'paper.mp3'
    | 'pickaxe.mp3'
    | 'quake.mp3'
    | 'recovery.mp3'
    | 'save.mp3'
    | 'shake.mp3'
    | 'shop.mp3'
    | 'thunder.mp3'
    | 'tree.mp3'
    | 'zone.mp3'

type BgmIds =
    | 'beforeBoss.mp3'
    | 'cave.mp3'
    | 'escape.mp3'
    | 'grass.mp3'
    | 'mount.mp3'
    | 'plot1.mp3'
    | 'title.mp3'
    | 'tower.mp3'
    | 'towerBoss.mp3'
    | 'towerBoss2.mp3'
    | 'towerBoss3.mp3'

type FontIds =
    | 'normal'
    | 'scroll'

interface NameMap {
    '确定': 'confirm.mp3';
    '取消': 'cancel.mp3';
    '操作失败': 'error.mp3';
    '光标移动': 'cursor.mp3';
    '打开界面': 'open_ui.mp3';
    '读档': 'load.mp3';
    '存档': 'save.mp3';
    '获得道具': 'item.mp3';
    '回血': 'recovery.mp3';
    '炸弹': 'bomb.mp3';
    '飞行器': 'centerFly.mp3';
    '开关门': 'door.mp3';
    '上下楼': 'floor.mp3';
    '跳跃': 'jump.mp3';
    '破墙镐': 'pickaxe.mp3';
    '破冰镐': 'icePickaxe.mp3';
    '宝石': 'gem.mp3';
    '阻激夹域': 'zone.mp3';
    '穿脱装备': 'equip.mp3';
    '背景音乐': 'bgm.mp3';
    '攻击': 'attack.mp3';
    '背景图': 'bg.jpg';
    '商店': 'shop.mp3';
    '领域': 'zone';
}