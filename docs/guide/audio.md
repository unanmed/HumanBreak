# 音频系统

新样板也对音频系统进行了完全性重构，在新的音频系统下，你能够更好地控制音频的播放。

## BGM 系统

### 切换 BGM

使用 `changeTo` 函数进行切歌即可：

```ts
function changeTo(id: string, when?: number, noStack?: boolean): void
```

其中 `id` 表示要切换至的歌，`when` 表示起始时间，可以不填，默认从头开始播（如果目标歌曲已经完全停止播放了），`noStack` 表示是否不计入修改栈，一般不需要填写。

在切歌时，会有渐变效果，即当前歌曲的音量会慢慢变小，同时目标歌曲的音量会慢慢变大，直至切换完毕。在未切换完毕时，如果又切回原来的歌，那么不会从头开始播放，或者从设置的时刻开始播放，而是会接着当前时刻继续播放。

如果不想要渐变切换，可以使用 `play` 函数

```ts
function play(id: string, when?: number, noStack: boolean): void
```

其用法与 `changeTo` 完全一样，效果为没有渐变的切歌，其余的与 `changeTo` 完全一致。

```js
const { bgm } = Mota.requireAll('var');

bgm.changeTo('myBgm.mp3');
bgm.changeTo('myBgm2.mp3', 10); // 从第10秒开始播
bgm.play('myBgm.mp3'); // 无渐变的切歌
```

### 暂停与继续、撤销与恢复

可以使用 `pause` 和 `resume` 函数暂停或者继续播放，它们都可以传入一个参数，表示暂停或者继续过程是否渐变

```js
const { bgm } = Mota.requireAll('var');

bgm.pause(); // 有渐变暂停
bgm.resume(false); // 无渐变继续播放
```

除此之外，还可以通过 `undo` 和 `redo` 实现撤销与恢复的功能：

```ts
function undo(transition: boolean = true, when?: number): void
function redo(transition: boolean = true, when?: number): void
```

第一个参数表示是否渐变，默认渐变，第二个参数表示从哪开始播放，生效条件与 `changeTo` 一致。

```js
const { bgm } = Mota.requireAll('var');

bgm.changeTo('myBgm1.mp3');
bgm.changeTo('myBgm2.mp3');
bgm.changeTo('myBgm3.mp3');
// 当前播放 myBgm3
bgm.undo(); // 当前播放 myBgm2
bgm.undo(); // 当前播放 myBgm1
bgm.redo(); // 当前播放 myBgm2
bgm.changeTo('myBgm1.mp3'); // 当前播放 myBgm1
bgm.redo(); // 无法切换，保持当前播放，因为调用 changeTo 会清空恢复栈
bgm.undo(); // 当前播放 myBgm2
```

### 设置渐变参数

可以通过 `setTransition` 函数设置渐变参数：

```ts
function setTransition(time?: number, fn?: TimingFn): void
```

其中 `time` 参数表示渐变切歌的时长，即经过多长时间后切歌结束。`fn` 表示的是切歌的音量曲线，默认是线性。参数类型是 `TimingFn`，接受一个时间完成度参数，输出一个数字，表示动画完成度。参考库 `mutate-animate`（高级动画）

```js
const { bgm } = Mota.requireAll('var');
const { hyper } = Mota.Package.require('mutate-animate');

// 设置为渐变时间 5000ms，音量曲线是双曲正弦函数
bgm.setTransition(5000, hyper('sin', 'in-out'));
```

## 音效系统

### 播放与停止音效

使用 `play` 函数可以播放音效：

```ts
function play(id: string, end?: () => void): number
```

该函数接受两个参数，`id` 参数表示要播放的音效，`end` 参数表示当以 `id` 为名称的任意一个音效播放完毕后执行的函数。函数的返回值是本次音效播放的唯一标识符，用于停止音效播放。

```js
const { sound } = Mota.requireAll('var');

const num = sound.play('mySound.mp3');
```

可以通过 `stop` 函数或者 `stopById` 函数停止音效的播放：

```js
sound.stop(num); // 根据标识符停止音效播放
sound.stopById('mySound.mp3'); // 根据名称停止音效播放
sound.stopAll(); // 停止所有音效的播放
```

### 播放立体声

新样板相比于旧样板的音效系统最大的提升就是允许你播放立体声了，通过一些简单的配置，你可以设置某一种音效的音源位置（暂时还不能让每一次播放都处在不同的位置）。你可以设置听者（也就是玩家）的位置与朝向，然后设置音源的位置与朝向，就能实现立体声的效果。同时，你还可以动态修改音源位置，实现 3D 环绕音等效果。

不过由于所有音源共用一个音频目的地（也就是扬声器），因此设置听者的位置与朝向的话会引起所有音效的相对位置都发生改变，因此一般情况下只修改音源位置即可。

要设置音源位置，首先要获取音效实例，使用 `get` 函数：

```ts
function get(id: string): SoundEffect
```

然后使用音效实例上面的 `setPanner` 函数设置音源位置与听者位置：

```ts
function setPanner(source?: any, listener?: any): void
```

两个参数都是一个对象，分别可以填下列属性，对于除了这些之外的属性，请参考[PannerNode MDN 文档](https://developer.mozilla.org/en-US/docs/Web/API/PannerNode)、[AudioListener MDN 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/AudioListener)、[Web Audio 空间化文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics)：

-   `source`:
    -   `orientationX`: 音源方向向量 X 分量
    -   `orientationY`: 音源方向向量 Y 分量
    -   `orientationZ`: 音源方向向量 Z 分量
    -   `positionX`: 音源位置坐标 X 分量
    -   `positionY`: 音源位置坐标 Y 分量
    -   `positionZ`: 音源位置坐标 Z 分量
-   `listener`: （不建议设置）
    -   `positionX`: 听者的位置坐标 X 分量
    -   `positionY`: 听者的位置坐标 Y 分量
    -   `positionZ`: 听者的位置坐标 Z 分量
    -   `upX`: 听者的头部位置坐标 X 分量
    -   `upY`: 听者的头部位置坐标 Y 分量
    -   `upZ`: 听者的头部位置坐标 Z 分量
    -   `forwardX`: 听者的面朝方向向量 X 分量
    -   `forwardY`: 听者的面朝方向向量 Y 分量
    -   `forwardZ`: 听者的面朝方向向量 Z 分量

在右手笛卡尔坐标系（也就是立体声所使用的坐标系）下，我们可以认为水平向右是 X 轴正方向，竖直向上是 Y 轴正方向，垂直屏幕向外是 Z 轴正方向。对于听者的初始位置，直接按照上述坐标描述方式进行设置音源位置即可。于是，我们就可以设置一个音效的位置了：

```js
const { sound } = Mota.requireAll('var');

const se = sound.get('mySound');
// 将音源位置设置为相对于听者右上的位置
se.setPanner({
    positionX: 1,
    positionY: 1,
    positionZ: 0
});
se.playSE(); // 播放音效，等价于 sound.play('mySound');
```

### 自定义音频路由

`SoundEffect` 实例通过将音频源（`AudioBufferSourceNode`）连接到若干个路由根节点上实现对音频的特效处理。例如，对于上面所说的立体声，就是通过自定义音频路由实现的，它的音频路由如下：

```txt
AudioBufferSourceNode(音频源) -> PannerNode(立体声处理模块) ->
    GainNode(音量处理模块) -> destination(音频目的地)
```

你也可以自定义自己的音频路由，然后把它放到音效实例的 `baseNode` 属性上。例如，这里我给音效加一个线性卷积节点，然后输出到目的地。音频路由参考[Web Audio API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Audio_API)。

```js
const { AudioPlayer } = Mota.requireAll('class');
const sound = Mota.requireAll('var');
const ac = AudioPlayer.ac;

// 创建线性卷积节点，用于实现混响效果
const convolver = ac.createConvolver();
// 设置混响效果的音频缓冲器，一般是脉冲反应，这里使用了其他的音效替代，最终效果可能会比较差
convolver.buffer = await ac.decodeAudioData(sound.get('mySound2.mp3').data);
// 连接至音频目的地
convolver.connect(ac.destination);
const se = sound.get('mySound.mp3');
// 添加至路由根节点，播放时就会经过这个路由节点的处理
se.baseNode.push({ node: convolver });
// 或者覆盖系统自带的根节点
se.baseNode = [{ node: convolver }];
```
