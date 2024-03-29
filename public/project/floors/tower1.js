main.floors.tower1=
{
    "floorId": "tower1",
    "title": "智慧之塔",
    "name": "1",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 2,
    "defaultGround": "T526",
    "bgm": "tower.mp3",
    "firstArrive": [
        "\t[野蛮人]\b[up,hero]这里，便是智慧之塔了",
        "注意破墙镐在本区结束后会全部删除，请在本区域全部用完"
    ],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "7,9": [
            {
                "type": "if",
                "condition": "(flag:tower1===true)",
                "true": [
                    {
                        "type": "choices",
                        "text": "\t[智慧精灵,N532]有什么想问的？",
                        "choices": [
                            {
                                "text": "这座塔为什么会出现在这里？",
                                "action": [
                                    "\t[智慧精灵,N532]\b[up,7,9]说实话，我也不知道",
                                    "\t[智慧精灵,N532]\b[up,7,9]这是上级的绝密情报，只有登上塔顶者才有权利知晓",
                                    "\t[野蛮人]\b[up,hero]那你去塔顶不是随随便便的事吗，为啥你不知道",
                                    {
                                        "type": "animate",
                                        "name": "angry",
                                        "loc": [
                                            7,
                                            9
                                        ]
                                    },
                                    "\t[智慧精灵,N532]\b[up,7,9]哼！人家只是一个助手啦，又不是什么挑战者",
                                    {
                                        "type": "animate",
                                        "name": "sweat",
                                        "loc": "hero"
                                    }
                                ]
                            },
                            {
                                "text": "这座塔为什么叫做智慧之塔？",
                                "action": [
                                    "\t[智慧精灵,N532]\b[up,7,9]为啥你老是问人家不会回答的问题啊！QAQ"
                                ]
                            },
                            {
                                "text": "这座塔里面的怪物有多强？",
                                "action": [
                                    "\t[智慧精灵,N532]\b[up,7,9]这个嘛...",
                                    "\t[智慧精灵,N532]\b[up,7,9]根据你进入塔时的实力不同，怪物强度也会不同",
                                    "\t[智慧精灵,N532]\b[up,7,9]玩家千万不要认为进塔的时候能力越低怪物越弱，这个塔里面的怪物属性是确定的",
                                    "\t[野蛮人]\b[up,hero]玩家？玩家是啥？",
                                    "\t[智慧精灵,N532]\b[up,7,9]就是坐在电脑前面或躺在被窝里面看手机的地球人",
                                    "\t[野蛮人]\b[up,hero]？？？？？？"
                                ]
                            },
                            {
                                "text": "这座塔有几层？",
                                "action": [
                                    "\t[智慧精灵,N532]\b[up,7,9]6层",
                                    {
                                        "type": "sleep",
                                        "time": 500
                                    },
                                    "\t[野蛮人]\b[up,hero]没了？",
                                    "\t[智慧精灵,N532]\b[up,7,9]你还想让我回答啥？这不是你的问题吗",
                                    {
                                        "type": "animate",
                                        "name": "fret",
                                        "loc": "hero"
                                    }
                                ]
                            },
                            {
                                "text": "为啥我会在外面见到很多与智慧有关的东西？",
                                "action": [
                                    "\t[智慧精灵,N532]\b[up,7,9]因为未来的人类想要拯救过去的人类",
                                    "\t[野蛮人]\b[up,hero]？？？？？"
                                ]
                            }
                        ]
                    }
                ],
                "false": [
                    "\t[智慧精灵,N532]\b[up,7,9]你好呀，我是智慧之塔的小助手，智慧精灵",
                    "\t[野蛮人（内心）]\b[up,hero]卧槽，这塔里面怎么还有这玩意",
                    "\t[智慧精灵,N532]\b[up,7,9]只要你有什么问题都可以问我哟，我会尽力想你解答",
                    "\t[野蛮人]\b[up,hero]啊这，你为啥会在塔里面啊",
                    "\t[智慧精灵,N532]\b[up,7,9]我一生下来就在塔里，被赋予助手的职位",
                    "\t[野蛮人]\b[up,hero]那你就一直当助手吗？",
                    "\t[智慧精灵,N532]\b[up,7,9]对呀，在这里面还能和帅气的哥哥一起玩，天天都特别开心",
                    {
                        "type": "animate",
                        "name": "sweat",
                        "loc": "hero"
                    },
                    "\t[智慧精灵,N532]\b[up,7,9]嗨呀，不说了，不知不觉说这么多没用的东西",
                    "\t[智慧精灵,N532]\b[up,7,9]赶紧的，有什么问题赶紧问，问完我还要去玩呢！",
                    "\t[智慧精灵,N532]\b[up,7,9]另外提醒一句，这里面不能用你的2技能哟（我是怎么知道他的2技能的）塔里面按2键可以使用破墙镐",
                    {
                        "type": "setValue",
                        "name": "flag:tower1",
                        "value": "true"
                    },
                    "\t[智慧精灵,N532]\b[up,7,9]什么？你让我让一下？",
                    "\t[智慧精灵,N532]\b[up,7,9]不行！我的职责就是站在这个地方！"
                ]
            }
        ],
        "6,6": [
            {
                "type": "jumpHero",
                "dxy": [
                    2,
                    0
                ],
                "time": 500
            }
        ],
        "8,6": [
            {
                "type": "jumpHero",
                "dxy": [
                    -2,
                    0
                ],
                "time": 500
            }
        ],
        "7,14": [
            {
                "type": "changeFloor",
                "floorId": "MT20",
                "loc": [
                    7,
                    8
                ]
            }
        ]
    },
    "afterBattle": {},
    "afterGetItem": {
        "12,3": [
            "你需要按Q或双击道具栏打开装备栏后装备上该装备才行"
        ]
    },
    "afterOpenDoor": {},
    "autoEvent": {},
    "cannotMove": {},
    "map": [
    [527,527,527,527,527,527,527,527,527,527,527,527,527,527,527],
    [527, 32,381,381,381,492,  0, 87,  0,492,  0,484,528,  0,527],
    [527,528,492,528,546,528,528,536,528,528,  0,  0,548, 29,527],
    [527, 32,381,537,  0, 32,550,  0, 21,  0, 29,  0, 35,  0,527],
    [527,494,528,381,528,550,528,528,528,528,528,549,378,484,527],
    [527,484,547,  0,492,  0,  0, 27,381,  0,  0,  0,484, 29,527],
    [527,390,482,  0,536, 28, 94,544, 92, 29,482, 29,547,  0,527],
    [541,441,381,530,530,530,530, 27,530,530,530,530,403,  0,542],
    [527,396,  0,376,  0,381,  0,482,528, 21, 32,  0,403,548,527],
    [527,528,546,  0,528,528,492,532,528,537,528,528,530,  0,527],
    [527,484,  0,530,376, 33,549, 33,492, 27, 33,544,  0,381,527],
    [527,  0,  0,544, 33,381,492, 33,536, 33,381,492, 28,484,527],
    [527,537,  0,381,528,527,527,497,527,527,  0,528,528,528,527],
    [527,  0, 28,  0,482,527, 47,  0, 47,527,537,  0, 32,  0,527],
    [527,527,527,527,527,527,527, 93,527,527,527,527,527,527,527]
],
    "beforeBattle": {},
    "bgmap": [
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,316,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,314,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,314,  0,  0],
    [  0,  0,306,312,312,312,317,  0,318,312,312,312,303,  0,  0],
    [  0,  0,314,  0,  0,  0,  0,  0,  0,  0,  0,  0,314,  0,  0],
    [  0,  0,302,309,  0,  0,  0,  0,  0,  0,  0,  0,315,  0,  0],
    [  0,  0,302,307,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,314,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,531,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
],
    "fgmap": [

],
    "bg2map": [
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,529,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,529,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,529,  0,  0],
    [  0,  0,529,529,529,529,529,  0,529,529,529,529,529,  0,  0],
    [  0,  0,529,  0,  0,  0,  0,  0,  0,  0,  0,  0,529,  0,  0],
    [  0,  0,529,529,  0,  0,  0,  0,  0,  0,  0,  0,529,  0,  0],
    [  0,  0,529,529,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,529,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
],
    "fg2map": [

],
    "cannotMoveIn": {},
    "changeFloor": {
        "0,7": {
            "floorId": "tower6",
            "loc": [
                24,
                58
            ]
        },
        "14,7": {
            "floorId": "tower6",
            "loc": [
                12,
                58
            ]
        },
        "7,1": {
            "floorId": "tower2",
            "loc": [
                7,
                1
            ]
        }
    }
}