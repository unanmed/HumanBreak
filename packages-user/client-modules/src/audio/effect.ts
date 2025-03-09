import { isNil } from 'lodash-es';
import { sleep } from 'mutate-animate';

export interface IAudioInput {
    /** 输入节点 */
    input: AudioNode;
}

export interface IAudioOutput {
    /** 输出节点 */
    output: AudioNode;
}

export abstract class AudioEffect implements IAudioInput, IAudioOutput {
    /** 输出节点 */
    abstract output: AudioNode;
    /** 输入节点 */
    abstract input: AudioNode;

    constructor(public readonly ac: AudioContext) {}

    /**
     * 当音频播放结束时触发，可以用于节点结束后处理
     */
    abstract end(): void;

    /**
     * 当音频开始播放时触发，可以用于节点初始化
     */
    abstract start(): void;

    /**
     * 连接至其他效果器
     * @param target 目标输入
     * @param output 当前效果器输出通道
     * @param input 目标效果器的输入通道
     */
    connect(target: IAudioInput, output?: number, input?: number) {
        this.output.connect(target.input, output, input);
    }

    /**
     * 与其他效果器取消连接
     * @param target 目标输入
     * @param output 当前效果器输出通道
     * @param input 目标效果器的输入通道
     */
    disconnect(target?: IAudioInput, output?: number, input?: number) {
        if (!target) {
            if (!isNil(output)) {
                this.output.disconnect(output);
            } else {
                this.output.disconnect();
            }
        } else {
            if (!isNil(output)) {
                if (!isNil(input)) {
                    this.output.disconnect(target.input, output, input);
                } else {
                    this.output.disconnect(target.input, output);
                }
            } else {
                this.output.disconnect(target.input);
            }
        }
    }
}

export class StereoEffect extends AudioEffect {
    output: PannerNode;
    input: PannerNode;

    constructor(ac: AudioContext) {
        super(ac);
        const panner = ac.createPanner();
        this.input = panner;
        this.output = panner;
    }

    /**
     * 设置音频朝向，x正方形水平向右，y正方形垂直于地面向上，z正方向垂直屏幕远离用户
     * @param x 朝向x坐标
     * @param y 朝向y坐标
     * @param z 朝向z坐标
     */
    setOrientation(x: number, y: number, z: number) {
        this.output.orientationX.value = x;
        this.output.orientationY.value = y;
        this.output.orientationZ.value = z;
    }

    /**
     * 设置音频位置，x正方形水平向右，y正方形垂直于地面向上，z正方向垂直屏幕远离用户
     * @param x 位置x坐标
     * @param y 位置y坐标
     * @param z 位置z坐标
     */
    setPosition(x: number, y: number, z: number) {
        this.output.positionX.value = x;
        this.output.positionY.value = y;
        this.output.positionZ.value = z;
    }

    end(): void {}

    start(): void {}
}

export class VolumeEffect extends AudioEffect {
    output: GainNode;
    input: GainNode;

    constructor(ac: AudioContext) {
        super(ac);
        const gain = ac.createGain();
        this.input = gain;
        this.output = gain;
    }

    /**
     * 设置音量大小
     * @param volume 音量大小
     */
    setVolume(volume: number) {
        this.output.gain.value = volume;
    }

    /**
     * 获取音量大小
     */
    getVolume(): number {
        return this.output.gain.value;
    }

    end(): void {}

    start(): void {}
}

export class ChannelVolumeEffect extends AudioEffect {
    output: ChannelMergerNode;
    input: ChannelSplitterNode;

    /** 所有的音量控制节点 */
    private readonly gain: GainNode[] = [];

    constructor(ac: AudioContext) {
        super(ac);
        const splitter = ac.createChannelSplitter();
        const merger = ac.createChannelMerger();
        this.output = merger;
        this.input = splitter;
        for (let i = 0; i < 6; i++) {
            const gain = ac.createGain();
            splitter.connect(gain, i);
            gain.connect(merger, 0, i);
            this.gain.push(gain);
        }
    }

    /**
     * 设置某个声道的音量大小
     * @param channel 要设置的声道，可填0-5
     * @param volume 这个声道的音量大小
     */
    setVolume(channel: number, volume: number) {
        if (!this.gain[channel]) return;
        this.gain[channel].gain.value = volume;
    }

    /**
     * 获取某个声道的音量大小，可填0-5
     * @param channel 要获取的声道
     */
    getVolume(channel: number): number {
        if (!this.gain[channel]) return 0;
        return this.gain[channel].gain.value;
    }

    end(): void {}

    start(): void {}
}

export class DelayEffect extends AudioEffect {
    output: DelayNode;
    input: DelayNode;

    constructor(ac: AudioContext) {
        super(ac);
        const delay = ac.createDelay();
        this.input = delay;
        this.output = delay;
    }

    /**
     * 设置延迟时长
     * @param delay 延迟时长，单位秒
     */
    setDelay(delay: number) {
        this.output.delayTime.value = delay;
    }

    /**
     * 获取延迟时长
     */
    getDelay() {
        return this.output.delayTime.value;
    }

    end(): void {}

    start(): void {}
}

export class EchoEffect extends AudioEffect {
    output: GainNode;
    input: GainNode;

    /** 延迟节点 */
    private readonly delay: DelayNode;
    /** 反馈增益节点 */
    private readonly gainNode: GainNode;
    /** 当前增益 */
    private gain: number = 0.5;
    /** 是否正在播放 */
    private playing: boolean = false;

    constructor(ac: AudioContext) {
        super(ac);
        const delay = ac.createDelay();
        const gain = ac.createGain();
        gain.gain.value = 0.5;
        delay.delayTime.value = 0.05;
        delay.connect(gain);
        gain.connect(delay);
        this.delay = delay;
        this.gainNode = gain;
        this.input = gain;
        this.output = gain;
    }

    /**
     * 设置回声反馈增益大小
     * @param gain 增益大小，范围 0-1，大于等于1的视为0.5，小于0的视为0
     */
    setFeedbackGain(gain: number) {
        const resolved = gain >= 1 ? 0.5 : gain < 0 ? 0 : gain;
        this.gain = resolved;
        if (this.playing) this.gainNode.gain.value = resolved;
    }

    /**
     * 设置回声间隔时长
     * @param delay 回声时长，范围 0.01-Infinity，小于0.01的视为0.01
     */
    setEchoDelay(delay: number) {
        const resolved = delay < 0.01 ? 0.01 : delay;
        this.delay.delayTime.value = resolved;
    }

    /**
     * 获取反馈节点增益
     */
    getFeedbackGain() {
        return this.gain;
    }

    /**
     * 获取回声间隔时长
     */
    getEchoDelay() {
        return this.delay.delayTime.value;
    }

    end(): void {
        this.playing = false;
        const echoTime = Math.ceil(Math.log(0.001) / Math.log(this.gain)) + 10;
        sleep(this.delay.delayTime.value * echoTime).then(() => {
            if (!this.playing) this.gainNode.gain.value = 0;
        });
    }

    start(): void {
        this.playing = true;
        this.gainNode.gain.value = this.gain;
    }
}
