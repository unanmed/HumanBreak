main.floors.MT71=
{
    "floorId": "MT71",
    "title": "苍蓝之殿-右下",
    "name": "71",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 8,
    "defaultGround": "T650",
    "bgm": "palaceSouth.mp3",
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {},
    "changeFloor": {
        "0,7": {
            "floorId": "MT69",
            "loc": [
                14,
                7
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {
        "12,7": [
            {
                "type": "openDoor",
                "loc": [
                    10,
                    13
                ]
            },
            {
                "type": "openDoor",
                "loc": [
                    10,
                    1
                ]
            },
            {
                "type": "setValue",
                "name": "flag:door_palaceSouth",
                "operator": "+=",
                "value": "1"
            },
            {
                "type": "setValue",
                "name": "flag:door_palace",
                "operator": "+=",
                "value": "1"
            },
            {
                "type": "if",
                "condition": "(flag:door_palaceSouth===2)",
                "true": [
                    {
                        "type": "openDoor",
                        "loc": [
                            1,
                            5
                        ],
                        "floorId": "MT50"
                    },
                    {
                        "type": "openDoor",
                        "loc": [
                            13,
                            5
                        ],
                        "floorId": "MT50"
                    },
                    {
                        "type": "openDoor",
                        "loc": [
                            1,
                            9
                        ],
                        "floorId": "MT50"
                    },
                    {
                        "type": "openDoor",
                        "loc": [
                            13,
                            9
                        ],
                        "floorId": "MT50"
                    },
                    {
                        "type": "setValue",
                        "name": "flag:door_palaceSouth",
                        "value": "null"
                    },
                    "入口处的机关门已开启"
                ]
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
    [648,378,484,671,  0,648,  0,  0,484,  0, 85,376,487,376,648],
    [648,484,376,648,  0,648,  0,648,648,492,648,  0,378,  0,648],
    [648,494,648,648,484,648,484,648,376,  0,648,376,476,376,648],
    [648,378,484,232,  0,648,  0,648,  0,484,648,  0,378,  0,648],
    [648,484,376,648,  0,648,  0,578,378,  0,648,648,648,648,648],
    [648,648,648,648,657,648,657,648,648,648,648,484,  0,484,648],
    [ 92,  0,  0,  0,  0,491,  0, 21,  0,  0,492,  0,673,  0,648],
    [648,648,648,648,657,648,657,648,648,648,648,484,  0,484,648],
    [648,484,376,648,  0,648,  0,578,378,  0,648,648,648,648,648],
    [648,378,484,232,  0,648,  0,648,  0,484,648,  0,376,  0,648],
    [648,494,648,648,484,648,484,648,376,  0,648,378,476,378,648],
    [648,484,376,648,  0,648,  0,648,648,492,648,  0,376,  0,648],
    [648,378,484,671,  0,648,  0,  0,484,  0, 85,378,487,378,648],
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