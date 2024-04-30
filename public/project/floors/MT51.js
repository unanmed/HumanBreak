main.floors.MT51=
{
    "floorId": "MT51",
    "title": "苍蓝之殿-左下",
    "name": "51",
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
            "floorId": "MT50",
            "loc": [
                0,
                7
            ]
        },
        "0,8": {
            "floorId": "MT52",
            "loc": [
                14,
                8
            ]
        },
        "7,0": {
            "floorId": "MT53",
            "loc": [
                7,
                14
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {
        "11,12": [
            {
                "type": "setValue",
                "name": "flag:door_MT51_12_11",
                "operator": "+=",
                "value": "1"
            }
        ],
        "13,12": [
            {
                "type": "setValue",
                "name": "flag:door_MT51_12_11",
                "operator": "+=",
                "value": "1"
            }
        ]
    },
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {
        "12,11": {
            "0": {
                "condition": "flag:door_MT51_12_11==2",
                "currentFloor": true,
                "priority": 0,
                "delayExecute": false,
                "multiExecute": false,
                "data": [
                    {
                        "type": "openDoor"
                    },
                    {
                        "type": "setValue",
                        "name": "flag:door_MT51_12_11",
                        "operator": "=",
                        "value": "null"
                    }
                ]
            }
        }
    },
    "cannotMove": {},
    "cannotMoveIn": {},
    "map": [
    [648,648,648,648,648,648,648, 91,648,648,648,648,648,648,648],
    [648,  0, 21,  0,596, 32,  0, 32,648, 27,648, 29,  0, 29,648],
    [648, 27, 33, 28,648,  0,381,  0,648,  0,596,  0,378,  0,648],
    [648,648,648,648,648,  0,648,648,648, 33,648,648,648,578,648],
    [648,594, 33,381,648,539, 34,492,  0,243,648,376,403,378,648],
    [648, 33,648,492,648,  0,648,648,648,  0,648, 33, 21, 33,648],
    [648, 27,648,  0, 34,  0,219,  0, 34,  0,648,648,494,648,648],
    [648,243,648,656,648,648,  0,648,  0,648,648, 27,  0,  0, 94],
    [ 92,  0, 34,  0, 27,492, 34,648,  0,  0,539,  0,381,  0,648],
    [648,648,648,648,648,648,  0,648,656,648,648,648,648,648,648],
    [648,  0, 33,  0, 29,  0,219,648, 33,  0,648, 33,662, 33,648],
    [648,648,601,648,492,648,  0,648,648,492,648,648, 85,648,648],
    [648, 33,  0,648,482,648,  0,648,381,  0,648,596,  0,596,648],
    [648,  0,378,648,482,648,  0,220,  0, 28,492,  0, 33,  0,648],
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