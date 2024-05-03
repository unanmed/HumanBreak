main.floors.MT59=
{
    "floorId": "MT59",
    "title": "苍蓝之殿-左下",
    "name": "59",
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
        "14,7": {
            "floorId": "MT58",
            "loc": [
                0,
                7
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {
        "2,7": [
            {
                "type": "openDoor",
                "loc": [
                    4,
                    4
                ]
            },
            {
                "type": "openDoor",
                "loc": [
                    4,
                    10
                ]
            },
            {
                "type": "setValue",
                "name": "flag:door_palaceSouth",
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
            }
        ]
    },
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {
        "4,10": {
            "1": null
        },
        "4,4": {
            "1": null
        }
    },
    "cannotMove": {},
    "cannotMoveIn": {},
    "map": [
    [648,648,648,648,648,648,648,648,648,648,648,648,648,648,648],
    [648, 27,  0, 27,648,  0,648,578,  0,491,  0,596,482,  0,648],
    [648,491, 28,491,648,  0,648,  0,648,648,648,648,  0, 29,648],
    [648, 27,468, 27,648,487,648, 21,648, 27,  0,648, 27,  0,648],
    [648,  0, 28,  0, 85,  0,648,487,648,  0, 29,657,  0, 28,648],
    [648,648,648,648,648,390,648,390,648,484,648,648,648,648,648],
    [648,482,  0,482,648,  0,249,  0,648,539,648,482,  0,482,648],
    [648,  0,666,  0,492,403,648,648,648,  0,492,  0,381,  0, 94],
    [648,482,  0,482,648,  0,249,  0,648,539,648,482,  0,482,648],
    [648,648,648,648,648,396,648,396,648,484,648,648,648,648,648],
    [648,  0, 27,  0, 85,  0,648,487,648,  0, 29,657,  0, 27,648],
    [648, 28,468, 28,648,487,648, 21,648, 28,  0,648, 28,  0,648],
    [648,491, 27,491,648,  0,648,  0,648,648,648,648,  0, 29,648],
    [648, 28,  0, 28,648,  0,648,578,  0,491,  0,596,482,  0,648],
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