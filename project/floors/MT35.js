main.floors.MT35=
{
    "floorId": "MT35",
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
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "10,1": {
            "trigger": "action",
            "enable": true,
            "noPass": null,
            "displayDamage": true,
            "opacity": 1,
            "filter": {
                "blur": 0,
                "hue": 0,
                "grayscale": 0,
                "invert": false,
                "shadow": 0
            },
            "data": [
                "你来这干什么",
                {
                    "type": "if",
                    "condition": "(core.getBlockId(10,1)!=='none')",
                    "true": [
                        "把怪踢到这了，想打？",
                        "没门！",
                        "你别想过漏怪检测了，啊哈哈哈哈！"
                    ]
                }
            ]
        },
        "4,1": {
            "trigger": "action",
            "enable": true,
            "noPass": null,
            "displayDamage": true,
            "opacity": 1,
            "filter": {
                "blur": 0,
                "hue": 0,
                "grayscale": 0,
                "invert": false,
                "shadow": 0
            },
            "data": [
                "你来这干什么",
                {
                    "type": "if",
                    "condition": "(core.getBlockId(4,1)!=='none')",
                    "true": [
                        "把怪踢到这了，想打？",
                        "没门！",
                        "你别想过漏怪检测了，啊哈哈哈哈！"
                    ]
                }
            ]
        },
        "6,13": [
            "前方漏怪检测会检测智慧小径的怪物是否清完，之后不可返回智慧小径"
        ],
        "7,1": [
            "这里是漏怪检测，会检测\r[gold]智慧小径\r[]区域是否有遗漏怪物",
            {
                "type": "function",
                "function": "function(){\nconst enemy = core.getRemainEnemyString(core.floorIds.slice(30, 40));\nif (enemy.length === 0) {\n\tcore.insertAction(['当前无剩余怪物！', { \"type\": \"hide\", \"remove\": true }, ]);\n} else {\n\tcore.insertAction(enemy);\n}\n}"
            }
        ],
        "7,0": [
            {
                "type": "if",
                "condition": "(flag:inWinter2===true)",
                "true": [
                    {
                        "type": "changeFloor",
                        "floorId": "MT36",
                        "loc": [
                            7,
                            14
                        ]
                    }
                ],
                "false": [
                    {
                        "type": "setValue",
                        "name": "flag:inWinter2",
                        "value": "true"
                    },
                    {
                        "type": "function",
                        "function": "function(){\ncore.removeMaps('MT22', 'MT31', true);\n}"
                    },
                    {
                        "type": "changeFloor",
                        "floorId": "MT36",
                        "loc": [
                            7,
                            14
                        ]
                    }
                ]
            }
        ]
    },
    "changeFloor": {
        "7,14": {
            "floorId": "MT33",
            "loc": [
                9,
                0
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {
        "7,9": [
            {
                "type": "setValue",
                "name": "flag:door_MT35_3_9",
                "operator": "+=",
                "value": "1"
            },
            {
                "type": "setValue",
                "name": "flag:door_MT35_11_9",
                "operator": "+=",
                "value": "1"
            }
        ]
    },
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {
        "3,9": {
            "0": {
                "condition": "flag:door_MT35_3_9==1",
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
                        "name": "flag:door_MT35_3_9",
                        "operator": "=",
                        "value": "null"
                    }
                ]
            },
            "1": null
        },
        "11,9": {
            "0": {
                "condition": "flag:door_MT35_11_9==1",
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
                        "name": "flag:door_MT35_11_9",
                        "value": "null"
                    }
                ]
            },
            "1": null
        }
    },
    "cannotMove": {},
    "cannotMoveIn": {},
    "map": [
    [585,585,585,585,585,585,585, 91,585,585,585,585,585,585,585],
    [  0,  0,  0,  0,  0,  0,585,516,585,  0,  0,  0,  0,  0,  0],
    [70064,70065,70065,70065,70065,70065,585,497,585,70065,70065,70065,70065,70065,70066],
    [70072,70073,70073,70073,70073,70073,  0,  0,  0,70073,70073,70073,70073,70073,70074],
    [70072,70073,70073,70073,70073,70073,  0,  0,  0,70073,70073,70073,70073,70073,70074],
    [70072,70073,70073,70073,70073,70073,  0,  0,  0,70073,70073,70073,70073,70073,70074],
    [70072,70073,70073,70073,70073,70073,  0,  0,  0,70073,70073,70073,70073,70073,70074],
    [70080,70081,70081,70081,70081,70081,  0,  0,  0,70081,70081,70081,70081,70081,70082],
    [147,147,147,147,147,147,  0,  0,  0,147,147,147,147,147,147],
    [147,381, 33, 85,592,147,147,595,147,147,592, 85, 33,381,147],
    [147, 34,376,  0,494, 34,492,  0,492, 34,494,  0,378, 34,147],
    [147,274,147,147,147,147,147,  0,147,147,147,147,147,274,147],
    [147, 33,147, 28,595, 34,603,  0,602, 34,590, 27,147, 33,147],
    [147, 28,603, 34,147, 28,129,  0,147, 27,147, 34,602, 27,147],
    [147,147,147,147,147,147,147, 93,147,147,147,147,147,147,147]
],
    "bgmap": [
    [70056,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,70058],
    [70056,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,70058],
    [70064,70054,70054,70054,70054,70054,70112,  0,70114,70054,70054,70054,70054,70054,70066],
    [  0,  0,  0,  0,  0,  0,70073,  0,70073,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,70073,  0,70073,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,70073,  0,70073,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,70073,  0,70073,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,70081,  0,70081,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,145,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,145,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,145,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,145,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,145,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,145,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,145,  0,  0,  0,  0,  0,  0,  0]
],
    "fgmap": [

],
    "bg2map": [
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,70112,70113,70114,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,70120,70121,70122,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,70120,70121,70122,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,70120,70121,70122,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,70120,70121,70122,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,70120,70121,70122,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,70128,70129,70130,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
],
    "fg2map": [

]
}