main.floors.MT50=
{
    "floorId": "MT50",
    "title": "苍蓝之殿-中",
    "name": "50",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 8,
    "defaultGround": "T650",
    "bgm": "palaceSouth.mp3",
    "firstArrive": [
        {
            "type": "openDoor",
            "loc": [
                2,
                7
            ]
        }
    ],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "7,14": [
            {
                "type": "changeFloor",
                "floorId": "MT49",
                "loc": [
                    7,
                    10
                ]
            }
        ],
        "5,13": [
            "欢迎来到苍蓝之殿，这是本塔第二章里面最大的一个区，也是最复杂的一个区。整个苍蓝之殿分为无个部分：左下角、右下角、左上角、右上角和中心，每个部分都有不一样的玩法，多多动脑哦。",
            "在你刚进入苍蓝之殿时，你只能先前往左下角部分（本地图的左面），右下角暂时不能前往。注意往上走往左依然可以进入左下角，不要只盯着这个地图的左边不放。",
            "本区域极大，建议打开小地图游玩。如果打开小地图后打怪出现卡顿，可以尝试在 设置->ui设置 里面打开小地图懒更新设置",
            "此区域建议多多使用定点查看功能，鼠标移动到怪物上按C或E即可打开（如果你没有设置自己的快捷键的话）。手机端暂时无法定点查看",
            "打完左下角和右下角的boss之后，开四个机关门",
            "注意不要忘记购买装备，到了下一章之后本章的商店将不能到达，不过快捷商店还会保留。这些装备在下一章都会有向上合成",
            "本区域可以使用跳跃技能，不要忘记了。",
            "注意火炬可通行，而且跳跃时会跳过火炬，不会跳到火炬上。",
            "三章及以后还会有魔攻怪，因此魔法防御技能的长期收益会较大",
            "本区请至少留下一个红钥匙"
        ]
    },
    "changeFloor": {
        "0,7": {
            "floorId": "MT51",
            "loc": [
                14,
                7
            ]
        },
        "7,0": {
            "floorId": "MT60",
            "loc": [
                7,
                14
            ]
        },
        "14,7": {
            "floorId": "MT62",
            "loc": [
                0,
                7
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {},
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {},
    "cannotMove": {},
    "cannotMoveIn": {},
    "map": [
    [648,648,648,648,648,648,648, 91,648,648,648,648,648,648,648],
    [648, 27,  0, 28,  0,648,  0,  0,  0,648,  0, 28,  0, 27,648],
    [648,  0,381,  0,482,648,  0,  0,  0,648,482,  0,381,  0,648],
    [648, 28,  0, 27,  0,648,  0,  0,  0,648,  0, 27,  0, 28,648],
    [648,  0,482,  0,103,648,  0,  0,  0,648,103,  0,482,  0,648],
    [648, 85,648,648,648,648,  0,  0,  0,648,648,648,648, 85,648],
    [648,  0,648,  0,  0,  0,484,  0,484,  0,  0,  0,648,  0,648],
    [ 92,  0, 85,  0,  0,  0,  0, 23,  0,  0,  0,  0, 85,  0, 94],
    [648,  0,648,  0,  0,  0,484,  0,484,  0,  0,  0,648,  0,648],
    [648, 85,648,648,648,648,  0,  0,  0,648,648,648,648, 85,648],
    [648,  0,482,  0,103,648,  0,  0,  0,648,103,  0,482,  0,648],
    [648, 28,  0, 27,  0,648,  0,  0,  0,648,  0, 27,  0, 28,648],
    [648,  0,381,  0,482,648,  0,  0,  0,648,482,  0,381,  0,648],
    [648, 27,  0, 28,  0,129, 92,  0,  0,648,  0, 28,  0, 27,648],
    [648,648,648,648,648,648,648, 93,648,648,648,648,648,648,648]
],
    "bgmap": [
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,50403,50404,50405,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,50411,50412,50413,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,50419,50420,50421,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
],
    "fgmap": [

],
    "bg2map": [

],
    "fg2map": [

]
}