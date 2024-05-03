main.floors.MT66=
{
    "floorId": "MT66",
    "title": "苍蓝之殿-右下",
    "name": "66",
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
    "events": {
        "1,8": [
            "下面那个装备的作用是对魔攻拥有500点防御",
            "本塔一般不需要保存套装等操作，因此移动端不需要担心需要频繁切装备",
            "注意这个红门是有嘲讽的，打开之后会出现向右的嘲讽，源头在那个双手剑士"
        ],
        "6,1": [
            "上面地狱绘图，请做好心理准备"
        ]
    },
    "changeFloor": {
        "0,6": {
            "floorId": "MT65",
            "loc": [
                14,
                6
            ]
        },
        "7,0": {
            "floorId": "MT69",
            "loc": [
                7,
                14
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {
        "4,11": [
            {
                "type": "setValue",
                "name": "flag:door_MT66_3_12",
                "operator": "+=",
                "value": "1"
            }
        ],
        "4,13": [
            {
                "type": "setValue",
                "name": "flag:door_MT66_3_12",
                "operator": "+=",
                "value": "1"
            }
        ],
        "7,11": [
            {
                "type": "setValue",
                "name": "flag:door_MT66_6_12",
                "operator": "+=",
                "value": "1"
            }
        ],
        "7,13": [
            {
                "type": "setValue",
                "name": "flag:door_MT66_6_12",
                "operator": "+=",
                "value": "1"
            }
        ],
        "10,11": [
            {
                "type": "setValue",
                "name": "flag:door_MT66_9_12",
                "operator": "+=",
                "value": "1"
            }
        ],
        "10,13": [
            {
                "type": "setValue",
                "name": "flag:door_MT66_9_12",
                "operator": "+=",
                "value": "1"
            }
        ]
    },
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {
        "3,12": {
            "0": {
                "condition": "flag:door_MT66_3_12==2",
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
                        "name": "flag:door_MT66_3_12",
                        "operator": "=",
                        "value": "null"
                    }
                ]
            }
        },
        "6,12": {
            "0": {
                "condition": "flag:door_MT66_6_12==2",
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
                        "name": "flag:door_MT66_6_12",
                        "operator": "=",
                        "value": "null"
                    }
                ]
            }
        },
        "9,12": {
            "0": {
                "condition": "flag:door_MT66_9_12==2",
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
                        "name": "flag:door_MT66_9_12",
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
    [648,  0,578,  0, 29,  0,129,  0, 21,  0,578,  0,657,  0,648],
    [648, 28,648,376,484,378,648,484,  0,403,648,484,648,484,648],
    [648,  0,648,648,492,648,648,492,648,648,648,659,648,492,648],
    [648,482,249,  0, 27,648, 27,482,648,376,484, 28,648,482,648],
    [648,648,648,648,  0,648,  0, 29,648,  0,403,  0,648,482,648],
    [ 92,  0,484,648,601,648,220,648,648,232,648,648,648,648,648],
    [648,  0,  0,657,  0,  0,484,  0,  0,  0,601, 29,  0,376,648],
    [648,129,648,648,648,605,648,605,648,648,648,  0,103,  0,648],
    [648, 27,  0,482,  0,381,648, 28,  0,482,648,378,  0,484,648],
    [648,648,497,648,648,648,648,648,494,648,648,648,648,563,648],
    [648,487,390,648,232,376,648,240,376,648,671,484,  0,484,648],
    [648,663,403, 85,403,487, 85,381,487, 85,  0,  0,103,  0,648],
    [648,487,396,648,232,378,648,240,378,648,671,484,  0,484,648],
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