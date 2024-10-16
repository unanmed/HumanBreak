main.floors.MT20=
{
    "floorId": "MT20",
    "title": "智慧之塔",
    "name": "20",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 2,
    "defaultGround": "grass",
    "bgm": "plot1.mp3",
    "firstArrive": null,
    "eachArrive": [
        {
            "type": "setGlobalValue",
            "name": "animateSpeed",
            "value": 333.3333
        },
        {
            "type": "function",
            "function": "function(){\ncore.deleteAllCanvas()\n}"
        }
    ],
    "parallelDo": "",
    "events": {
        "6,9": [
            "万里，智慧破苍穹"
        ],
        "8,9": [
            "千丈，勇气贯星海"
        ]
    },
    "changeFloor": {
        "7,14": {
            "floorId": "MT19",
            "loc": [
                7,
                0
            ]
        },
        "7,8": {
            "floorId": "tower1",
            "loc": [
                7,
                14
            ]
        }
    },
    "afterBattle": {},
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {},
    "cannotMove": {},
    "map": [
    [142,142,142,142,142,142,142,40203,142,142,142,142,142,142,142],
    [142,142,142,142,142,40193,142,142,142,40197,142,142,142,142,142],
    [142,142,142,142,142,40201,142,40203,142,40205,142,142,142,142,142],
    [142,142,142,142,40168,40169,142,142,142,40173,40174,142,142,142,142],
    [142,142,142,142,40176,40177,40178,40179,40180,40181,40182,142,142,142,142],
    [142,142,142,142,40184,40185,40202,40203,40204,40189,40190,142,142,142,142],
    [142,142,142,142,40192,40193,40202,40203,40204,40197,40198,142,142,142,142],
    [142,142,142,142,40200,40201,40267,40268,40269,40205,40206,142,142,142,142],
    [142,142,142,142,40208,40209,40275,543,40277,40213,40214,142,142,142,142],
    [142,142,142,142,142,142,129,  0,129,142,142,142,142,142,142],
    [142,142,142,142,142,142,142,  0,142,142,142,142,142,142,142],
    [142,142,142,142,142,142,142,  0,142,142,142,142,142,142,142],
    [142,142,142,142,142,142,142,  0,142,142,142,142,142,142,142],
    [142,142,142,142,142,142,142,  0,142,142,142,142,142,142,142],
    [142,142,142,142,142,142,142, 93,142,142,142,142,142,142,142]
],
    "beforeBattle": {},
    "bgmap": [
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,40202,40203,40204,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,40210,40276,40212,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
],
    "fgmap": [
    [  0,  0,  0,  0,40144,40185,40202,40191,40204,40189,40150,  0,  0,  0,  0],
    [  0,  0,  0,  0,40152,40143,40202,40203,40204,40159,40158,  0,  0,  0,  0],
    [  0,  0,  0,  0,40160,40151,40202,40191,40204,40167,40166,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,40209,40202,40203,40204,40213,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,40191,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
],
    "cannotMoveIn": {},
    "bg2map": [

],
    "fg2map": [

]
}