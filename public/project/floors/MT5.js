main.floors.MT5=
{
    "floorId": "MT5",
    "title": "点光源-5",
    "name": "5",
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
        "7,7": [
            "这里是点光源教学的最后一层，这里将会展示点光源的一个非常强大的功能-moveLightAs。这个函数允许你以一个路径来移动一个光源。",
            "例如本层，光源便会以一个圆形轨迹进行移动，移动的完成度是一个4次幂函数。",
            "圆的半径为96，旋转1圈，圆心为(240,240)，动画时间为3秒钟。",
            "移动的代码为：\nconst { circle, power } = core.plugin.ani;\nconst { moveLightAs } = core.plugin.shadow;\nmoveLightAs('mt5_1', 3000, circle(96, 1, [240, 240]), power(4, 'in-out'), false);",
            "下面光源将会进行移动。",
            {
                "type": "function",
                "function": "function(){\nconst { circle, power } = core.plugin.ani;\nconst { moveLightAs } = core.plugin.shadow;\nmoveLightAs('mt5_1', 3000, circle(96, 1, [240, 240]), power(4, 'in-out'), false);\n}"
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
    [  1,  0,  0,  0,  0,  0,  0, 88,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  1,  0,  0,  0,  1,  0,  0,  0,  1,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  1,  0,  0,  1,  0,  1,  0,  0,  1,  0,  0,  1],
    [  1,  0,  0,  1,  0,  0,  0,129,  0,  0,  0,  1,  0,  0,  1],
    [  1,  0,  0,  1,  0,  0,  1,  0,  1,  0,  0,  1,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  1,  0,  0,  0,  1,  0,  0,  0,  1,  0,  0,  1],
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