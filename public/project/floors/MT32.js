main.floors.MT32=
{
    "floorId": "MT32",
    "title": "冰封雪原",
    "name": "冰封雪原",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 8,
    "defaultGround": "T580",
    "bgm": "winter.mp3",
    "firstArrive": [
        {
            "type": "function",
            "function": "function(){\ncore.plugin.removeMap.removeMaps('MT17', 'MT21', true)\n}"
        }
    ],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "0,7": [
            {
                "type": "if",
                "condition": "(flag:inWinter2===true)",
                "true": [
                    "\t[低级智人]\b[up,hero]没必要回去了"
                ],
                "false": [
                    {
                        "type": "changeFloor",
                        "floorId": "MT31",
                        "loc": [
                            14,
                            7
                        ]
                    }
                ]
            }
        ],
        "1,6": [
            "宝石血瓶的加成已提升至8倍"
        ],
        "1,8": [
            "衣服是个装备，记得穿上",
            "光环会在地图上显示，如果不想要可以在背包里面的系统设置里面关闭",
            "注意打过永夜怪或者极昼怪之后或者有光环的时候，怪物标记可能与当前地图不符，因为标记怪物是标记的某一类怪物而不是某一点的怪物",
            "怪物手册显示的怪物是不经过光环加成的怪物，而定点查看则是经过各种加成的怪物。你可以将鼠标移动到怪物上，按下e或c使用定点查看功能"
        ]
    },
    "changeFloor": {
        "14,6": {
            "floorId": "MT33",
            "loc": [
                0,
                6
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
    [147,147,147,147,147,147,147,147,147,147,147,147,147,147,147],
    [147,  0,482,441,274,  0, 28,147, 34,  0,603,  0,  0,  0,147],
    [147,595,147,147,147, 32,  0,590,  0, 34,587,  0,147,147,147],
    [147,  0,403,  0,147,602,587,586,587,587,587, 21,147,381,147],
    [147, 28, 33, 27,492, 34, 34,586, 34,390,588,  0,592, 34,147],
    [147,147,494,147,147,585,492,585,595,588,588,590,147,492,147],
    [147,129,  0, 21,147, 32,  0,602,  0,586,  0,  0, 34,  0, 94],
    [ 92,  0,589,  0,492,  0, 32,584, 27,590,  0,587,  0, 28,147],
    [147,129,  0, 22,147,590,492,584, 29,586,587,587,492,147,147],
    [147,147,494,147,147,  0,  0,603,  0,586,  0, 32, 32,  0,147],
    [147, 27, 33, 28,147,147,147,147,494,585,585,585,584,602,147],
    [147,  0,403,  0,492, 34, 34,147,  0,  0,381,381,  0,  0,147],
    [147,595,147,147,147,603,147,147,147,147,274,147,147,590,147],
    [147,  0, 21, 27,  0,  0,  0,  0, 28, 33,  0,492,  0,  0,147],
    [147,147,147,147,147,147,147,147,147,147,147,147,147,147,147]
],
    "bgmap": [
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,145,145,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,145,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,145,  0,145,145,145,145,145],
    [145,145,145,145,145,145,145,145,145,145,145,  0,145,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,145,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,145,145,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,145,  0],
    [  0,145,  0,  0,  0,  0,  0,  0,  0,  0,145,145,145,145,  0],
    [  0,145,  0,  0,  0,  0,  0,  0,  0,  0,145,  0,  0,  0,  0],
    [  0,145,145,145,145,145,145,145,145,145,145,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
],
    "fgmap": [

],
    "bg2map": [
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,146,146,146,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,146,146,146,  0,  0,  0,  0,146,146,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,146,146,146,  0,  0,  0,582,  0,  0,  0,  0,146,146,  0],
    [  0,146,146,146,  0,  0,  0,  0,  0,  0,  0,  0,146,146,  0],
    [  0,146,146,146,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,581,581,582,  0,  0,  0,  0,  0,  0,  0],
    [  0,146,146,146,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,146,146,146,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
],
    "fg2map": [

]
}