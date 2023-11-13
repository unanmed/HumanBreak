main.floors.MT0=
{
    "floorId": "MT0",
    "title": "洞穴",
    "name": "0",
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "defaultGround": "T331",
    "images": [],
    "ratio": 1,
    "map": [
    [20049,20049,20049,20049,20049,20049,20050, 91,20048,20049,20049,20049,20049,20049,20043],
    [20057,20057,20057,20057,20057,20057,20058,  0,20056,20057,20057,20057,20057,20057,20040],
    [20065,20065,20065,20065,20065,20065,20074,  0,20064,20065,20065,20065,20065,20065,20040],
    [141,141,141,141,  0,  0,  0,  0,  0,  0,  0,141, 33, 33,20040],
    [141, 34, 34,141,  0,141,  0,  0,  0,141,  0,494,482,482,20040],
    [141, 33, 33,492,  0,141,  0,  0,  0,141,  0,141, 33, 33,20040],
    [141, 34, 34,141,  0,141,  0,  0,  0,141,  0,141,141,141,20040],
    [141,141,141,141, 92,  0,  0,141,  0,  0,  0,141, 33, 33,20040],
    [141, 34, 34,141,  0,141,  0,  0,  0,141,  0,494,482,482,20040],
    [141, 33, 33,492,  0,141,  0,642,  0,141,  0,141, 33, 33,20040],
    [141, 34, 34,141,  0,141, 45,559, 46,141,  0,141,141,141,20040],
    [141,141,141,141,  0,  0,558,  0,560,  0,  0,141, 33, 33,20040],
    [141, 33, 33,141,  0,141,367,  0,129,141,  0,494,482,482,20040],
    [141, 33, 33,492,  0,141,129,  0,129,141,  0,141, 33, 33,20040],
    [141,141,141,141,141,141,141,141,141,141,141,141,141,141,20040]
],
    "firstArrive": [
        "\t[原始人]\b[up,hero]家里有没有柴火了，看来需要上山砍柴了啊。",
        "\t[原始人]\b[up,hero]刚刚经历过山火，山上的柴火也不多了。",
        "\t[原始人]\b[up,hero]为什么这么倒霉的事会摊在我头上。",
        "\t[原始人]\b[up,hero]哎，不管了，先出去看看再说。",
        "\r[red]注意！！！\r[]该塔新增了很多新的功能，同时对样板的ui进行了大幅度的改动，操作也有改变，由于内容过多，这里不再一一描述，具体请在道具栏查看百科全书！！百科全书是在你面前的几个道具中的其中一个",
        {
            "type": "function",
            "function": "function(){\nmota.ui.fixed.open('chapter', { chapter: '序章  起源' });\n}"
        }
    ],
    "parallelDo": "",
    "events": {
        "6,12": [
            "\t[原始人]\b[up,hero]出去找些柴火"
        ],
        "8,13": [
            "本塔有很多新的功能，所有的说明都详细地写在了前方的百科全书里面，里面包含所有的功能说明，不阅读可能会影响正常的游戏体验，请仔细阅读。",
            "例如你现在首先感受到的应该是状态栏的变动，你可以打开百科全书阅读状态栏相关内容。里面包含状态栏的功能说明与布局说明等。",
            "注意百科全书中的内容非常基础详细，如果对魔塔有一定的了解，可以选择性地阅读。",
            "打开百科全书的快捷键是H",
            "特别提醒：本游戏没有考虑录像的二次播放性，因此如果你播放录像之后继续游玩，最后可能会导致提交成绩后红录像。"
        ],
        "8,12": [
            "第一章计分方式：生命+5000*黄钥匙+15000*蓝钥匙"
        ],
        "6,13": [
            "原声音乐可以在网易云音乐搜索：魔塔 人类：开天辟地 bgm，部分音乐因为版权问题可能无法播放或者不在歌单内"
        ],
        "3,7": [
            "这里允许你跳转到第二章。如果你没玩过第一章，那么建议自己游玩，如果玩过却又不想再打一遍，可以由此跳转",
            {
                "type": "confirm",
                "text": "是否跳转到第二章？",
                "yes": [
                    {
                        "type": "function",
                        "function": "function(){\ncore.swapChapter(2, flags.hard);\n}"
                    }
                ],
                "no": []
            }
        ]
    },
    "changeFloor": {
        "7,0": {
            "floorId": "MT1",
            "loc": [
                7,
                14
            ]
        }
    },
    "afterBattle": {},
    "afterGetItem": {
        "6,11": [
            "这个可以查看bgm，也可以设置bgm，也可以清空设置的bgm"
        ],
        "8,11": [
            "请仔细阅读这个道具内的说明"
        ],
        "7,10": [
            "里面包含了所有游戏的设置，请仔细查看设置"
        ]
    },
    "afterOpenDoor": {},
    "cannotMove": {},
    "bgmap": [

],
    "fgmap": [

],
    "width": 15,
    "height": 15,
    "autoEvent": {},
    "bgm": "cave.mp3",
    "beforeBattle": {},
    "bg2map": [

],
    "fg2map": [

],
    "cannotMoveIn": {}
}