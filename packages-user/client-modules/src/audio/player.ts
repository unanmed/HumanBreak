import EventEmitter from 'eventemitter3';
import {
    AudioBufferSource,
    AudioElementSource,
    AudioSource,
    AudioStreamSource
} from './source';
import {
    AudioEffect,
    ChannelVolumeEffect,
    DelayEffect,
    EchoEffect,
    IAudioOutput,
    StereoEffect,
    VolumeEffect
} from './effect';
import { isNil } from 'lodash-es';
import { logger } from '@motajs/common';
import { sleep } from 'mutate-animate';
import { AudioDecoder } from './decoder';

interface AudioPlayerEvent {}

export class AudioPlayer extends EventEmitter<AudioPlayerEvent> {
    /** 音频播放上下文 */
    readonly ac: AudioContext;

    /** 所有的音频播放路由 */
    readonly audioRoutes: Map<string, AudioRoute> = new Map();
    /** 音量节点 */
    readonly gain: GainNode;

    constructor() {
        super();
        this.ac = new AudioContext();
        this.gain = this.ac.createGain();
        this.gain.connect(this.ac.destination);
    }

    /**
     * 解码音频数据
     * @param data 音频数据
     */
    decodeAudioData(data: Uint8Array) {
        return AudioDecoder.decodeAudioData(data, this);
    }

    /**
     * 设置音量
     * @param volume 音量
     */
    setVolume(volume: number) {
        this.gain.gain.value = volume;
    }

    /**
     * 获取音量
     */
    getVolume() {
        return this.gain.gain.value;
    }

    /**
     * 创建一个音频源
     * @param Source 音频源类
     */
    createSource<T extends AudioSource>(
        Source: new (ac: AudioContext) => T
    ): T {
        return new Source(this.ac);
    }

    /**
     * 创建一个兼容流式音频源，可以与流式加载相结合，主要用于处理 opus ogg 不兼容的情况
     */
    createStreamSource() {
        return new AudioStreamSource(this.ac);
    }

    /**
     * 创建一个通过 audio 元素播放的音频源
     */
    createElementSource() {
        return new AudioElementSource(this.ac);
    }

    /**
     * 创建一个通过 AudioBuffer 播放的音频源
     */
    createBufferSource() {
        return new AudioBufferSource(this.ac);
    }

    /**
     * 获取音频目的地
     */
    getDestination() {
        return this.gain;
    }

    /**
     * 创建一个音频效果器
     * @param Effect 效果器类
     */
    createEffect<T extends AudioEffect>(
        Effect: new (ac: AudioContext) => T
    ): T {
        return new Effect(this.ac);
    }

    /**
     * 创建一个修改音量的效果器
     * ```txt
     *             |----------|
     * Input ----> | GainNode | ----> Output
     *             |----------|
     * ```
     */
    createVolumeEffect() {
        return new VolumeEffect(this.ac);
    }

    /**
     * 创建一个立体声效果器
     * ```txt
     *             |------------|
     * Input ----> | PannerNode | ----> Output
     *             |------------|
     * ```
     */
    createStereoEffect() {
        return new StereoEffect(this.ac);
    }

    /**
     * 创建一个修改单个声道音量的效果器
     * ```txt
     *                                  |----------|
     *                               -> | GainNode | \
     *             |--------------| /   |----------|  -> |------------|
     * Input ----> | SplitterNode |        ......        | MergerNode | ----> Output
     *             |--------------| \   |----------|  -> |------------|
     *                               -> | GainNode | /
     *                                  |----------|
     * ```
     */
    createChannelVolumeEffect() {
        return new ChannelVolumeEffect(this.ac);
    }

    /**
     * 创建一个延迟效果器
     * ```txt
     *             |-----------|
     * Input ----> | DelayNode | ----> Output
     *             |-----------|
     * ```
     */
    createDelayEffect() {
        return new DelayEffect(this.ac);
    }

    /**
     * 创建一个回声效果器
     * ```txt
     *             |----------|
     * Input ----> | GainNode | ----> Output
     *        ^    |----------|   |
     *        |                   |
     *        |   |------------|  ↓
     *        |-- | Delay Node | <--
     *            |------------|
     * ```
     */
    createEchoEffect() {
        return new EchoEffect(this.ac);
    }

    /**
     * 创建一个音频播放路由
     * @param source 音频源
     */
    createRoute(source: AudioSource) {
        return new AudioRoute(source, this);
    }

    /**
     * 添加一个音频播放路由，可以直接被播放
     * @param id 这个音频播放路由的名称
     * @param route 音频播放路由对象
     */
    addRoute(id: string, route: AudioRoute) {
        if (this.audioRoutes.has(id)) {
            logger.warn(45, id);
        }
        this.audioRoutes.set(id, route);
    }

    /**
     * 根据名称获取音频播放路由对象
     * @param id 音频播放路由的名称
     */
    getRoute(id: string) {
        return this.audioRoutes.get(id);
    }

    /**
     * 移除一个音频播放路由
     * @param id 要移除的播放路由的名称
     */
    removeRoute(id: string) {
        const route = this.audioRoutes.get(id);
        if (route) {
            route.destroy();
        }
        this.audioRoutes.delete(id);
    }

    /**
     * 播放音频
     * @param id 音频名称
     * @param when 从音频的哪个位置开始播放，单位秒
     */
    play(id: string, when: number = 0) {
        const route = this.getRoute(id);
        if (!route) {
            logger.warn(53, 'play', id);
            return;
        }
        route.play(when);
    }

    /**
     * 暂停音频播放
     * @param id 音频名称
     * @returns 当音乐真正停止时兑现
     */
    pause(id: string) {
        const route = this.getRoute(id);
        if (!route) {
            logger.warn(53, 'pause', id);
            return;
        }
        return route.pause();
    }

    /**
     * 停止音频播放
     * @param id 音频名称
     * @returns 当音乐真正停止时兑现
     */
    stop(id: string) {
        const route = this.getRoute(id);
        if (!route) {
            logger.warn(53, 'stop', id);
            return;
        }
        return route.stop();
    }

    /**
     * 继续音频播放
     * @param id 音频名称
     */
    resume(id: string) {
        const route = this.getRoute(id);
        if (!route) {
            logger.warn(53, 'resume', id);
            return;
        }
        route.resume();
    }

    /**
     * 设置听者位置，x正方向水平向右，y正方向垂直于地面向上，z正方向垂直屏幕远离用户
     * @param x 位置x坐标
     * @param y 位置y坐标
     * @param z 位置z坐标
     */
    setListenerPosition(x: number, y: number, z: number) {
        const listener = this.ac.listener;
        listener.positionX.value = x;
        listener.positionY.value = y;
        listener.positionZ.value = z;
    }

    /**
     * 设置听者朝向，x正方向水平向右，y正方向垂直于地面向上，z正方向垂直屏幕远离用户
     * @param x 朝向x坐标
     * @param y 朝向y坐标
     * @param z 朝向z坐标
     */
    setListenerOrientation(x: number, y: number, z: number) {
        const listener = this.ac.listener;
        listener.forwardX.value = x;
        listener.forwardY.value = y;
        listener.forwardZ.value = z;
    }

    /**
     * 设置听者头顶朝向，x正方向水平向右，y正方向垂直于地面向上，z正方向垂直屏幕远离用户
     * @param x 头顶朝向x坐标
     * @param y 头顶朝向y坐标
     * @param z 头顶朝向z坐标
     */
    setListenerUp(x: number, y: number, z: number) {
        const listener = this.ac.listener;
        listener.upX.value = x;
        listener.upY.value = y;
        listener.upZ.value = z;
    }
}

export const enum AudioStatus {
    Playing,
    Pausing,
    Paused,
    Stoping,
    Stoped
}

type AudioStartHook = (route: AudioRoute) => void;
type AudioEndHook = (time: number, route: AudioRoute) => void;

interface AudioRouteEvent {
    updateEffect: [];
    play: [];
    stop: [];
    pause: [];
    resume: [];
}

export class AudioRoute
    extends EventEmitter<AudioRouteEvent>
    implements IAudioOutput
{
    output: AudioNode;

    /** 效果器路由图 */
    readonly effectRoute: AudioEffect[] = [];

    /** 结束时长，当音频暂停或停止时，会经过这么长时间之后才真正终止播放，期间可以做音频淡入淡出等效果 */
    endTime: number = 0;

    /** 当前播放状态 */
    status: AudioStatus = AudioStatus.Stoped;
    /** 暂停时刻 */
    private pauseTime: number = 0;
    /** 暂停时播放了多长时间 */
    private pauseCurrentTime: number = 0;

    /** 音频时长，单位秒 */
    get duration() {
        return this.source.duration;
    }
    /** 当前播放了多长时间，单位秒 */
    get currentTime() {
        if (this.status === AudioStatus.Paused) {
            return this.pauseCurrentTime;
        } else {
            return this.source.currentTime;
        }
    }
    set currentTime(time: number) {
        this.source.stop();
        this.source.play(time);
    }

    private shouldStop: boolean = false;
    /**
     * 每次暂停或停止时自增，用于判断当前正在处理的情况。
     * 假如暂停后很快播放，然后很快暂停，那么需要根据这个来判断实际是否应该执行暂停后操作
     */
    stopIdentifier: number = 0;

    private audioStartHook?: AudioStartHook;
    private audioEndHook?: AudioEndHook;

    constructor(
        public readonly source: AudioSource,
        public readonly player: AudioPlayer
    ) {
        super();
        this.output = source.output;
        source.on('end', () => {
            if (this.status === AudioStatus.Playing) {
                this.status = AudioStatus.Stoped;
            }
        });
        source.on('play', () => {
            if (this.status !== AudioStatus.Playing) {
                this.status = AudioStatus.Playing;
            }
        });
    }

    /**
     * 设置结束时间，暂停或停止时，会经过这么长时间才终止音频的播放，这期间可以做一下音频淡出的效果。
     * @param time 暂停或停止时，经过多长时间之后才会结束音频的播放
     */
    setEndTime(time: number) {
        this.endTime = time;
    }

    /**
     * 当音频播放时执行的函数，可以用于音频淡入效果
     * @param fn 音频开始播放时执行的函数
     */
    onStart(fn?: AudioStartHook) {
        this.audioStartHook = fn;
    }

    /**
     * 当音频暂停或停止时执行的函数，可以用于音频淡出效果
     * @param fn 音频在暂停或停止时执行的函数，不填时表示取消这个钩子。
     *           包含两个参数，第一个参数是结束时长，第二个参数是当前音频播放路由对象
     */
    onEnd(fn?: AudioEndHook) {
        this.audioEndHook = fn;
    }

    /**
     * 开始播放这个音频
     * @param when 从音频的什么时候开始播放，单位秒
     */
    async play(when: number = 0) {
        if (this.status === AudioStatus.Playing) return;
        this.link();
        await this.player.ac.resume();
        if (this.effectRoute.length > 0) {
            const first = this.effectRoute[0];
            this.source.connect(first);
            const last = this.effectRoute.at(-1)!;
            last.connect({ input: this.player.getDestination() });
        } else {
            this.source.connect({ input: this.player.getDestination() });
        }
        this.source.play(when);
        this.status = AudioStatus.Playing;
        this.pauseTime = 0;
        this.audioStartHook?.(this);
        this.startAllEffect();
        this.emit('play');
    }

    /**
     * 暂停音频播放
     */
    async pause() {
        if (this.status !== AudioStatus.Playing) return;
        this.status = AudioStatus.Pausing;
        this.stopIdentifier++;
        const identifier = this.stopIdentifier;
        if (this.audioEndHook) {
            this.audioEndHook(this.endTime, this);
            await sleep(this.endTime);
        }
        if (
            this.status !== AudioStatus.Pausing ||
            this.stopIdentifier !== identifier
        ) {
            return;
        }
        this.pauseCurrentTime = this.source.currentTime;
        const time = this.source.stop();
        this.pauseTime = time;
        if (this.shouldStop) {
            this.status = AudioStatus.Stoped;
            this.endAllEffect();
            this.emit('stop');
            this.shouldStop = false;
        } else {
            this.status = AudioStatus.Paused;
            this.endAllEffect();
            this.emit('pause');
        }
    }

    /**
     * 继续音频播放
     */
    resume() {
        if (this.status === AudioStatus.Playing) return;
        if (
            this.status === AudioStatus.Pausing ||
            this.status === AudioStatus.Stoping
        ) {
            this.audioStartHook?.(this);
            this.emit('resume');
            return;
        }
        if (this.status === AudioStatus.Paused) {
            this.play(this.pauseTime);
        } else {
            this.play(0);
        }
        this.status = AudioStatus.Playing;
        this.pauseTime = 0;
        this.audioStartHook?.(this);
        this.startAllEffect();
        this.emit('resume');
    }

    /**
     * 停止音频播放
     */
    async stop() {
        if (this.status !== AudioStatus.Playing) {
            if (this.status === AudioStatus.Pausing) {
                this.shouldStop = true;
            }
            return;
        }
        this.status = AudioStatus.Stoping;
        this.stopIdentifier++;
        const identifier = this.stopIdentifier;
        if (this.audioEndHook) {
            this.audioEndHook(this.endTime, this);
            await sleep(this.endTime);
        }
        if (
            this.status !== AudioStatus.Stoping ||
            this.stopIdentifier !== identifier
        ) {
            return;
        }
        this.source.stop();
        this.status = AudioStatus.Stoped;
        this.pauseTime = 0;
        this.endAllEffect();
        this.emit('stop');
    }

    /**
     * 添加效果器
     * @param effect 要添加的效果，可以是数组，表示一次添加多个
     * @param index 从哪个位置开始添加，如果大于数组长度，那么加到末尾，如果小于0，那么将会从后面往前数。默认添加到末尾
     */
    addEffect(effect: AudioEffect | AudioEffect[], index?: number) {
        if (isNil(index)) {
            if (effect instanceof Array) {
                this.effectRoute.push(...effect);
            } else {
                this.effectRoute.push(effect);
            }
        } else {
            if (effect instanceof Array) {
                this.effectRoute.splice(index, 0, ...effect);
            } else {
                this.effectRoute.splice(index, 0, effect);
            }
        }
        this.setOutput();
        if (this.source.playing) this.link();
        this.emit('updateEffect');
    }

    /**
     * 移除一个效果器
     * @param effect 要移除的效果
     */
    removeEffect(effect: AudioEffect) {
        const index = this.effectRoute.indexOf(effect);
        if (index === -1) return;
        this.effectRoute.splice(index, 1);
        effect.disconnect();
        this.setOutput();
        if (this.source.playing) this.link();
        this.emit('updateEffect');
    }

    destroy() {
        this.effectRoute.forEach(v => v.disconnect());
    }

    private setOutput() {
        const effect = this.effectRoute.at(-1);
        if (!effect) this.output = this.source.output;
        else this.output = effect.output;
    }

    /**
     * 连接音频路由图
     */
    private link() {
        this.effectRoute.forEach(v => v.disconnect());
        this.effectRoute.forEach((v, i) => {
            const next = this.effectRoute[i + 1];
            if (next) {
                v.connect(next);
            }
        });
    }

    private startAllEffect() {
        this.effectRoute.forEach(v => v.start());
    }

    private endAllEffect() {
        this.effectRoute.forEach(v => v.end());
    }
}

export const audioPlayer = new AudioPlayer();
// window.audioPlayer = audioPlayer;
