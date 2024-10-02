main.floors.MT52=
{
    "floorId": "MT52",
    "title": "苍蓝之殿-左下",
    "name": "52",
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
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "11,7": [
            {
                "type": "setText",
                "position": "down"
            },
            "“若人心简单，则正义亦易”——柏拉图",
            "可是，人心哪能是简单的？",
            "那些贪婪的统治者，用他们所谓的民主，用那所谓的公平创造了一个个压迫人民的国度。",
            "用自己的肮脏意志，制定了一项项的法律，并冠以正义之名，让每个人都去遵守他们的“正义”。",
            "这就是他们所谓的民主。",
            "或许是我的想法太过激进了吧，毕竟那些国家也存在了几百年的时间，他们的“正义”或许也没有那么邪恶。",
            {
                "type": "sleep",
                "time": 300
            },
            "——熵增。",
            "在阅读这片石碑的那位智人应该不知道这个东西吧。",
            "在没有外界能量输入的情况下，一个系统的总熵不会减少。这意味着一个封闭系统必然走向混乱。",
            "虽然这只是一个物理规律，但是又未尝不能去描述这个世界呢？",
            "那些统治者所做的事，只不过是在增加这片大地的“熵”罢了。",
            "江山易改，本性难移。",
            "果不其然，战争爆发了...",
            "那时，我的内心很平静。虽然我只是个物理学家，但对哲学也略有涉猎，我知道他们那些国家早晚会发动战争。",
            "但是，我的内心却有前所未有的恐惧。",
            "我本以为这次战争只不过是一些打打闹闹，根本不成气候。",
            "但是我错了。"
        ]
    },
    "changeFloor": {
        "14,8": {
            "floorId": "MT51",
            "loc": [
                0,
                8
            ]
        },
        "4,0": {
            "floorId": "MT54",
            "loc": [
                4,
                14
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {
        "12,1": [
            {
                "type": "setValue",
                "name": "flag:door_MT52_11_2",
                "operator": "+=",
                "value": "1"
            }
        ],
        "12,3": [
            {
                "type": "setValue",
                "name": "flag:door_MT52_11_2",
                "operator": "+=",
                "value": "1"
            }
        ],
        "9,1": [
            {
                "type": "setValue",
                "name": "flag:door_MT52_8_2",
                "operator": "+=",
                "value": "1"
            }
        ],
        "9,3": [
            {
                "type": "setValue",
                "name": "flag:door_MT52_8_2",
                "operator": "+=",
                "value": "1"
            }
        ]
    },
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {
        "11,2": {
            "0": {
                "condition": "flag:door_MT52_11_2==2",
                "currentFloor": true,
                "priority": 0,
                "delayExecute": false,
                "multiExecute": false,
                "data": [
                    {
                        "type": "openDoor"
                    },
                    {
                        "type": "setValue",
                        "name": "flag:door_MT52_11_2",
                        "operator": "=",
                        "value": "null"
                    }
                ]
            }
        },
        "8,2": {
            "0": {
                "condition": "flag:door_MT52_8_2==2",
                "currentFloor": true,
                "priority": 0,
                "delayExecute": false,
                "multiExecute": false,
                "data": [
                    {
                        "type": "openDoor"
                    },
                    {
                        "type": "setValue",
                        "name": "flag:door_MT52_8_2",
                        "operator": "=",
                        "value": "null"
                    }
                ]
            }
        }
    },
    "cannotMove": {},
    "cannotMoveIn": {},
    "map": [
    [648,648,648,648, 91,648,648,648,648,648,648,648,648,648,648],
    [648, 27,  0,648,  0,648,376,491,648,249,376,648,578,  0,648],
    [648,  0,484,648,243,497, 22,403, 85,403,491, 85,  0,484,648],
    [648, 28,  0,220,  0,648,378,491,648,249,378,648,578,  0,648],
    [648,648,648,648,  0,648,648,648,648,648,648,648,648,  0,648],
    [648, 33,  0,648,482,648, 29,  0,648,381,  0,648,378,  0,648],
    [648,  0,381,492,  0,648,  0, 27,539,  0,482,596,  0,103,648],
    [648, 33,  0,648,  0,648,648,219,648,648,648,706,648,648,648],
    [648,596,648,648,656,  0,  0,  0,  0,482,  0,  0,  0,  0, 94],
    [648,376,  0,648,648,648,648,494,648,648,648,648,497,648,648],
    [648,482,381,492,482,539, 33,  0, 28,494,376,381, 22,396,648],
    [648,601,648,648,648,648,648,243,648,648,648,240,648,648,648],
    [648,491,  0,648,484,  0,648,  0, 29, 27,648,491,396,491,648],
    [648,103,376,596,  0, 33,220,  0,484, 28,249,403, 21,390,648],
    [648,648,648,648,648,648,648,648,648,648,648,648,648,648,648]
],
    "bgmap": [
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,648,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
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