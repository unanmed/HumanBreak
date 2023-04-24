main.floors.tower7=
{
    "floorId": "tower7",
    "title": "智慧之塔",
    "name": "5",
    "width": 15,
    "height": 15,
    "canFlyTo": false,
    "canFlyFrom": false,
    "canUseQuickShop": true,
    "cannotViewMap": true,
    "images": [],
    "ratio": 2,
    "defaultGround": "T526",
    "bgm": "tower.mp3",
    "firstArrive": [
        {
            "type": "hideStatusBar",
            "toolbox": true
        },
        {
            "type": "loadBgm",
            "name": "beforeBoss.mp3"
        },
        {
            "type": "loadBgm",
            "name": "towerBoss.mp3"
        },
        {
            "type": "loadBgm",
            "name": "towerBoss2.mp3"
        },
        {
            "type": "loadBgm",
            "name": "towerBoss3.mp3"
        },
        {
            "type": "pauseBgm"
        },
        {
            "type": "sleep",
            "time": 1000,
            "noSkip": true
        },
        "\t[智慧之神,E557]\b[down,7,2]哟，又来了一位挑战者啊",
        "\t[智慧之神,E557]\b[down,7,2]曾经也有无数的挑战者来过这里",
        "\t[智慧之神,E557]\b[down,7,2]但是，他们的低下智慧，却让他们在我这里败下阵来",
        {
            "type": "playBgm",
            "name": "beforeBoss.mp3"
        },
        "\t[智慧之神,E557]\b[down,7,2]愚蠢的他们只会一头冲向我这",
        "\t[智慧之神,E557]\b[down,7,2]在我面前变成一滩肉泥",
        "\t[智慧之神,E557]\b[down,7,2]我不由得感叹，这里的人们都是如此野蛮之人吗",
        "\t[智慧之神,E557]\b[down,7,2]连年不断的战争让那里的人们变得生性暴戾",
        "\t[智慧之神,E557]\b[down,7,2]那里已经变成了人间炼狱",
        "\t[智慧之神,E557]\b[down,7,2]而唯一能够拯救那里的方法就是改变历史",
        "\t[智慧之神,E557]\b[down,7,2]但这可能吗？",
        "\t[智慧之神,E557]\b[down,7,2]人们陷入无尽的恐惧当中",
        "\t[智慧之神,E557]\b[down,7,2]只能眼睁睁地看着自己的爱人被杀",
        "\t[智慧之神,E557]\b[down,7,2]只能任凭刀刃穿过自己的心脏",
        "\t[智慧之神,E557]\b[down,7,2]只能让自己干过的那些卑劣的事不断增多",
        "\t[智慧之神,E557]\b[down,7,2]只能让那些曾经被人类欺凌、被人类践踏过的生物反击",
        "\t[智慧之神,E557]\b[down,7,2]人类的防线一夜溃败",
        "\t[智慧之神,E557]\b[down,7,2]而到了那时，他们才意识到了问题的严重性",
        "\t[智慧之神,E557]\b[down,7,2]可这一切不都晚了吗？",
        "\t[智慧之神,E557]\b[down,7,2]这就是未来的人所做的一切",
        "\t[智慧之神,E557]\b[down,7,2]只会野蛮地向大自然索求，却丝毫不回报自然",
        "\t[智慧之神,E557]\b[down,7,2]他们虽拥有智慧，却将智慧用在了掠夺上面",
        "\t[智慧之神,E557]\b[down,7,2]因此，人们建造出了这座高塔",
        "\t[智慧之神,E557]\b[down,7,2]用唯一的时空穿梭技术将这座高塔传送到了10000年前",
        "\t[智慧之神,E557]\b[down,7,2]企图用改变历史的方式来获得解脱",
        "\t[智慧之神,E557]\b[down,7,2]但他们会成功吗",
        "\t[智慧之神,E557]\b[down,7,2]哼，谁知道呢",
        "\t[智慧之神,E557]\b[down,7,2]现在，你应该知道这座塔的来源了吧？",
        {
            "type": "playBgm",
            "name": "towerBoss.mp3"
        },
        "\t[智慧之神,E557]\b[down,7,2]就让我来看一看你是不是能够改变历史的人吧！",
        {
            "type": "confirm",
            "text": "是否要跳过该特殊战",
            "yes": [
                {
                    "type": "setValue",
                    "name": "flag:boss1",
                    "value": "true"
                },
                {
                    "type": "changeFloor",
                    "floorId": "MT20",
                    "loc": [
                        7,
                        9
                    ]
                },
                {
                    "type": "openDoor",
                    "loc": [
                        13,
                        6
                    ],
                    "floorId": "MT19"
                },
                "现在前往东边",
                {
                    "type": "showStatusBar"
                },
                {
                    "type": "exit"
                }
            ],
            "no": [
                "屏幕上方有boss血条和提示等，请注意阅读",
                "注意：重新开始特殊战需要刷新页面！！！！！！！！！！！！",
                "下面，就让我们开始吧！",
                {
                    "type": "function",
                    "function": "function(){\ncore.plugin.replay.readyClip();\n}"
                }
            ]
        },
        {
            "type": "move",
            "loc": [
                7,
                2
            ],
            "time": 1000,
            "keep": true,
            "steps": [
                "up:1"
            ]
        },
        {
            "type": "hide",
            "loc": [
                [
                    7,
                    8
                ]
            ],
            "floorId": "MT20",
            "remove": true
        },
        {
            "type": "autoSave"
        },
        {
            "type": "forbidSave",
            "forbid": true
        },
        {
            "type": "function",
            "function": "function(){\ncore.drawWarning(7, 2, \"智慧之神\");\n}"
        },
        {
            "type": "sleep",
            "time": 3000,
            "noSkip": true
        },
        {
            "type": "function",
            "function": "function(){\ncore.plugin.towerBoss.initTowerBoss();\n}"
        }
    ],
    "eachArrive": [],
    "parallelDo": "",
    "events": {},
    "changeFloor": {},
    "afterBattle": {},
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {},
    "cannotMove": {},
    "map": [
    [527,527,527,527,527,527,527,527,527,527,527,527,527,527,527],
    [527,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,527],
    [527,  0,  0,  0,  0,  0,  0,557,  0,  0,  0,  0,  0,  0,527],
    [527,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,527],
    [527,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,527],
    [527,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,527],
    [527,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,527],
    [527,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,527],
    [527,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,527],
    [527,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,527],
    [527,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,527],
    [527,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,527],
    [527,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,527],
    [527,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,527],
    [527,527,527,527,527,527,527,527,527,527,527,527,527,527,527]
],
    "bgmap": [

],
    "fgmap": [

],
    "bg2map": [

],
    "fg2map": [

],
    "beforeBattle": {},
    "color": [
        0,
        0,
        0,
        0.1
    ],
    "weather": [
        "fog",
        2
    ],
    "cannotMoveIn": {},
    "cannotMoveDirectly": true
}