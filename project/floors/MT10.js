main.floors.MT10=
{
    "floorId": "MT10",
    "title": "草原",
    "name": "10",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 1,
    "defaultGround": "grass",
    "bgm": "grass.mp3",
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {},
    "changeFloor": {
        "0,7": {
            "floorId": "MT6",
            "loc": [
                14,
                7
            ]
        },
        "7,0": {
            "floorId": "MT11",
            "loc": [
                7,
                14
            ]
        }
    },
    "afterBattle": {},
    "afterGetItem": {
        "4,6": [
            "\t[原始人]\b[up,hero]这是什么？",
            "\t[原始人]\b[up,hero]好像有什么形状",
            "\t[原始人]\b[up,hero]难道是什么钥匙吗",
            "\t[原始人]\b[up,hero]黄色的，好像和家里面的那些巨石有些关系"
        ]
    },
    "afterOpenDoor": {
        "1,4": [
            {
                "type": "animate",
                "name": "emm",
                "loc": "hero"
            },
            "\t[原始人]\b[down,hero]原来如此"
        ]
    },
    "autoEvent": {},
    "cannotMove": {},
    "map": [
    [ 20, 20, 20, 20, 20, 20, 20, 91, 20, 20, 20, 20, 20, 20, 20],
    [ 20,  0, 28,372, 29, 20,  0,  0,267,  0,  0, 20,  0,  0, 20],
    [ 20, 33,381, 20, 32, 20, 33,  0, 20, 33, 29, 20, 33,  0, 20],
    [ 20,  0, 27, 20, 29,368,  0,  0, 20,  0,  0,276,  0,  0, 20],
    [ 20,492, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20,369, 20],
    [ 20,  0, 29, 20,  0, 27,372,  0, 20,  0,  0, 20,  0,  0, 20],
    [ 20,204, 20, 20, 21, 34, 20,  0, 20, 29, 34, 20, 29, 33, 20],
    [ 92,  0, 33, 20, 20, 20, 20,224, 20,  0,  0,209,  0,  0, 20],
    [ 20,  0,  0,204,  0, 20,  0, 28,  0,204, 20, 20, 20, 20, 20],
    [ 20, 20, 20, 20,  0, 20, 34,  0, 20,  0, 20,  0, 27,  0, 20],
    [ 20, 32, 29,  0, 34, 20, 20, 20, 20,  0,368, 29, 33, 29, 20],
    [ 20,209, 20, 20, 20, 20,  0,  0, 20, 20, 20, 20, 20,  0, 20],
    [ 20,  0, 20, 33,  0,204, 29, 34, 20,  0, 33,  0, 20,  0, 20],
    [ 20, 33,276,  0, 33, 20,  0,  0,209,  0,  0,  0,276,  0, 20],
    [ 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]
],
    "bgmap": [

],
    "fgmap": [

],
    "beforeBattle": {},
    "weather": [
        "sun",
        8
    ],
    "cannotMoveIn": {},
    "bg2map": [

],
    "fg2map": [

]
}