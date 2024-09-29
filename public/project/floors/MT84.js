main.floors.MT84=
{
    "floorId": "MT84",
    "title": "苍蓝之殿-左上",
    "name": "84",
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
    "events": {},
    "changeFloor": {
        "14,7": {
            "floorId": "MT83",
            "loc": [
                0,
                7
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {
        "6,7": [
            {
                "type": "setValue",
                "name": "flag:door_palace",
                "operator": "+=",
                "value": "1"
            },
            {
                "type": "if",
                "condition": "(flag:door_palace===4)",
                "true": [
                    {
                        "type": "openDoor",
                        "loc": [
                            7,
                            4
                        ],
                        "floorId": "MT72"
                    },
                    {
                        "type": "openDoor",
                        "loc": [
                            4,
                            7
                        ],
                        "floorId": "MT72"
                    },
                    {
                        "type": "openDoor",
                        "loc": [
                            7,
                            10
                        ],
                        "floorId": "MT72"
                    },
                    {
                        "type": "openDoor",
                        "loc": [
                            10,
                            7
                        ],
                        "floorId": "MT72"
                    },
                    {
                        "type": "setValue",
                        "name": "flag:door_palace",
                        "value": "null"
                    },
                    "苍蓝之殿中心处的机关门已经开启，进入后会到达本章最后一个小区域"
                ]
            }
        ]
    },
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {},
    "cannotMove": {},
    "cannotMoveIn": {},
    "map": [
    [648,648,648,648,648,648,648,648,648,648,648,648,648,648,648],
    [648,671,  0,484,378,  0,679,648,578,  0, 28, 34,658,  0,648],
    [648,  0,648,648,648,648,  0,648,  0,648,648,648,648,658,648],
    [648,378,648,  0,482,648,484,648, 34,648, 33,  0,648, 28,648],
    [648,232,648,648,538,648,378,648, 28,648,513,648,648,  0,648],
    [648,  0,482,381,  0,648,  0,648,  0,648,  0, 29, 33,677,648],
    [648,648,648,648,648,648,618,648,682,648,648,648,648,648,648],
    [648,466,467,468,695,664,692,648,  0,  0,484,  0,484,  0, 94],
    [648,648,648,648,648,648,618,648,682,648,648,648,648,648,648],
    [648,  0,482,381,  0,648,  0,648,  0,648,  0, 29, 33,677,648],
    [648,232,648,648,538,648,376,648, 27,648,513,648,648,  0,648],
    [648,376,648,  0,482,648,484,648, 34,648, 33,  0,648, 27,648],
    [648,  0,648,648,648,648,  0,648,  0,648,648,648,648,658,648],
    [648,671,  0,484,376,  0,679,648,578,  0, 27, 34,658,  0,648],
    [648,648,648,648,648,648,648,648,648,648,648,648,648,648,648]
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