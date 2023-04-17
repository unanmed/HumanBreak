
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

type ImageIds =
    | 'IQ.png'
    | 'arrow.png'
    | 'atk.png'
    | 'bg.jpg'
    | 'boom.png'
    | 'botton.png'
    | 'cave2.jpg'
    | 'def.png'
    | 'exp.png'
    | 'hero1.png'
    | 'hero2.png'
    | 'hp.png'
    | 'money.png'
    | 'skill.png'
    | 'skill0.png'
    | 'skill1.png'
    | 'skill10.png'
    | 'skill11.png'
    | 'skill12.png'
    | 'skill13.png'
    | 'skill14.png'
    | 'skill2.png'
    | 'skill3.png'
    | 'skill4.png'
    | 'skill5.png'
    | 'skill6.png'
    | 'skill7.png'
    | 'skill8.png'
    | 'skill9.png'
    | 'title.jpg'
    | 'tower.jpg'
    | 'tower7.jpeg'
    | 'winskin.png'
    | 'winskin2.png'
    | 'winskin3.png'

type AnimationIds = never

type SoundIds =
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
    | 'drink.mp3'
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

type BgmIds = never

type FontIds =
    | 'normal'

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
