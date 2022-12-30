main.floors.MT6=
{
    "floorId": "MT6",
    "title": "草原",
    "name": "6",
    "width": 15,
    "height": 15,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 1,
    "defaultGround": "grass",
    "bgm": "grass.mp3",
    "firstArrive": [
        {
            "type": "setCurtain",
            "time": 500
        },
        "\t[原始人]\b[down,hero]外面也有这些怪物吗。",
        "\t[原始人]\b[down,hero]看来上山会有很大的难度啊。",
        "\t[智慧结晶]\b[down,4,4]哦？看起来你需要一些帮助？",
        "\t[原始人]\b[down,hero]谁？谁在说话？",
        "\t[智慧结晶]\b[down,4,4]你往左边看看，那有一个绿色水晶，我就是那个绿色水晶。",
        {
            "type": "changePos",
            "direction": "right"
        },
        {
            "type": "sleep",
            "time": 300
        },
        {
            "type": "moveHero",
            "steps": [
                "right:1"
            ]
        },
        "\t[原始人]\b[down,hero]这东西会说话？",
        "\t[智慧结晶]\b[down,4,4]对呀对呀。",
        "\t[智慧结晶]\b[down,4,4]我叫智慧结晶，是专门来帮助你的。",
        "\t[原始人]\b[down,hero]帮助我？你这样怎么帮助我？",
        "\t[智慧结晶]\b[down,4,4]别着急，我先给你说一下我的来历。",
        "\t[智慧结晶]\b[down,4,4]未来的人类想要拯救他们自己的世界，但是无能为力，只好向历史出手。",
        "\t[智慧结晶]\b[down,4,4]于是他们便通过一些方法将我们传送到了这里，让我们来帮助你们。",
        "\t[智慧结晶]\b[down,4,4]这样历史便会改写，他们才有可能成功。",
        "\t[原始人]\b[down,hero]那你怎么帮助我呢？",
        "\t[智慧结晶]\b[down,4,4]很简单，我有很多智慧，你只需要把我放到手里，我就会消失。",
        "\t[智慧结晶]\b[down,4,4]我的智慧也会传递给你，你也就能变强了。",
        "\t[原始人]\b[down,hero]智慧？智慧有什么用？",
        "\t[智慧结晶]\b[down,hero]之后你就会知道的。",
        {
            "type": "function",
            "function": "function(){\ncore.getNextItem();\n}"
        },
        {
            "type": "sleep",
            "time": 300
        },
        "智慧涌入了原始人的大脑",
        "\t[原始人]\b[down,hero]这种感觉...",
        "\t[原始人]\b[down,hero]感觉好像可以学习一些简单的东西了。",
        {
            "type": "function",
            "function": "function(){\ncore.showChapter('第一章  勇气');\n}"
        },
        {
            "type": "setValue",
            "name": "flag:chapter",
            "value": "1"
        },
        {
            "type": "setValue",
            "name": "item:skill1",
            "value": "1"
        },
        {
            "type": "setValue",
            "name": "item:cross",
            "value": "1"
        }
    ],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "5,5": [
            "开启技能后当前技能会在地图名右方显示",
            "点开生命之泉技能后距离加生命回复剩余血瓶量会在生命回复上方显示"
        ],
        "2,3": [
            {
                "type": "changeFloor",
                "floorId": "MT5",
                "loc": [
                    14,
                    7
                ],
                "direction": "left"
            },
            {
                "type": "setGlobalValue",
                "name": "animateSpeed",
                "value": 277.7778
            }
        ]
    },
    "changeFloor": {
        "7,14": {
            "floorId": "MT7",
            "loc": [
                7,
                0
            ]
        },
        "14,7": {
            "floorId": "MT10",
            "loc": [
                0,
                7
            ]
        }
    },
    "afterBattle": {},
    "afterGetItem": {
        "4,4": [
            {
                "type": "sleep",
                "time": 1000
            },
            "\t[原始人]\b[down,hero].......",
            "\t[原始人]\b[down,hero]感觉一些很深奥的东西流入了大脑",
            "\t[原始人]\b[down,hero]果然可以提高我的智慧吗？",
            "\t[原始人]\b[down,hero]看来我可以利用这些智慧来干些事情了",
            "现在开启了智慧加点功能，该功能将会贯穿整个游戏，下面请仔细阅读玩法",
            "人生不能后悔，一旦加过点后，便再也没有办法悔掉，加点时请慎重选择",
            "很多技能都有多个等级，升级需要消耗更多智慧，但收益也会随之增多",
            "有一些技能为必点技能，这些技能会在说明中特别指出，请尽快早点点这些技能，否则可能会导致游戏无法进行",
            "你可以通过拾取绿宝石来获取智慧，拥有足够的智慧后请尽快加点",
            "合理分配技能是该塔的关键，所以请加点时慎重选择",
            "按J或者点击状态栏的技能树可以打开技能树",
            "祝您游戏愉快！",
            {
                "type": "openDoor",
                "loc": [
                    2,
                    10
                ]
            }
        ]
    },
    "afterOpenDoor": {},
    "autoEvent": {},
    "cannotMove": {},
    "map": [
    [30048,  0,  0,30050, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    [30056,30057,30057,30058,  0,  0, 29, 20, 32, 29,372,  0,276, 29, 20],
    [30064,30060,30118,30066,  0,  0,  0, 20, 29, 34, 20,  0, 20, 20, 20],
    [30072,30073,30126,30074,  0,  0, 32, 20, 20, 20, 20, 31,  0, 31, 20],
    [ 20,  0,  0,  0, 29,  0,  0, 20,  0,  0,204,  0, 31,  0, 20],
    [ 20,  0,  0,  0,  0,129, 29,267,  0,  0, 20,276, 20, 20, 20],
    [ 20,  0,  0,  0,  0,  0, 20, 20, 20, 29, 20,  0,  0,  0, 20],
    [30060,30112,30113,30114,30065,30066,  0, 34,  0,  0, 20, 29, 20,368, 94],
    [30073,30112,30113,30114,30073,30074, 20, 20, 20,209,  0, 34,  0,  0, 20],
    [ 20,30120,30121,30122, 20,  0,  0,276,  0,  0, 20,248, 20, 20, 20],
    [ 20, 20, 85, 20, 20, 20, 20, 32, 20, 32, 20, 32,  0, 32, 20],
    [ 20,  0,  0,  0, 20,  0, 20,  0, 20, 20, 20,  0, 29,  0, 20],
    [ 20,  0, 27,  0,214, 33,204, 29,224, 32,  0,368, 20, 20, 20],
    [ 20,  0,  0,  0, 20,  0, 20, 32, 20,  0, 20, 29,  0, 29, 20],
    [ 20, 20, 20, 20, 20, 20, 20, 93, 20, 20, 20, 20, 20, 20, 20]
],
    "bgmap": [
    [  0,  0,  0,  0,  0,30050,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,30050,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,30050,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,30050,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,30050,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,30050,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [30057,30104,30105,30106,30057,30058,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,30065,30065,30065,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,30073,30073,30073,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
],
    "fgmap": [

],
    "beforeBattle": {},
    "weather": [
        "sun",
        8
    ],
    "cannotMoveIn": {},
    "bg2map": [

],
    "fg2map": [

]
}