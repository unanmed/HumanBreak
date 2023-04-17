main.floors.MT3=
{
    "floorId": "MT3",
    "title": "点光源-3",
    "name": "3",
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
        "5,1": [
            "本层将展示点光源的高级用法，包括动画改变属性与移动光源。"
        ],
        "3,3": [
            "这里可以动画更改你面前的光源的最大半径，动画时间为1s，速率曲线为双曲余弦函数，方式为慢-快-慢",
            {
                "type": "while",
                "condition": "1",
                "data": [
                    {
                        "type": "choices",
                        "text": "更改光源半径",
                        "choices": [
                            {
                                "text": "+50",
                                "action": [
                                    {
                                        "type": "function",
                                        "function": "function(){\nconst { hyper } = core.plugin.ani;\nconst light = core.getLight('mt3_1');\ncore.animateLight('mt3_1', 'r', light.r + 50, 1000, hyper('sin', 'in-out'));\n}"
                                    }
                                ]
                            },
                            {
                                "text": "-50",
                                "action": [
                                    {
                                        "type": "function",
                                        "function": "function(){\nconst { hyper } = core.plugin.ani;\nconst light = core.getLight('mt3_1');\nconst to = light.r - 50;\ncore.animateLight('mt3_1', 'r', to < 0 ? 0 : to, 1000, hyper('sin', 'in-out'));\n}"
                                    }
                                ]
                            },
                            {
                                "text": "退出",
                                "action": [
                                    {
                                        "type": "exit"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        "4,4": [
            "这里的代码使用的是animateLight函数，用起来比较复杂，在下一层会使用更为简单的方式来实现这一操作。",
            "这里的代码如下：\nconst { hyper } = core.plugin.animate;\nconst { animateLight, getLight } = core.plugin.shadow;\nconst light = getLight('mt3_1');\nanimateLight('mt3_1', 'r', light.r + 50, 1000, hyper('sin', 'in-out'));"
        ],
        "11,3": [
            "这里可以动画更改你面前的光源的衰减开始半径，动画时间为1s，速率曲线为双曲余弦函数，方式为慢-快-慢",
            {
                "type": "while",
                "condition": "1",
                "data": [
                    {
                        "type": "choices",
                        "text": "更改光源衰减开始半径",
                        "choices": [
                            {
                                "text": "+50",
                                "action": [
                                    {
                                        "type": "function",
                                        "function": "function(){\nconst { hyper } = core.plugin.ani;\nconst light = core.getLight('mt3_2');\ncore.animateLight('mt3_2', 'decay', light.decay + 50, 1000, hyper('sin', 'in-out'));\n}"
                                    }
                                ]
                            },
                            {
                                "text": "-50",
                                "action": [
                                    {
                                        "type": "function",
                                        "function": "function(){\nconst { hyper } = core.plugin.ani;\nconst light = core.getLight('mt3_2');\nconst to = light.decay - 50;\ncore.animateLight('mt3_2', 'decay', to < 0 ? 0 : to, 1000, hyper('sin', 'in-out'));\n}"
                                    }
                                ]
                            },
                            {
                                "text": "退出",
                                "action": [
                                    {
                                        "type": "exit"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        "10,4": [
            "这里的代码使用的是animateLight函数，用起来比较复杂，在下一层会使用更为简单的方式来实现这一操作。",
            "这里的代码如下：\nconst { hyper } = core.plugin.animate;\nconst light = core.getLight('mt3_2');\ncore.animateLight('mt3_2', 'decay', light.decay + 50, 1000, hyper('sin', 'in-out'));"
        ],
        "2,7": [
            "下面是一个移动光源的实例，触发这里将会把光源移动到右边，时间为3秒钟，使用的速率函数为4次幂函数，方式为慢-快-慢",
            "代码为：\nconst { power } = core.plugin.ani;\nconst { moveLight } = core.plugin.shadow;\nmoveLight('mt3_3', 400, 272, 3000, power(4, 'in-out'));",
            {
                "type": "function",
                "function": "function(){\nconst { power } = core.plugin.ani;\nconst { moveLight } = core.plugin.shadow;\nmoveLight('mt3_3', 400, 272, 3000, power(4, 'in-out'));\n}"
            }
        ],
        "12,7": [
            "触发这里将会把光源移动到左边。",
            "代码为：\nconst { power } = core.plugin.ani;\nconst { moveLight } = core.plugin.shadow;\nmoveLight('mt3_3', 80, 272, 3000, power(4, 'in-out'));",
            {
                "type": "function",
                "function": "function(){\nconst { power } = core.plugin.ani;\nconst { moveLight } = core.plugin.shadow;\nmoveLight('mt3_3', 80, 272, 3000, power(4, 'in-out'));\n}"
            }
        ]
    },
    "changeFloor": {
        "7,1": {
            "floorId": ":before",
            "stair": "upFloor"
        },
        "7,13": {
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
    [  1,  0,  0,  0,  0,129,  0, 88,  0,  1,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  1,  0,  0,  0,  1,  0,  0,  0,  0,  1],
    [  1,  1,  1,129,  1,  1,  0,  0,  0,  1,  1,129,  1,  1,  1],
    [  1,  0,  0,  0,129,  0,  0,  0,  0,  0,129,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  1,129,  1,  0,  1,  0,  1,  0,  1,  0,  1,129,  1,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  1,  0,  1,  0,  1,  0,  1,  0,  1,  0,  1,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0, 87,  0,  0,  0,  0,  0,  0,  1],
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