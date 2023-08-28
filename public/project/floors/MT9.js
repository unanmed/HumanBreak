main.floors.MT9=
{
    "floorId": "MT9",
    "title": "主塔 9 层",
    "name": "9",
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
        "5,1": [
            "本层将展示着色器特效的动画效果。",
            "动画效果的核心依然是高级动画插件，使用它来让一个值动态变化，从而达到动画的效果。本层将展示若干个示例。"
        ],
        "3,1": [
            "这里是第一个实例。",
            "本实例将做出一个画面逐渐变黑白的特效（虽然使用css更为方便，但是为了教学插件怎么用，就使用着色器插件进行制作）",
            "  首先我们要知道，要让画面变黑白，应该让它的rgb变成相同的，一般来说为了让效果更真实，会有特殊的算法进行优化，不过这里方便起见直接取平均值。\n  那么要有一个动画效果，我们应当声明一个可以变化的值来表示灰度百分比，表现在着色器中就是\r[gold]uniform（全局变量）\r声明。",
            "  那么片元着色器的代码就是：\n\r[yellow]uniform float uGrayscale;\n\nvoid main() {\n    vec4 rgb = texture2D(uSampler, vTextureCoord);\n    float avr = (rgb.r + rgb.g + rgb.b) / 3.0;\n    float dr = (rgb.r - avr) * (1.0 - uGrayscale);\n    float dg = (rgb.g - avr) * (1.0 - uGrayscale);\n    float db = (rgb.b - avr) * (1.0 - uGrayscale);\n\n    gl_FragColor = vec4(avr + dr, avr + dg, avr + db, rgb.a);\n}\r",
            "  稍微解析一下这段代码。这段代码首先声明了一个浮点型的\r[yellow]uGrayscale\r全局变量，然后在\r[yellow]main\r函数里面获取了当前像素的rgba值，计算平均值和差值，然后最后的rgba值就是平均值加上差值了。",
            "  那么前面的代码我们可以很轻松地写出来了，跟上一层的一样，不同的是我们还需要引入高级动画插件：\n\r[yellow]const { ShaderEffect, setTickerFor, replaceGameCanvas } = core.plugin.shaderEffect;\nconst { Animation, hyper } = core.plugin.animate;\nconst canvas = ['bg', 'bg2', 'event', 'fg', 'fg2', 'hero'];\neffect.baseImage(...canvas.map(v => core.canvas[v].canvas));\neffect.vs(ShaderEffect.defaultVs);\neffect.fs(/* 上面那一段着色器脚本 */);\r",
            "  在这后面就出现与之前不一样的地方了，之前我们直接使用\r[yellow]update\r函数进行渲染，但是这里不一样，需要使用\r[yellow]compile\r函数先进行编译：\n\r[yellow]effect.compile();\r",
            "  编译完成之后，我们就可以对\r[gold]uniform\r进行操作了，我们需要创建一个全局变量绑定器：\n\r[yellow]const binder = effect.createUniformBinder('uGrayscale', 1, 'f', '');\r\n  这一句话的信息量很大，我们来解析一下。\n  这个方法的第一个参数是全局变量的名称，着色器中我们使用了\r[gold]uGrayScale\r，这里也填它。\n  第二个参数是变量的元素数量，由于是一个浮点型数字，因此只有一个元素，所以填\r[gold]1\r。\n  第三个参数是元素的数值类似，是浮点数，所以填\r[gold]'f'\r，整型的话应该填\r[gold]'i'\r。\n  第四个参数是这个变量是否是向量，浮点数不是向量，因此填\r[gold]''\r，注意不能不填，应当填空字符串。",
            "  下一步我们需要对这个全局变量进行初始化操作，使用\r[gold]set\r方法进行赋值即可初始化：\n\r[yellow]binder.set(0);\r",
            "  下面，我们就可以使用js来操作这个\r[gold]uniform\r了，也就是说，我们可以使用高级动画插件操作这个全局变量来实现动画效果了。下面我们直接创建高级动画实例进行动画操作：\n\r[yellow]const ani = new Animation();\nani.register('grayscale', 0);\nani.time(5000).mode(hyper('sin', 'in-out')).absolute().apply('grayscale', 1);\r\n  这样，我们就创建了一个动画属性，下面我们要将它与全局变量绑定器联系起来。这里的高级动画的意思是：动画时间5000毫秒，速率曲线为hyper sin（双曲正弦）函数，in-out（慢-快-慢）变化方式，绝对变化，最终grayscale变为1",
            "  联系起来的方式很简单，直接使用内置方法每帧赋值即可：\n\r[yellow]ani.ticker.add(() => binder.set(ani.value.grayscale));\r",
            "  这样动画也配置完毕了，后面便可以直接渲染特效，然后在页面上展示了，唯一不同的点是不能再向\r[gold]update\r的第一个参数传入true了，这会重新编译着色器，导致绑定器失效。下面是后面的代码：\n\r[yellow]effect.update();\nconst ticker = setTickerFor(effect);\nconst manager = replaceGameCanvas(effect, canvas);\r\n  由于全部源码较长，这里就不放完整源码了。",
            "下面是最终效果。",
            {
                "type": "function",
                "function": "function(){\nflags.lastShaderSample?.end();\nflags.lastShaderSample = core.shaderSample5();\n}"
            }
        ],
        "1,1": [
            "这里是第二个特效实例。",
            "这个实例将模拟老实电视的显示不稳定",
            "这个特效本质上是对颜色进行一定程度的噪声处理，因此我们只需要创建一个噪声偏移量的全局变量，然后让它一直以恒定的速率增加就行了，这甚至不需要高级动画实例的参与。",
            "  它的片元着色器脚本：\n\r[yellow]uniform float uOffset;\n\nfloat noise(float x) {\n    float y = fract(sin(x) * 100000.0);\n    return y;\n}\n    \nvoid main() {\n    vec4 rgba = texture2D(uSampler, vTextureCoord);\n    float n = noise(rgba.r + rgba.g + rgba.b + uOffset) / 10.0;\n    \n    gl_FragColor = vec4(rgba.rgb + n, rgba.a);\n}\r",
            "它在动画部分的脚本（注意从高级动画插件引入Ticker）：\n\r[yellow]const ticker = new Ticker();\nticker.add(() => binder.set(binder.get() + 0.01));\r",
            {
                "type": "function",
                "function": "function(){\nflags.lastShaderSample?.end();\nflags.lastShaderSample = core.shaderSample6();\n}"
            }
        ],
        "9,1": [
            "这里是第三个特效实例。",
            "这个实例将让上一层的第四个实例动起来",
            "实际伤这与本层的第三实例类似，依然是加一个offset在噪声上。",
            "  它的片元着色器脚本：\n\r[yellow]uniform float uOffset;\n\nfloat noise(float x) {\n    float y = fract(sin(x) * 100000.0);\n    return y;\n}\n\nvoid main() {\n    float brigtness = -0.1 + noise(uOffset) / 50.0;\n    vec2 xy = vTextureCoord;\n    float x = xy.x + noise(xy.y + uOffset) / 100.0;\n    float y = xy.y;\n    vec4 color = texture2D(uSampler, vec2(x, y));\n    vec4 color1 = vec4(color.rgb + vec3(brigtness), color.a);\n\n    gl_FragColor = color1;\n}\r",
            "它在动画部分的脚本（注意从高级动画插件引入Ticker）：\n\r[yellow]const ticker = new Ticker();\nticker.add(() => binder.set(binder.get() + 0.01));\r",
            {
                "type": "function",
                "function": "function(){\nflags.lastShaderSample?.end();\nflags.lastShaderSample = core.shaderSample7();\n}"
            }
        ],
        "11,1": [
            "这里是第四个特效实例。",
            "这个实例将做一个四周边缘周期性变黑的特效",
            "  它需要用到当前像素的位置，因此需要从顶点着色器中用\r[gold]varying\r变量传递至片元着色器中，那么它的顶点着色器：\n\r[yellow]varying vec4 vpos;\n\nvoid main() {\n    vTextureCoord = aTextureCoord;\n    vpos = aVertexPosition;\n    gl_Position = aVertexPosition;\n}\r",
            "  它的片元着色器脚本：\n\r[yellow]uniform float uStrength;\nvarying vec4 vpos;\n\nvoid main() {\n    float alpha = clamp(distance(vec2(0, 0), vpos.xy) - 0.6, 0.0, 1.0) * uStrength;\n    vec4 tex = texture2D(uSampler, vTextureCoord);\n    gl_FragColor = vec4(tex.rgb * (1.0 - alpha), 1.0);\n}\r",
            "它在动画部分的脚本（注意从高级动画插件引入Ticker）：\n\r[yellow]const ticker = new Ticker();\nticker.add(time => binder.set((Math.sin(time / 2000 - Math.PI / 2) + 1) / 2);\r",
            {
                "type": "function",
                "function": "function(){\nflags.lastShaderSample?.end();\nflags.lastShaderSample = core.shaderSample8();\n}"
            }
        ],
        "13,1": [
            "这里是第五个特效实例。",
            "这个实例将吧前两个特效结合起来，粗略实现泰拉瑞亚中月球领主来临前的特效。",
            "  顶点着色器与第四个特效相同：\n\r[yellow]varying vec4 vpos;\n\nvoid main() {\n    vTextureCoord = aTextureCoord;\n    vpos = aVertexPosition;\n    gl_Position = aVertexPosition;\n}\r",
            "  它的片元着色器脚本：\n\r[yellow]uniform float uStrength;\nvarying vec4 vpos;\n\nfloat noise(float x) {\n    float y = fract(sin(x) * 100000.0);\n    return y;\n}\n\nvoid main() {\n    float brigtness = -uStrength / 10.0;\n    vec2 xy = vTextureCoord;\n    float x = xy.x + noise(xy.y + uStrength) / 300.0 * uStrength;\n    float y = xy.y;\n    vec4 color = texture2D(uSampler, vec2(x, y));\n    vec4 color1 = vec4(color.rgb + vec3(brigtness), color.a);\n    float alpha = clamp(distance(vec2(0, 0), vpos.xy) - 0.6, 0.0, 1.0) * uStrength;\n    gl_FragColor = vec4(color1.rgb * (1.0 - alpha), 1.0);\n}\r",
            "它在动画部分的脚本（注意从高级动画插件引入Ticker）：\n\r[yellow]const ticker = new Ticker();\nticker.add(time => binder.set((Math.sin(time / 2000 - Math.PI / 2) + 1) / 2);\r",
            {
                "type": "function",
                "function": "function(){\nflags.lastShaderSample?.end();\nflags.lastShaderSample = core.shaderSample9();\n}"
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
    [  1,129,  0,129,  0,129,  0, 88,  0,129,  0,129,  0,129,  1],
    [  1,10187,  0,10186,  0,10185,  0,  0,  0,10188,  0,10189,  0,10193,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,201,  0,202,  0,203,  0,204,  0,205,  0,206,  0,207,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,333,  0,336,  0,340,  0,345,  0,351,  0,358,  0,366,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1,376,  0,378,  0,381,  0,385,  0, 35,  0, 37,  0, 39,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
    [  1, 31,  0, 32,  0, 33,  0, 34,  0, 36,  0, 38,  0, 40,  1],
    [  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  1],
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