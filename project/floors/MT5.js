main.floors.MT5=
{
    "floorId": "MT5",
    "title": "洞穴",
    "name": "5",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 1,
    "defaultGround": "T331",
    "bgm": "cave.mp3",
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "14,7": [
            {
                "type": "if",
                "condition": "(flag:cave==1)",
                "true": [
                    {
                        "type": "changeFloor",
                        "floorId": "MT6",
                        "loc": [
                            2,
                            4
                        ],
                        "direction": "down"
                    },
                    {
                        "type": "setGlobalValue",
                        "name": "animateSpeed",
                        "value": 270.2703
                    }
                ],
                "false": [
                    {
                        "type": "setCurtain",
                        "color": [
                            0,
                            0,
                            0,
                            1
                        ],
                        "time": 1500,
                        "keep": true
                    },
                    {
                        "type": "setText",
                        "text": [
                            0,
                            0,
                            0,
                            1
                        ],
                        "background": "winskin3.png",
                        "textfont": 20,
                        "time": 25
                    },
                    "人类简史——起源篇",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    "走出山洞，看似一个不起眼的举动，却是一个让残酷的真相永远地消失在了历史中的举动。",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    "但是，这个举动，也是人类至今都能与自然和谐共处的根本。",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    "那些残酷的历史将无人知晓，那些人类的残忍杀戮将不会出现。",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    "而这些源头便是这看似无足轻重的一个举动。",
                    {
                        "type": "setText",
                        "text": [
                            255,
                            255,
                            255,
                            1
                        ],
                        "background": "winskin2.png",
                        "textfont": 20,
                        "time": 25
                    },
                    {
                        "type": "changeFloor",
                        "floorId": "MT6",
                        "loc": [
                            2,
                            4
                        ],
                        "direction": "down"
                    },
                    {
                        "type": "setValue",
                        "name": "flag:cave",
                        "value": "1"
                    },
                    {
                        "type": "setGlobalValue",
                        "name": "animateSpeed",
                        "value": 270.2703
                    }
                ]
            }
        ],
        "13,7": [
            "这里是漏怪检测，会检测\r[gold]山洞\r[]区域的怪物是否清空",
            {
                "type": "function",
                "function": "function(){\nconst enemy = core.plugin.remainEnemy.getRemainEnemyString(core.floorIds.slice(0, 5));\nif (enemy.length === 0) {\n\tcore.insertAction(['当前无剩余怪物！', { \"type\": \"hide\", \"remove\": true }, ]);\n} else {\n\tcore.insertAction(enemy);\n}\n}"
            }
        ]
    },
    "changeFloor": {
        "0,7": {
            "floorId": "MT3",
            "loc": [
                14,
                7
            ]
        }
    },
    "afterBattle": {},
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {},
    "cannotMove": {},
    "map": [
    [20044,20049,20049,20049,20049,20049,20049,20049,20049,20049,20049,20049,20049,20049,20043],
    [20042,20057,20057,20057,20057,20057,20057,20057,20057,20057,20057,20057,20057,20057,20040],
    [20042,20065,20065,20065,20065,20065,20065,20065,20065,20065,20065,20065,20065,20065,20040],
    [20042, 32, 27,  0,141, 32,  0, 27,  0, 32,141,  0, 27, 32,20040],
    [20050,141,141,213,141,141,141,213,141,141,141,213,141,141,20048],
    [20058, 32, 28,  0,141, 32,  0, 28,  0, 32,141,  0, 28, 32,20056],
    [20074,141,141,216,141,141,141,216,141,141,141,216,141,141,20064],
    [ 92,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,516, 94],
    [20034,336,336,216,336,336,336,216,336,336,336,216,336,336,20032],
    [20042, 31, 32, 31,336,  0,203,  0,203,  0,336, 31, 32, 31,20040],
    [20042,  0, 28,  0,336, 31,336, 31,336, 31,336,  0, 28,  0,20040],
    [20042,215,336,336,336,336,336,215,336,336,336,336,336,215,20040],
    [20042,  0, 32,  0,336, 31,336, 31,336, 31,336,  0, 32,  0,20040],
    [20042,  0, 27,  0,336,  0,203,  0,203,  0,336,  0, 27,  0,20040],
    [20036,20033,20033,20033,20033,20033,20033,20033,20033,20033,20033,20033,20033,20033,20035]
],
    "bgmap": [

],
    "fgmap": [

],
    "beforeBattle": {},
    "cannotMoveIn": {},
    "bg2map": [

],
    "fg2map": [

]
}