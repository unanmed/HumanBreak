main.floors.MT94=
{
    "floorId": "MT94",
    "title": "苍蓝之殿-中",
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
        ]
    },
    "changeFloor": {
        "7,7": {
            "floorId": "MT72",
            "loc": [
                7,
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
    [648,  0,  0,  0,  0,648,466,468,467,648,  0,  0,  0,  0,648],
    [648,  0,648,648,648,648,648,516,648,648,  0,  0,648,  0,648],
    [648,  0,  0,  0,  0,  0,  0,  0,  0,648,648,648,648,  0,648],
    [648,648,648,648,  0,648,  0,  0,  0,  0,  0,  0,648,  0,648],
    [648,  0,  0,648,  0,648,648,  0,648,648,  0,  0,648,  0,648],
    [648,  0,648,648,  0,648,487,  0,487,648,  0,648,648,  0,648],
    [ 92,  0,  0,  0,  0,  0,  0, 87,  0,  0,  0,  0,  0,  0, 94],
    [648,  0,648,648,648,648,487,  0,487,648,  0,648,648,648,648],
    [648,  0,  0,  0,  0,648,648,  0,648,648,  0,  0,  0,  0,648],
    [648,648,648,648,  0,648,  0,  0,  0,648,648,648,648,  0,648],
    [648,  0,  0,  0,  0,648,  0,648,  0,  0,  0,  0,648,  0,648],
    [648,  0,648,648,648,648,  0,648,648,648,  0,648,648,  0,648],
    [648,  0,  0,  0,  0,  0,  0,  0,  0,648,  0,  0,  0,  0,648],
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