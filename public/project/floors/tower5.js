main.floors.tower5=
{
    "floorId": "tower5",
    "title": "智慧之塔",
    "name": "5",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 2,
    "defaultGround": "T526",
    "bgm": "tower.mp3",
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "8,5": [
            "这里是漏怪检测，会检测\r[gold]智慧之塔\r[]区域是否有遗漏怪物",
            {
                "type": "function",
                "function": "function(){\nconst enemy = core.plugin.remainEnemy.getRemainEnemyString([\"tower1\", \"tower2\", \"tower3\", \"tower4\", \"tower5\", \"tower6\"]);\nif (enemy.length === 0) {\n\tcore.insertAction(['当前无剩余怪物！', { \"type\": \"hide\", \"remove\": true }, ]);\n} else {\n\tcore.insertAction(enemy);\n}\n}"
            }
        ]
    },
    "afterBattle": {},
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {},
    "cannotMove": {},
    "map": [
    [527,527,527,527,527,527,527,527,527,527,527,527,527,527,527],
    [527,376,  0,381,528,  0,378,528,  0, 27, 28,  0,528,  0,527],
    [527,  0, 32,279,  0,381,  0,546,  0,528,  0, 32,547,  0,527],
    [527,528,528,  0,528,528,492,528,527,528,492,528,528, 28,527],
    [527,  0,492,381,528,  0,376,527, 87,527,376, 32,528, 27,527],
    [527,376,528, 27,556, 32,  0,528,516,528, 32,378,492, 32,527],
    [527, 32,556, 28,528,550,528,528,  0,528,528,279,528,528,527],
    [527,  0,528, 32,528,  0,  0,  0,  0,536,  0, 27, 32,  0,542],
    [527,492,528,528,528,528,547,528,528,528,556,528,556,528,527],
    [527, 27,  0,528,  0,  0,  0,550,  0, 27,  0,492,441, 32,527],
    [527,  0, 32,492,  0, 28,  0,528,528,528,544,528,528,528,527],
    [527,528,547,528,546,528,492,528,  0, 28,  0,  0,546,  0,527],
    [527,  0, 32,536,  0, 28,  0,528,550,528,528,528,  0,528,527],
    [527, 27,  0,528, 32,  0,  0,492, 27,  0, 88,  0, 28,  0,527],
    [527,527,527,527,527,527,527,527,527,527,527,527,527,527,527]
],
    "beforeBattle": {},
    "bgmap": [

],
    "fgmap": [

],
    "bg2map": [

],
    "fg2map": [

],
    "cannotMoveIn": {},
    "changeFloor": {
        "10,13": {
            "floorId": "tower4",
            "loc": [
                10,
                13
            ]
        },
        "14,7": {
            "floorId": "tower6",
            "loc": [
                24,
                2
            ]
        },
        "8,4": {
            "floorId": "tower7",
            "loc": [
                7,
                7
            ]
        }
    }
}