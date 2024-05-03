main.floors.MT57=
{
    "floorId": "MT57",
    "title": "苍蓝之殿-左下",
    "name": "57",
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
        "13,8": [
            "本地图不能使用跳跃。中间那个深色的开关可以开启去苍蓝之殿右下角的路。打死那两个石头人开机关门"
        ],
        "7,1": [
            {
                "type": "if",
                "condition": "(!switch:A)",
                "true": [
                    {
                        "type": "openDoor",
                        "loc": [
                            12,
                            7
                        ],
                        "floorId": "MT50"
                    },
                    {
                        "type": "openDoor",
                        "loc": [
                            13,
                            7
                        ],
                        "floorId": "MT60"
                    },
                    {
                        "type": "openDoor",
                        "loc": [
                            12,
                            7
                        ],
                        "floorId": "MT61"
                    },
                    {
                        "type": "playSound",
                        "name": "door.mp3"
                    },
                    "\t[智人]\b[down,hero]貌似有哪里的门开了，应该是苍蓝之殿右下角吧",
                    "现在可以去苍蓝之殿的右下区域了。注意有三条可以去右边的路，机关门都已经开启"
                ]
            },
            {
                "type": "setValue",
                "name": "switch:A",
                "value": "true"
            }
        ]
    },
    "changeFloor": {
        "14,7": {
            "floorId": "MT56",
            "loc": [
                0,
                7
            ]
        },
        "7,14": {
            "floorId": "MT54",
            "loc": [
                7,
                0
            ]
        },
        "0,7": {
            "floorId": "MT58",
            "loc": [
                14,
                7
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {
        "2,2": [
            {
                "type": "setValue",
                "name": "flag:door_MT57_7_4",
                "operator": "+=",
                "value": "1"
            }
        ],
        "12,2": [
            {
                "type": "setValue",
                "name": "flag:door_MT57_7_4",
                "operator": "+=",
                "value": "1"
            }
        ]
    },
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {
        "7,4": {
            "0": {
                "condition": "flag:door_MT57_7_4==2",
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
                        "name": "flag:door_MT57_7_4",
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
    [648,648,648,648,648,648,648,648,648,648,648,648,648,648,648],
    [648,  0,648,378,403,648,396,661,390,648,403,376,648,  0,648],
    [648,376,601,487,390,648,  0,468,  0,648,396,487,601,378,648],
    [648,  0,648,494,648,648,487,103,487,648,648,494,648,  0,648],
    [648,482,648,  0,381,648,648, 85,648,648,381,  0,648,482,648],
    [648,  0,596, 33,  0,656,  0,491,  0,656,  0, 33,596,  0,648],
    [648,648,648,648,648,648,648,497,648,648,648,648,648,648,648],
    [ 92,  0,  0,484,  0,  0,  0, 22,  0,  0,  0,484,  0,  0, 94],
    [648,648,243,648,249,648,648,648,648,648,249,648,243,129,648],
    [648, 27,  0,648,  0,403,  0,648,  0,403,  0,648,  0, 28,648],
    [648,  0,482,648,390,491,396,494,396,491,390,648,482,  0,648],
    [648,601,648,648,648,648,648,648,648,648,648,648,648,601,648],
    [648,491,378,657,484,648,  0,484,  0,648,484,657,376,491,648],
    [648,381,  0,648,  0,656, 29,  0, 29,656,  0,648,  0,381,648],
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