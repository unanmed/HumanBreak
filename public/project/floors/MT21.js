main.floors.MT21=
{
    "floorId": "MT21",
    "title": "勇气之路",
    "name": "21",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 2,
    "defaultGround": "grass",
    "bgm": "plot1.mp3",
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "14,8": [
            {
                "type": "if",
                "condition": "(flag:chapter===1)",
                "true": [
                    {
                        "type": "confirm",
                        "text": "是否提交第一章成绩？\n提交将结束游戏，结算第一章成绩，否则将继续第二章",
                        "yes": [
                            "计分方式：生命+黄*5000+蓝*15000",
                            {
                                "type": "setValue",
                                "name": "status:hp",
                                "operator": "+=",
                                "value": "item:yellowKey*5000+item:blueKey*15000"
                            },
                            {
                                "type": "win",
                                "reason": "智慧之始-new"
                            },
                            {
                                "type": "exit"
                            }
                        ],
                        "no": []
                    },
                    {
                        "type": "setCurtain",
                        "color": [
                            0,
                            0,
                            0,
                            1
                        ],
                        "time": 1500,
                        "keep": true
                    },
                    {
                        "type": "setText",
                        "text": [
                            0,
                            0,
                            0,
                            1
                        ],
                        "background": "winskin3.png"
                    },
                    "人类简史——起源篇",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    "他踏出了寻找智慧的第一步。",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    "他所练就的勇气，也成为他寻找智慧路上的一大利器。",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    "人类简史——起源篇，完。",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    {
                        "type": "setValue",
                        "name": "flag:chapter",
                        "value": "2"
                    },
                    {
                        "type": "sleep",
                        "time": 1000
                    },
                    "人类简史——进化篇",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    "或许，他真的不理解智慧。",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    "或许，他已经理解了一些。",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    "但这不重要。",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    "他的轨迹已经注定了他对未来的影响。",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    "这个世界，甚至这个宇宙，都因为他的存在而改变。",
                    {
                        "type": "playSound",
                        "name": "paper.mp3"
                    },
                    "在这里，智慧小径，将是他智慧的飞跃点。",
                    {
                        "type": "changeFloor",
                        "floorId": "MT22",
                        "loc": [
                            0,
                            8
                        ]
                    },
                    {
                        "type": "setCurtain",
                        "time": 1000
                    },
                    {
                        "type": "setText",
                        "text": [
                            255,
                            255,
                            255,
                            1
                        ],
                        "background": "winskin2.png"
                    },
                    "\t[低级智人]\b[up,hero]智慧吗...",
                    "\t[低级智人]\b[up,hero]智慧又是什么呢？",
                    "\t[低级智人]\b[up,hero]智慧之神说它可以掌控万物，真的这么神奇吗...",
                    "\t[低级智人]\b[up,hero]完全摸不到头脑。",
                    "\t[低级智人]\b[up,hero]或许智慧结晶会告诉我答案吧。",
                    {
                        "type": "function",
                        "function": "function(){\nMota.require('var', 'fixedUi').open('chapter', { chapter: '第二章  智慧' });\nMota.Plugin.require('removeMap_g').removeMaps('tower1', 'tower7', true);\ndelete flags.tower1;\ndelete flags.wordsTimeOut;\ndelete flags.boom;\ndelete flags.booming;\n}"
                    },
                    {
                        "type": "setValue",
                        "name": "item:pickaxe",
                        "value": "0"
                    }
                ],
                "false": [
                    {
                        "type": "changeFloor",
                        "floorId": "MT22",
                        "loc": [
                            0,
                            8
                        ]
                    }
                ]
            }
        ]
    },
    "changeFloor": {
        "0,6": {
            "floorId": "MT19",
            "loc": [
                14,
                6
            ]
        }
    },
    "afterBattle": {},
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {},
    "cannotMove": {},
    "map": [
    [142,142,142,142,142,142,142,142,142,142,142,142,142,142,142],
    [142,142,142,142,142,142,142,142,142,487,142,142,142,142,142],
    [142,142,142,487,494,378,  0,142,378,494,142,142,142,142,142],
    [142,142,142,142,142,142,520, 33,518,142,142,  0,  0,142,142],
    [142,142,142,142, 33,376,  0,142,381,  0, 33,376,  0,142,142],
    [142,142,378,142,  0,142,142,142,142,142,142,142,545,142,142],
    [ 92,  0, 33,142,142,142,487,142,  0,381, 33,  0,  0,  0,142],
    [143,518,142,142,  0, 33,494,142,143,143,143,520,143,143,142],
    [143,  0, 33,376,545,381,  0,520,  0,143,  0,  0,143,  0, 94],
    [143,143,143,143,143,  0,143,  0,376,143,  0,545,  0,378,143],
    [143,  0, 33,  0,518,  0,143,  0,  0,519, 33,143, 33,  0,143],
    [143,143,143,143,381,143,143,143, 33,143,376,143,143,143,143],
    [143,143,  0, 33,545,  0,378,143,  0,143,381,  0,  0,143,143],
    [143,143,143,378,143, 33,  0,519,  0,143,  0,143,143,143,143],
    [143,143,143,143,143,143,143,143,143,143,143,143,143,143,143]
],
    "beforeBattle": {},
    "bgmap": [

],
    "fgmap": [

],
    "bg2map": [

],
    "fg2map": [

],
    "cannotMoveIn": {}
}