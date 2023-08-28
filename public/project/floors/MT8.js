main.floors.MT8=
{
    "floorId": "MT8",
    "title": "主塔 8 层",
    "name": "8",
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
        "10,13": [
            "从本层开始将进入着色器特效插件的教学。",
            "着色器特效插件是一个通用型特效插件，允许你使用gpu进行特效渲染，效果好，同时性能表现也好。",
            "插件的核心是片元着色器，接下来的几层也将以片元着色器为核心进行教学。"
        ],
        "4,13": [
            "这里是第一个特效展示木牌。",
            "现在我要对背景层、事件层、前景层、勇士层进行特效处理。",
            "  首先我应该引入需要使用的内容，使用：\n\r[yellow]const { ShaderEffect, setTickerFor, replaceGameCanvas } = core.plugin.shaderEffect;\r",
            "  然后我需要创建一个着色器特效实例，并指定特效画布的背景色，例如我指定背景色为全透明：\n\r[yellow]const effect = new ShaderEffect([0, 0, 0, 0]);\r\n  其中\r[gold][0, 0, 0, 0]\r便是颜色数组，每一项分别表示 rgba，范围均为\r[gold]0-1\r",
            "  下面我需要指定特效的作用画布，上面说了我要对哪些画布进行特效处理，现在我们就需要获取这些画布：\n\r[yellow]const canvas = ['bg', 'bg2', 'event', 'fg', 'fg2', 'hero'];\r\n  这些便是所有画布的id，下面我们将其映射为画布：\n\r[yellow]const imgs = canvas.map(v => core.canvas[v].canvas);\r\n  这样，我们就获取到了所有的作用画布，下面将特效实例的作用画布设置为它们：\n\r[yellow]effect.baseImage(...imgs);\r",
            "  设置完作用画布之后，我们就可以编写着色器脚本了。着色器脚本使用\r[gold]glsl\r语言进行编写。\n首先我们来看顶点着色器。顶点着色器用于确定绘制顶点与图片顶点等，一般不需要我们编写，直接使用插件内置的脚本即可：\n\r[yellow]effect.vs(ShaderEffect.defaultVs);\r\n  其中\r[gold]vs\r函数便是设置顶点着色器的函数。",
            "  下面我们主要看片元着色器。片元着色器描述了每个像素的颜色，因此它是本插件的核心。在片元着色器脚本中，必须包含一个\r[gold]main\r函数，同时必须为\r[gold]gl_FragColor\r赋值，其中\r[gold]gl_FragColor\r便是当前像素的颜色。\n  我们直接看一个例子，例子中将当前像素的绿色与红色值进行了互换：\n\r[yellow]void main() {\n    gl_FragColor = texture2D(uSampler, vTextureCoord).grba;\n}\r\n  这段着色器脚本乍一看貌似没有一处能看懂（），不过不要慌，我来解释一下它干了什么。",
            "  首先\r[gold]glsl\r是一个语法与\r[gold]C语言\r很像的语言，同时\r[gold]js\r也是C系语言，因此大部分语法使用js进行判断是没有太大问题的。下面我们就来仔细看看这段着色器代码。\n  首先是\r[yellow]void main() { }\r，它的作用是声明了一个返回值为空的函数，\r[gold]void\r便是返回值类型，\r[gold]main\r便是函数名称，它与js的函数声明基本一致。\n  下面是\r[yellow]gl_FragColor = texture2D(uSampler, vTextureCoord).grba;\r，它表示将后面的值赋给\r[gold]gl_FragColor\r。下面我们看后面的值，\r[gold]texture2D表示获取一个纹理的信息，其中\r[gold]uSampler\r指的便是我们的作用画布，\r[gold]vTextureCoord\r便是当前像素的位置，这么写意思便是获取到作用画布在当前位置的颜色信息。后面的\r[gold].grba\r表示根据\r[gold]grba\r的顺序获取颜色信息。它们的位置关系为：r - 0, g - 1, b - 2, a - 3，也就是说，我写\r[gold].grba\r就表示了按 1023 的顺序进行获取，也就是把绿色与红色进行了互换。",
            "  这下，我们便将着色器特效最复杂的部分解决了，后面的事情就好办了，我们将片元着色器脚本传递给特效实例：\n\r[yellow]effect.fs(`\n    void main() {\n        gl_FragColor = texture2D(uSampler, vTextureCoord).grba;\n    }\n`);\r\n  下面，我们就可以进行特效渲染了。",
            "  我们直接进行渲染：\n\r[yellow]effect.update(true);\r\n  其中\r[gold]update\r函数便是强制重新渲染特效的函数，后面的参数表示重新编译着色器脚本，因为我们还没编译过，因此需要传入true。一般我们更改了着色器脚本后都需要重新编译。",
            "  目前为止，我们渲染了一个静态的特效，我们需要每帧都渲染来让特效表现为动态的，我们直接使用插件自带的函数：\n\r[yellow]const ticker = setTickerFor(effect);\r\n  这样，特效就会自动每帧渲染，保持为动态了，其返回值\r[gold]ticker\r是高级动画插件中的\r[gold]Ticker\r实例。",
            "  下面，我们需要将特效展示在页面上。我们刚刚只对样板的系统画布进行了特效渲染，因此我们可以使用插件内置的函数进行这一操作：\n\r[yellow]const manager = replaceGameCanvas(effect, canvas);\r\n  这样，特效就会展示在页面中了。下面我们来看一下完整代码。",
            "\r[yellow]const { ShaderEffect, setTickerFor, replaceGameCanvas } = core.plugin.shaderEffect;\nconst effect = new ShaderEffect([0, 0, 0, 0]);\nconst canvas = ['bg', 'bg2', 'event', 'fg', 'fg2', 'hero'];\nconst imgs = canvas.map(v => core.canvas[v].canvas);\neffect.baseImage(imgs);\neffect.vs(ShaderEffect.defaultVs);\neffect.fs(`\n    void main() {\n        gl_FragColor = texture2D(uSampler, \n    vTextureCoord).grba;\n}\n`);\neffect.update(true);\n\nconst ticker = setTickerFor(effect);\nconst manager = replaceGameCanvas(effect, canvas);\r",
            {
                "type": "function",
                "function": "function(){\nflags.lastShaderSample?.end();\nflags.lastShaderSample = core.shaderSample1();\n}"
            },
            "现在便是最终效果。"
        ],
        "10,9": [
            "这里是第二个特效展示木牌。",
            "下面我将对事件层和勇士层进行处理，任何不透明的像素都将变成完全黑色，否则完全透明。它的着色器脚本：\n\r[yellow]void main() {\n    float alpha = texture2D(uSampler, vTextureCoord).a;\n    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha == 0.0 ? 0.0 : 1.0);\n}\r",
            {
                "type": "function",
                "function": "function(){\nflags.lastShaderSample?.end();\nflags.lastShaderSample = core.shaderSample2();\n}"
            }
        ],
        "10,5": [
            "这里是第三个特效展示木牌",
            "下面我将对事件层和勇士层进行处理，然后再rgb三个通道上加上一定量的噪声：\n\r[yellow]float noise(float x) {\n    float y = fract(sin(x)*100000.0);\n    return y;\n}\n\nvoid main() {\n    vec4 rgba = texture2D(uSampler, vTextureCoord);\n    float r = rgba.r + noise(rgba.r) / 5.0;\n    float g = rgba.g + noise(rgba.g) / 5.0;\n    float b = rgba.b + noise(rgba.b) / 5.0;\n\n    gl_FragColor = vec4(r, g, b, rgba.a);\n}\r",
            {
                "type": "function",
                "function": "function(){\nflags.lastShaderSample?.end();\nflags.lastShaderSample = core.shaderSample3();\n}"
            }
        ],
        "10,1": [
            "这里是第四个特效展示木牌，让我们来做一些复杂一点的特效",
            "下面我将对事件层和勇士层进行处理，然后降低亮度，在竖直方向上添加水平偏移噪声，模拟老式电视的信号不好的效果：\n\r[yellow]float noise(float x) {\n    float y = fract(sin(x) * 100000.0);\n    return y;\n}\n\nvoid main() {\n    float brigtness = -0.1;\n    vec2 xy = vTextureCoord;\n    float x = xy.x + noise(xy.y) / 100.0;\n    float y = xy.y;\n    vec4 color = texture2D(uSampler, vec2(x, y));\n    vec4 color1 = vec4(color.rgb + vec3(brigtness), color.a);\n\n    gl_FragColor = color1;\n}\r",
            {
                "type": "function",
                "function": "function(){\nflags.lastShaderSample?.end();\nflags.lastShaderSample = core.shaderSample4();\n}"
            }
        ],
        "4,9": [
            "不过我们发现到目前为止特效都不会动，只能保持为一定的状态，怎么让特效也能动呢？那就期待插件的下一次更新吧！",
            "下面将清除着色器特效。",
            {
                "type": "function",
                "function": "function(){\nflags.lastShaderSample?.end();\n}"
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
    [  1,  0,  0,  0,  0,  0,  0, 87,  0,  0,129,10189,  0,  0,  1],
    [  1, 27, 50,606, 11,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1, 28, 52,608, 12,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,129,10188,  0,  0,  1],
    [  1, 29, 51,236, 13,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1, 30, 47,273, 14,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,10193,129,  0,  0,  0,  0,  0,129,10187,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,  0,  0,10186,129,  0,  0, 88,  0, 94,129,10185,  0,  0,  1],
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