main.floors.MT41=
{
    "floorId": "MT41",
    "title": "冰封山洞",
    "name": "冰封雪原",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 8,
    "defaultGround": "T331",
    "bgm": "winter.mp3",
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "2,13": [
            "怪物身后的水可以对话，对话后获得50000点生命值",
            "本层可以使用跳跃技能"
        ],
        "5,11": [
            "\t[初级智人]\b[up,hero]竟然有水！",
            "\t[初级智人]\b[up,hero]这里这么冷，为什么会有水呢？",
            {
                "type": "animate",
                "name": "emm",
                "loc": "hero"
            },
            "\t[初级智人]\b[up,hero]竟然是温水！",
            {
                "type": "animate",
                "name": "emm",
                "loc": "hero"
            },
            "\t[初级智人]\b[up,hero]这是为什么呢？",
            "\t[初级智人]\b[up,hero]之后应该会知道原因吧。",
            "\t[初级智人]\b[up,hero]喝一口吧，已经很长时间没喝水了。",
            {
                "type": "playSound",
                "name": "drink.mp3"
            },
            {
                "type": "sleep",
                "time": 2000
            },
            {
                "type": "animate",
                "name": "amazed",
                "loc": "hero"
            },
            "\t[初级智人]\b[up,hero]这水果然不一样！",
            "\t[初级智人]\b[up,hero]感觉喝过之后要比之前更加有活力了。",
            "生命值增加50000",
            {
                "type": "setValue",
                "name": "status:hp",
                "operator": "+=",
                "value": "50000"
            },
            {
                "type": "hide",
                "remove": true
            }
        ],
        "5,7": [
            "你竟然能发现这里？！",
            "那我就送你回到标题界面吧！",
            {
                "type": "restart"
            },
            {
                "type": "function",
                "function": "function(){\ncore.completeAchievement('explore', 3);\n}"
            }
        ]
    },
    "changeFloor": {
        "3,14": {
            "floorId": "MT39",
            "loc": [
                13,
                10
            ]
        },
        "6,4": {
            "floorId": "MT40",
            "loc": [
                2,
                1
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
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0, 34,  0,603,336,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,540,  0,  0,  0,336,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,336,602,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 34,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,381,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,603,336,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0, 17,  0,  0,  0, 34,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0, 91,  0,  0,  0,  0,381,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,617,  0,  0,  0,336,602,  0,  0,  0,  0],
    [  0,  0,129,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,540,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
],
    "bgmap": [
    [20041,20041,20041,20041,20041,20044,20049,20049,20049,20049,20049,20043,20041,20041,20041],
    [20041,20041,20041,20041,20041,20042,20057,20057,20057,20057,20057,20040,20041,20041,20041],
    [20041,20041,20041,20041,20041,20042,20065,20065,20065,20065,20065,20040,20041,20041,20041],
    [20041,20041,20041,20041,20041,20042,  0,  0,  0,  0,  0,20040,20041,20041,20041],
    [20041,20041,20041,20041,20041,20042,  0,20032,20034,  0,  0,20040,20041,20041,20041],
    [20041,20041,20041,20041,20041,20036,20033,20035,20042,  0,  0,20040,20041,20041,20041],
    [20041,20041,20041,20041,20041,20041,20041,20041,20042,  0,  0,20040,20041,20041,20041],
    [20041,20041,20041,20041,20044,  0,20043,20041,20042,  0,  0,20040,20041,20041,20041],
    [20041,20041,20041,20041,20042,  0,20040,20041,20042,  0,  0,20040,20041,20041,20041],
    [20041,20041,20041,20041,20042,142,20040,20041,20042,  0,  0,20040,20041,20041,20041],
    [20044,20049,20049,20049,20050,142,20048,20049,20050,  0,  0,20040,20041,20041,20041],
    [20042,20057,20057,20057,20058,142,20056,20057,20058,  0,  0,20040,20041,20041,20041],
    [20042,20065,20065,20065,20074,  0,20064,20065,20074,  0,  0,20040,20041,20041,20041],
    [20042,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,20040,20041,20041,20041],
    [20036,20033,20034,  0,20032,20033,20033,20033,20033,20033,20033,20035,20041,20041,20041]
],
    "fgmap": [

],
    "bg2map": [
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,20062,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,20070,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,20078,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
],
    "fg2map": [

]
}