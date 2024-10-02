main.floors.MT94=
{
    "floorId": "MT94",
    "title": "苍蓝之殿-核心",
    "name": "94",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 8,
    "defaultGround": "T650",
    "bgm": "palaceNorth.mp3",
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "7,2": [
            "这里是漏怪检测，会检测\r[gold]第二章所有\r[]区域是否有遗漏怪物",
            {
                "type": "function",
                "function": "function(){\nconst enemy = Mota.Plugin.require('remainEnemy_g').getRemainEnemyString(core.floorIds.slice(40, 107));\nif (enemy.length === 0) {\n\tcore.insertAction(['当前无剩余怪物！', { \"type\": \"hide\", \"remove\": true }, ]);\n} else {\n\tcore.insertAction(enemy);\n}\n}"
            }
        ],
        "2,5": [
            {
                "type": "function",
                "async": true,
                "function": "function(){\nMota.require('module', 'Mechanism').BluePalace.doorConvert(2, 5);\n}"
            }
        ]
    },
    "changeFloor": {
        "7,7": {
            "floorId": "MT72",
            "loc": [
                7,
                7
            ]
        },
        "14,7": {
            "floorId": "MT95",
            "loc": [
                0,
                7
            ]
        },
        "7,14": {
            "floorId": "MT96",
            "loc": [
                7,
                0
            ]
        },
        "0,7": {
            "floorId": "MT97",
            "loc": [
                14,
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
    [648,  0,378,484,376,648, 34, 34, 34,648,381,491,675,  0,648],
    [648,669,648,648,648,648,648,516,648,648,378,376,648,  0,648],
    [648,  0,482,671,  0,691,  0,381,  0,648,648,648,648,700,648],
    [648,494,648,648,378,648,376,  0,482,677,484,  0,492,  0,648],
    [648,484,660,648,482,648,648,618,648,648,  0,381,648,  0,648],
    [648,699,648,648,494,648,484,  0,484,648,644,648,648,491,648],
    [ 92,  0,482,376,  0,671,103, 87,103,671,484,378,669,  0, 94],
    [648,699,648,648,492,648,484,  0,484,648,618,648,648,648,648],
    [648,376,  0,484,  0,648,648,494,648,648,482,  0,677,  0,648],
    [648,492,648,648,599,648,  0,  0,482,648,648,648,648,484,648],
    [648,  0,482,  0,378,648,671,648,  0,675,484,381,648,  0,648],
    [648,671,648,648,492,648,  0,648,648,648,492,648,648,675,648],
    [648,381,  0,482,  0,644,381,  0,484,648,376,491,378,  0,648],
    [648,648,648,648,648,648,648, 93,648,648,648,648,648,648,648]
],
    "bgmap": [

],
    "fgmap": [

],
    "bg2map": [

],
    "fg2map": [

]
}