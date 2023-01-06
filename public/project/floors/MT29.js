main.floors.MT29=
{
    "floorId": "MT29",
    "title": "智慧小径",
    "name": "智慧小径",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 2,
    "defaultGround": "grass",
    "bgm": "road.mp3",
    "firstArrive": [
        {
            "type": "animate",
            "name": "hand",
            "loc": [
                13,
                8
            ]
        },
        {
            "type": "animate",
            "name": "hand",
            "loc": [
                13,
                8
            ]
        },
        {
            "type": "animate",
            "name": "jianji",
            "loc": [
                13,
                8
            ]
        },
        {
            "type": "hide",
            "loc": [
                [
                    13,
                    8
                ]
            ],
            "remove": true,
            "time": 500
        },
        {
            "type": "jump",
            "from": [
                12,
                8
            ],
            "dxy": [
                5,
                0
            ],
            "time": 500
        },
        "\t[初级智人]\b[up,hero]杰克？",
        "\t[初级智人]\b[up,hero]他为什么会在这里？",
        "\t[初级智人]\b[up,hero]奇怪，他好像在为我打通道路。",
        "\t[初级智人]\b[up,hero]这些怪物这么强，他是怎么对付的？",
        "\t[初级智人]\b[up,hero]而且好像在故意让我发现。",
        "\t[初级智人]\b[up,hero]跟上去看看。"
    ],
    "eachArrive": [],
    "parallelDo": "",
    "events": {},
    "changeFloor": {
        "0,9": {
            "floorId": "MT30",
            "loc": [
                14,
                9
            ]
        },
        "8,14": {
            "floorId": "MT28",
            "loc": [
                8,
                0
            ]
        },
        "14,8": {
            "floorId": "MT31",
            "loc": [
                0,
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
    [ 17, 17, 17, 17,143,143,143,143,143,143,143,143,143,143,143],
    [ 17, 17, 17, 17,143,143,143,143,482,237,484,280,  0,390,143],
    [ 17, 17, 17, 17,143,143,468,468,482,143,484,143,396,441,143],
    [ 17, 17, 17, 17,143,143,143,492,143,143,562,143,492,143,143],
    [ 17, 17, 17, 17,390,  0,143,482,143,  0,390,484,396,  0,143],
    [ 17, 17, 17, 17,482,396,143,403,143,237,143,143,143,492,143],
    [ 17, 17, 17, 17,280,143,143,390,403,  0,143,396,441,420,143],
    [ 17, 17,  0,500,  0,376,143,143,568,143,143,143,143,572,143],
    [ 17, 17,  0,143,482,482,143,376,482,568,  0,396,123,576, 94],
    [ 92,  0,  0,143,378,  0,568,  0,378,143,390,  0,484,  0,143],
    [143,500,143,143,143,492,143,143,143,143,143,492,143,143,143],
    [143,484, 21,572,390,  0,  0,  0,237,143,484,562,491,491,143],
    [143,390,396,494, 21,484,143,143,484,492,492,143,143,237,143],
    [143,143,143,143,396,  0,  0,492,  0,280,390,403,484,396,143],
    [143,143,143,143,143,143,143,143, 93,143,143,143,143,143,143]
],
    "bgmap": [
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,144,144,144,144,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,144,  0,  0,144,  0,  0,144,144,144,144,144,144,144],
    [144,144,144,  0,  0,144,144,144,144,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,144,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,144,144,144,144,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,144,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,144,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,144,  0,  0,  0,  0,  0,  0]
],
    "fgmap": [

],
    "bg2map": [
    [142,142,142,142,142,142,142,142,142,142,142,142,  0,  0,  0],
    [142,142,142,142,142,142,142,  0,  0,  0,  0,  0,  0,  0,  0],
    [142,142,142,142,142,142,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [142,142,142,142,142,142,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [142,142,142,142,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [142,142,142,142,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [142,142,142,142,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [142,142,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [142,142,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
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