main.floors.MT52=
{
    "floorId": "MT52",
    "title": "苍蓝之殿-左下",
    "name": "52",
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
        "14,8": {
            "floorId": "MT51",
            "loc": [
                0,
                8
            ]
        },
        "4,0": {
            "floorId": "MT54",
            "loc": [
                4,
                14
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {
        "12,1": [
            {
                "type": "setValue",
                "name": "flag:door_MT52_11_2",
                "operator": "+=",
                "value": "1"
            }
        ],
        "12,3": [
            {
                "type": "setValue",
                "name": "flag:door_MT52_11_2",
                "operator": "+=",
                "value": "1"
            }
        ],
        "9,1": [
            {
                "type": "setValue",
                "name": "flag:door_MT52_8_2",
                "operator": "+=",
                "value": "1"
            }
        ],
        "9,3": [
            {
                "type": "setValue",
                "name": "flag:door_MT52_8_2",
                "operator": "+=",
                "value": "1"
            }
        ]
    },
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {
        "11,2": {
            "0": {
                "condition": "flag:door_MT52_11_2==2",
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
                        "name": "flag:door_MT52_11_2",
                        "operator": "=",
                        "value": "null"
                    }
                ]
            }
        },
        "8,2": {
            "0": {
                "condition": "flag:door_MT52_8_2==2",
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
                        "name": "flag:door_MT52_8_2",
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
    [648,648,648,648, 91,648,648,648,648,648,648,648,648,648,648],
    [648, 27,  0,648,  0,648,376,491,648,249,376,648,578,  0,648],
    [648,  0,482,648,243,497, 22,403, 85,403,491, 85,  0,484,648],
    [648, 28,  0,220,  0,648,378,491,648,249,378,648,578,  0,648],
    [648,648,648,648,  0,648,648,648,648,648,648,648,648,  0,648],
    [648, 33,  0,648,482,648, 29,  0,648,381,  0,648, 28,  0,648],
    [648,  0,381,492,  0,648,  0, 27,539,  0, 34,596,  0,103,648],
    [648, 33,  0,648,  0,648,648,219,648,648,648,648,648,648,648],
    [648,596,648,648,656,  0,  0,  0,  0,482,  0,  0,  0,  0, 94],
    [648,376,  0,648,648,648,648,494,648,648,648,648,497,648,648],
    [648, 33,381,492,482,539, 33,  0, 28,494,376,381, 22,378,648],
    [648,601,648,648,648,648,648,243,648,648,648,240,648,648,648],
    [648, 34,  0,648, 34,  0,648,  0, 29, 27,648,484,396,484,648],
    [648,103, 27,596,  0, 33,220,  0, 33, 28,249,403, 21,390,648],
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