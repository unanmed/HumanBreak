main.floors.MT12=
{
    "floorId": "MT12",
    "title": "草原",
    "name": "12",
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
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {
        "7,1": [
            "\t[原始人]\b[down,hero]杰克？你怎么在这？",
            "\t[杰克,thief]\b[down,7,1]我刚刚出山洞，就发现了一堆怪物。",
            "\t[杰克,thief]\b[down,7,1]那些怪物冲着我就跑过来，我根本打不过他们。",
            "\t[杰克,thief]\b[down,7,1]我就跑到了这里。",
            "\t[杰克,thief]\b[down,7,1]多谢你救了我。",
            "\t[原始人]\b[down,hero]不用多谢了，咱都是兄弟的。",
            "\t[杰克,thief]\b[down,7,1]你来这里是要干什么？",
            "\t[原始人]\b[down,hero]（他好像没有注意到绿色结晶，就不要提这件事了吧）",
            "\t[原始人]\b[down,hero]我要上山砍一些柴火。",
            "\t[原始人]\b[down,hero]但是上山的路被强大的怪物堵死了，我根本上不去。",
            "\t[杰克,thief]\b[down,7,1]这样啊。",
            "\t[杰克,thief]\b[down,7,1]正好，我最近学会了一招，能让你避开那些怪物，我来教给你吧！",
            "获得技能：跳跃\n快捷键2，消耗200点生命值，困难消耗400点，一个地图只能使用3次\n如果前方为可通行的地面，则不能使用该技能\n如果前方为怪物，则将怪物移至勇士视线上第一个不能通行的方块后\n如果前方为障碍物，则直接跳到该障碍物的后方",
            "\t[原始人]\b[down,hero]多谢杰克兄弟了啊。",
            "\t[杰克,thief]\b[down,7,1]不过还是要小心山上的那些怪物，那些怪物都很强。",
            "\t[原始人]\b[down,hero]我明白，但是我必须上山，不然都要饿死冻死了。",
            "\t[杰克,thief]\b[down,7,1]那我就不打扰你了，咱们之后再见。",
            "去南方那个之前过不去的地方推进游戏剧情",
            "手机端可以点击右下角的难度来切换下方工具栏至数字键",
            {
                "type": "setValue",
                "name": "flag:skill2",
                "value": "true"
            },
            {
                "type": "hide",
                "remove": true
            }
        ],
        "7,9": [
            "把四个骷髅卫兵杀死开启机关门"
        ]
    },
    "changeFloor": {
        "7,14": {
            "floorId": "MT11",
            "loc": [
                7,
                0
            ]
        }
    },
    "afterBattle": {
        "1,1": [
            {
                "type": "setValue",
                "name": "flag:door_MT12_7_3",
                "operator": "+=",
                "value": "1"
            }
        ],
        "4,2": [
            {
                "type": "setValue",
                "name": "flag:door_MT12_7_3",
                "operator": "+=",
                "value": "1"
            }
        ],
        "10,2": [
            {
                "type": "setValue",
                "name": "flag:door_MT12_7_3",
                "operator": "+=",
                "value": "1"
            }
        ],
        "13,1": [
            {
                "type": "setValue",
                "name": "flag:door_MT12_7_3",
                "operator": "+=",
                "value": "1"
            }
        ]
    },
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {
        "7,3": {
            "0": {
                "condition": "flag:door_MT12_7_3==4",
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
                        "name": "flag:door_MT12_7_3",
                        "operator": "=",
                        "value": "null"
                    }
                ]
            }
        }
    },
    "cannotMove": {},
    "map": [
    [ 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    [ 20,210,  0, 29, 33, 20,381,123,381, 20, 33, 29,  0,210, 20],
    [ 20,  0, 20, 20,210, 20, 33,381, 33, 20,210, 20, 20,  0, 20],
    [ 20, 33, 20, 20, 20, 20, 20, 85, 20, 20, 20, 20, 20, 33, 20],
    [ 20, 27, 29,  0,369, 20,  0,373,  0, 20,369,  0, 29, 27, 20],
    [ 20, 20, 20, 20,  0, 20, 34, 20, 34, 20,  0, 20, 20, 20, 20],
    [ 20, 29,  0, 34,209,  0, 28, 20, 28,  0,209, 34,  0, 29, 20],
    [ 20, 20, 20,368, 20, 20, 20, 20, 20, 20, 20,368, 20, 20, 20],
    [ 20,  0,372,  0,  0, 20, 29, 20, 29, 20,  0,  0,372,  0, 20],
    [ 20,  0, 20,  0, 20, 20,  0,129,  0, 20, 20,  0, 20,  0, 20],
    [ 20, 34, 20, 27, 34,  0,248,  0,248,  0, 34, 27, 20, 34, 20],
    [ 20, 28, 20, 20, 20, 20, 20,248, 20, 20, 20, 20, 20, 28, 20],
    [ 20,  0, 20,  0, 34,  0,224,  0,224,  0, 34,  0, 20,  0, 20],
    [ 20,  0,276,  0, 29,  0, 20,  0, 20,  0, 29,  0,276,  0, 20],
    [ 20, 20, 20, 20, 20, 20, 20, 93, 20, 20, 20, 20, 20, 20, 20]
],
    "bgmap": [

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