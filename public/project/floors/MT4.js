main.floors.MT4=
{
    "floorId": "MT4",
    "title": "点光源-4",
    "name": "4",
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
        "9,13": [
            "这一层将会展示过渡(transitionLight)的用法。",
            "过渡是一种特殊的动画，它允许你在修改光源属性之后自动执行一个动画使得参数渐变为目标值。",
            "当你使用transitionLight之后，对应的属性便会被标记为过渡属性，之后便不能更改过渡的时间与方式(之后会考虑修改未可以更改)，也不能取消过渡，不能使用animateLight来改变对应的值。",
            "也就是说，transitionLight需要一个初始化，例如，当你查看这个木牌之后，上面的光源便会完成初始化，改变属性才会有动画效果，不然上面的光源只会瞬移。",
            "初始化的代码如下：\nconst { hyper } = core.plugin.animate;\nconst { transitionLight } = core.plugin.shadow;\ntransitionLight('mt4_1', 'x', 400, hyper('sin', 'out'));",
            {
                "type": "function",
                "function": "function(){\nconst { hyper } = core.plugin.ani;\nconst { transitionLight } = core.plugin.shadow;\ntransitionLight('mt4_1', 'x', 400, hyper('sin', 'out'));\n}"
            }
        ],
        "1,8": [
            "这里的按钮允许你左右移动上面的光源，时间为0.3秒，速率曲线为双曲余弦，方式为由快变慢。",
            "代码为：\nconst { getLight, setLight } = core.plugin.shadow;\nconst light = getLight('mt4_1');\nsetLight('mt4_1', { x: light.x + 50});",
            {
                "type": "while",
                "condition": "1",
                "data": [
                    {
                        "type": "choices",
                        "text": "更改光源横坐标",
                        "choices": [
                            {
                                "text": "+50",
                                "action": [
                                    {
                                        "type": "function",
                                        "function": "function(){\nconst { getLight, setLight } = core.plugin.shadow;\nconst light = getLight('mt4_1');\nsetLight('mt4_1', { x: light.x + 50 });\n}"
                                    }
                                ]
                            },
                            {
                                "text": "-50",
                                "action": [
                                    {
                                        "type": "function",
                                        "function": "function(){\nconst { getLight, setLight } = core.plugin.shadow;\nconst light = getLight('mt4_1');\nsetLight('mt4_1', { x: light.x - 50 });\n}"
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
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  1,  0,  1,  0,  1,  0,  1,  0,  1,  0,  1,  0,  1,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,129,  1,  0,  1,  0,  1,  0,  1,  0,  1,  0,  1,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0, 88,  0,129,  0,  0,  0,  0,  1],
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