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
    [141,141,141,141,  0,  0,  0,141,  0,  0,  0,141, 33, 33,20040],
    [141, 34, 34,141,  0,141,  0,  0,  0,141,  0,494,482,482,20040],
    [141, 33, 33,492,  0,141,  0,  0,  0,141,  0,141, 33, 33,20040],
    [141, 34, 34,141,  0,141,  0,  0,  0,141,  0,141,141,141,20040],
    [141,141,141,141,  0,129,558, 46,322,129,  0,141, 33, 33,20040],
    [141, 33, 33,141,  0,141,367,  0,129,141,  0,494,482,482,20040],
    [141, 33, 33,492,  0,141,129,  0,129,141,  0,141, 33, 33,20040],
    [141,141,141,141,141,141,141,141,141,141,141,141,141,141,20040]
],
    "firstArrive": [
        "\t[原始人]\b[up,hero]家里柴火不够了，今天又要去砍柴了啊",
        "\t[原始人]\b[up,hero]最好还能带点食物回来",
        "\t[原始人]\b[up,hero]希望不要遇到什么凶猛的动物吧",
        "\t[原始人]\b[up,hero]......",
        "\t[原始人]\b[up,hero]家里面那些奇怪的石头还是没办法移走",
        "\t[原始人]\b[up,hero]之后再想办法吧",
        "请耐心等待字体加载完成，否则很多地方显示会很奇怪，大概需要十秒，过一段时间打开任意界面再关闭即可",
        {
            "type": "function",
            "function": "function(){\ncore.displayChapter(0);\n}"
        }
    ],
    "parallelDo": "",
    "events": {
        "6,12": [
            "\t[原始人]\b[up,hero]出去找些柴火"
        ],
        "8,13": [
            "对状态栏的说明",
            "PC端：\n从上到下依次是楼层名、境界名、生命（右方为每回合生命回复）、攻击（右方为额外攻击）、防御、智慧、金币、距离升级剩余经验、三色钥匙",
            "手机端：\n最左边一列为生命、生命（右方为每回合生命回复）、攻击（右方为额外攻击）\n第二列为智慧、金币、距离升级剩余经验\n第三列为三色钥匙、楼层名、等级名"
        ],
        "6,13": [
            "你可以在初始赠送的系统设置里面修改一些设置\n带地图的楼传开启时，如果是手机玩家，请尽量使用2D绘图模式而不是3D，因为3D绘图比较耗能，该功能可以有效解决找不到路的问题\n你也可以用定点查看代替怪物手册，对性能消耗较低，更加流畅",
            "打开小地图时，小地图会在右上角显示，可随意开启或关闭，打开时，点击小地图可以进入大地图模式，大地图模式下可以按W或点击相应位置开启区域地图模式（比较耗性能，因为是绘制整个区域的地图，而不是6格以内的地图）\n楼传界面中可以按PgUp和PgDn来上楼或下楼，上下左右移动地图\n在地图界面中用紫色标记的地图为目前可以到达（即去到了临近的地图）却没有到达的地图，可以防止找不到路",
            "注意，小地图和平面楼传只能浏览和传送当前区域的地图，非当前区域可能无法浏览和传送",
            "你面前的三个道具比较重要，请充分利用"
        ],
        "8,12": [
            "该塔计分方式：生命+5000*黄钥匙+15000*蓝钥匙"
        ],
        "9,11": [
            "对怪物手册的说明：\n1.该塔可以显示未破防时的临界显伤，如果减伤项为黄色且有->标识，说明改临界是在当前未破防的情况下算得的，比如  临界 10    减伤 \r[#ffd700] ->1000\r[]  说明再加10点攻击破防，破防后伤害为1000"
        ],
        "5,11": [
            "原声音乐可以在网易云音乐搜索：魔塔 人类：开天辟地 bgm，部分音乐因为版权问题可能无法播放或者不在歌单内"
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
        "7,11": [
            {
                "type": "setValue",
                "name": "flag:usePlatFly",
                "value": "true"
            },
            {
                "type": "setValue",
                "name": "flag:__useMinimap__",
                "value": "true"
            }
        ],
        "6,11": [
            "这个可以查看bgm，也可以设置bgm，也可以清空设置的bgm"
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