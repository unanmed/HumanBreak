main.floors.MT60=
{
    "floorId": "MT60",
    "title": "苍蓝之殿-中",
    "name": "60",
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
        "7,14": {
            "floorId": "MT50",
            "loc": [
                7,
                0
            ]
        },
        "0,7": {
            "floorId": "MT53",
            "loc": [
                14,
                7
            ]
        },
        "7,0": {
            "floorId": "MT61",
            "loc": [
                7,
                14
            ]
        },
        "14,7": {
            "floorId": "MT64",
            "loc": [
                0,
                7
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {
        "1,3": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_2_2",
                "operator": "+=",
                "value": "1"
            }
        ],
        "3,3": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_2_2",
                "operator": "+=",
                "value": "1"
            }
        ],
        "3,5": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_2_2",
                "operator": "+=",
                "value": "1"
            }
        ],
        "1,5": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_2_2",
                "operator": "+=",
                "value": "1"
            }
        ],
        "1,9": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_2_12",
                "operator": "+=",
                "value": "1"
            }
        ],
        "1,11": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_2_12",
                "operator": "+=",
                "value": "1"
            }
        ],
        "3,11": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_2_12",
                "operator": "+=",
                "value": "1"
            }
        ],
        "3,9": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_2_12",
                "operator": "+=",
                "value": "1"
            }
        ],
        "11,9": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_12_12",
                "operator": "+=",
                "value": "1"
            }
        ],
        "11,11": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_12_12",
                "operator": "+=",
                "value": "1"
            }
        ],
        "13,11": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_12_12",
                "operator": "+=",
                "value": "1"
            }
        ],
        "13,9": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_12_12",
                "operator": "+=",
                "value": "1"
            }
        ],
        "11,3": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_12_2",
                "operator": "+=",
                "value": "1"
            }
        ],
        "11,5": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_12_2",
                "operator": "+=",
                "value": "1"
            }
        ],
        "13,5": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_12_2",
                "operator": "+=",
                "value": "1"
            }
        ],
        "13,3": [
            {
                "type": "setValue",
                "name": "flag:door_MT60_12_2",
                "operator": "+=",
                "value": "1"
            }
        ]
    },
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {
        "2,2": {
            "0": {
                "condition": "flag:door_MT60_2_2==4",
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
                        "name": "flag:door_MT60_2_2",
                        "operator": "=",
                        "value": "null"
                    }
                ]
            }
        },
        "2,12": {
            "0": {
                "condition": "flag:door_MT60_2_12==4",
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
                        "name": "flag:door_MT60_2_12",
                        "operator": "=",
                        "value": "null"
                    }
                ]
            }
        },
        "12,12": {
            "0": {
                "condition": "flag:door_MT60_12_12==4",
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
                        "name": "flag:door_MT60_12_12",
                        "operator": "=",
                        "value": "null"
                    }
                ]
            }
        },
        "12,2": {
            "0": {
                "condition": "flag:door_MT60_12_2==4",
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
                        "name": "flag:door_MT60_12_2",
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
    [648,390,441,396,648,  0,  0,  0,  0,  0,648,396,441,390,648],
    [648,648, 85,648,648,  0,  0,  0,  0,  0,648,648, 85,648,648],
    [648,249,  0,249,648,  0,  0,  0,  0,  0,648,232,  0,232,648],
    [648,  0,491,  0,648,  0,  0,  0,  0,  0,648,  0,491,  0,648],
    [648,249,  0,249,648,103,  0,  0,  0,103,648,232,  0,232,648],
    [648,648,492,648,648,  0,  0,  0,  0,  0,648,648,492,648,648],
    [ 92,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 85, 94],
    [648,648,492,648,648,  0,  0,  0,  0,  0,648,648,492,648,648],
    [648,578,  0,578,648,103,  0,  0,  0,103,648,671,  0,671,648],
    [648,  0,491,  0,648,  0,  0,  0,  0,  0,648,  0,491,  0,648],
    [648,578,  0,578,648,  0,  0,  0,  0,  0,648,671,  0,671,648],
    [648,648, 85,648,648,  0,  0,  0,  0,  0,648,648, 85,648,648],
    [648,390,441,396,648,  0,  0,  0,  0,  0,648,396,441,390,648],
    [648,648,648,648,648,648,648, 93,648,648,648,648,648,648,648]
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