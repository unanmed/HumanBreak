main.floors.MT6=
{
    "floorId": "MT6",
    "title": "主塔 6 层",
    "name": "6",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 1,
    "defaultGround": "ground",
    "bgm": "cave.mp3",
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "10,13": [
            "接下来的几层将展示特效插件——碎裂特效的效果与使用。",
            "这里不再说明插件的安装，安装请到插件库中查看。这里我只展示它在不同参数下的使用效果",
            "首先就是本层，初始为插件默认效果，你可以打这些怪来查看效果，也可以在左边的那个牌子处修改一些参数"
        ],
        "4,13": [
            {
                "type": "while",
                "condition": "1",
                "data": [
                    {
                        "type": "choices",
                        "text": "修改参数",
                        "choices": [
                            {
                                "text": "碎片移动距离：${core.getFragProperty('mml')}",
                                "action": [
                                    {
                                        "type": "while",
                                        "condition": "1",
                                        "data": [
                                            {
                                                "type": "choices",
                                                "text": "当前值：${core.getFragProperty('mml')}",
                                                "choices": [
                                                    {
                                                        "text": "+0.1",
                                                        "action": [
                                                            {
                                                                "type": "function",
                                                                "function": "function(){\ncore.setFragProperty('mml', core.getFragProperty('mml') + 0.1)\n}"
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "text": "-0.1",
                                                        "action": [
                                                            {
                                                                "type": "function",
                                                                "function": "function(){\ncore.setFragProperty('mml', core.getFragProperty('mml') - 0.1)\n}"
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "text": "返回",
                                                        "action": [
                                                            {
                                                                "type": "break",
                                                                "n": 1
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "text": "碎片随机距离：${core.getFragProperty('mf')}",
                                "action": [
                                    {
                                        "type": "while",
                                        "condition": "1",
                                        "data": [
                                            {
                                                "type": "choices",
                                                "text": "当前值：${core.getFragProperty('mf')}",
                                                "choices": [
                                                    {
                                                        "text": "+0.1",
                                                        "action": [
                                                            {
                                                                "type": "function",
                                                                "function": "function(){\ncore.setFragProperty('mf', core.getFragProperty('mf') + 0.1)\n}"
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "text": "-0.1",
                                                        "action": [
                                                            {
                                                                "type": "function",
                                                                "function": "function(){\ncore.setFragProperty('mf', core.getFragProperty('mf') - 0.1)\n}"
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "text": "返回",
                                                        "action": [
                                                            {
                                                                "type": "break",
                                                                "n": 1
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "text": "碎片旋转程度：${core.getFragProperty('mr')}",
                                "action": [
                                    {
                                        "type": "while",
                                        "condition": "1",
                                        "data": [
                                            {
                                                "type": "choices",
                                                "text": "当前值：${core.getFragProperty('mr')}",
                                                "choices": [
                                                    {
                                                        "text": "+0.1",
                                                        "action": [
                                                            {
                                                                "type": "function",
                                                                "function": "function(){\ncore.setFragProperty('mr', core.getFragProperty('mr') + 0.1)\n}"
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "text": "-0.1",
                                                        "action": [
                                                            {
                                                                "type": "function",
                                                                "function": "function(){\ncore.setFragProperty('mr', core.getFragProperty('mr') - 0.1)\n}"
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "text": "返回",
                                                        "action": [
                                                            {
                                                                "type": "break",
                                                                "n": 1
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "text": "返回",
                                "action": [
                                    {
                                        "type": "break",
                                        "n": 1
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "changeFloor": {
        "7,13": {
            "floorId": ":before",
            "stair": "upFloor"
        },
        "7,1": {
            "floorId": ":next",
            "stair": "downFloor"
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
    [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1],
    [  1,  0,  0,  0,  0,  0,  0, 87,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,201,202,203,204,205,206,207,208,209,210,211,212,213,  1],
    [  1,214,215,216,217,218,219,220,221,222,223,224,225,226,  1],
    [  1,227,228,229,230,231,232,233,234,235,236,237,238,239,  1],
    [  1,240,241,242,243,244,245,246,247,248,249,250,251,252,  1],
    [  1,253,254,255,256,259,260,265,266,267,268,269,270,271,  1],
    [  1,272,273,274,275,276,277,278,279,280,368,369,370,371,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0, 45,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,129,  0,  0, 88,  0, 94,129,  0,  0,  0,  1],
    [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1]
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