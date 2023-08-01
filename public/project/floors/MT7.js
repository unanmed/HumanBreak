main.floors.MT7=
{
    "floorId": "MT7",
    "title": "主塔 7 层",
    "name": "7",
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
        "10,1": [
            "除此之外，这个插件还允许你去对一个画布进行碎裂特效的操作。",
            "例如我可以让整张地图进行一次碎裂操作，下面请先看效果。",
            {
                "type": "function",
                "function": "function(){\n// 先把地图上的所有内容单独绘制到一张画布上\nconst ctx = core.createCanvas('frag', 0, 0, 480, 480, 0);\nObject.values(core.canvas).forEach(v => {\n\tctx.drawImage(v.canvas, 0, 0, 480, 480);\n});\n// 然后创建碎裂特效控制器\nconst ratio = core.domStyle.scale;\nconst manager = core.applyFragWith(ctx.canvas, 32 * ratio, 10000, { moveFlush: 0.2 });\n// 然后设置特效画布的css属性\nconst frag = manager.canvas;\nfrag.style.position = 'absolute';\nfrag.style.zIndex = '160';\nfrag.style.width = `${frag.width / devicePixelRatio}px`;\nfrag.style.height = `${frag.height / devicePixelRatio}px`;\nfrag.style.left = `${240 * ratio - frag.width / devicePixelRatio / 2}px`;\nfrag.style.top = `${240 * ratio - frag.height / devicePixelRatio / 2}px`;\n// 然后部署到样板上，并把样板原先的画布先暂时不显示\ncore.dom.gameDraw.appendChild(frag);\ncore.deleteCanvas('frag');\nObject.values(core.canvas).forEach(v => {\n\tv.canvas.style.display = 'none';\n});\n// 特效执行完毕后得把画布删了，同时让画布显示出来\nmanager.onEnd.then(() => {\n\tfrag.remove();\n\tObject.values(core.canvas).forEach(v => {\n\t\tv.canvas.style.display = 'block';\n\t});\n});\n}"
            },
            {
                "type": "sleep",
                "time": 10000
            },
            "它的代码如下，比较长，可以自己琢磨一下，不懂的可以在造塔群问",
            "// 先把地图上的所有内容单独绘制到一张画布上\nconst ctx = core.createCanvas('frag', 0, 0, 480, 480, 0);\nObject.values(core.canvas).forEach(v => {\n\tctx.drawImage(v.canvas, 0, 0, 480, 480);\n});\n// 然后创建碎裂特效控制器\nconst ratio = core.domStyle.scale;\nconst manager = core.applyFragWith(ctx.canvas, 32 * ratio, 10000, { moveFlush: 0.2 });\n// 然后设置特效画布的css属性\nconst frag = manager.canvas;\nfrag.style.position = 'absolute';\nfrag.style.zIndex = '160';\nfrag.style.width = frag.width / devicePixelRatio + 'px';\nfrag.style.height = frag.height / devicePixelRatio + 'px';\n// 后面还有一页",
            "frag.style.left = 240 * ratio - frag.width / devicePixelRatio / 2 + 'px';\nfrag.style.top = 240 * ratio - frag.height / devicePixelRatio / 2 + 'px';\n// 然后部署到样板上，并把样板原先的画布先暂时不显示\ncore.dom.gameDraw.appendChild(frag);\ncore.deleteCanvas('frag');\nObject.values(core.canvas).forEach(v => {\n\tv.canvas.style.display = 'none';\n});\n// 特效执行完毕后得把画布删了，同时让画布显示出来\nmanager.onEnd.then(() => {\n\tfrag.remove();\n\tObject.values(core.canvas).forEach(v => {\n\t\tv.canvas.style.display = 'block';\n\t});\n});"
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
    [  1,  0,  0,  0,  0,  0,  0, 88,  0,  0,129,  0,  0,  0,  1],
    [  1,  0,201, 27,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,201,  0,  0,203,203, 45, 45, 45,  0,  0,  0,  0,  1],
    [  1,  0,201,492,492,492,203,  0,  0,  0,  0,276,  0,  0,  1],
    [  1,  0,201,  0,467,467,203,467,467,  0,276,276,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,376,  0,  0,276,  0,  0,  0,  1],
    [  1,  0,  0,  0,420,420,420,  0,  0,  0,  0,482,482,482,  1],
    [  1, 93, 93, 93,  0, 29,  0,  0,482,271,  0,381,381,  0,  1],
    [  1,  0,  0,  0,  0,  0,206,206,482,271,  0,381,  0,  0,  1],
    [  1,  0,218,218,  0,  0,206,203,  0,271,271,  0,  0,  0,  1],
    [  1,  0,  0,218,218,  0,206,  0,471,471,  0,494,494,  0,  1],
    [  1,  0,  0,  0,218,218,  0,  0,  0,471,  0,  0,494,  0,  1],
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