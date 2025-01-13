import EventEmitter from 'eventemitter3';
import { IStreamController, IStreamReader } from '../loader';
import { IAudioInput, IAudioOutput } from './effect';
import { logger } from '@/core/common/logger';

interface AudioSourceEvent {
    play: [];
    end: [];
}

export abstract class AudioSource
    extends EventEmitter<AudioSourceEvent>
    implements IAudioOutput
{
    /** 音频源的输出节点 */
    abstract readonly output: AudioNode;

    /** 是否正在播放 */
    playing: boolean = false;

    constructor(public readonly ac: AudioContext) {
        super();
    }

    /**
     * 开始播放这个音频源
     */
    abstract play(when?: number): void;

    /**
     * 停止播放这个音频源
     * @returns 音频暂停的时刻
     */
    abstract stop(): number;

    /**
     * 连接到音频路由图上，每次调用播放的时候都会执行一次
     * @param target 连接至的目标
     */
    abstract connect(target: IAudioInput): void;

    /**
     * 设置是否循环播放
     * @param loop 是否循环
     */
    abstract setLoop(loop: boolean): void;
}

export class AudioStreamSource extends AudioSource implements IStreamReader {
    output: AudioBufferSourceNode;

    /** 音频数据 */
    buffer?: AudioBuffer;

    /** 是否已经完全加载完毕 */
    loaded: boolean = false;

    private controller?: IStreamController;
    private loop: boolean = false;

    /** 开始播放时刻 */
    private lastStartTime: number = 0;

    constructor(context: AudioContext) {
        super(context);
        this.output = context.createBufferSource();
    }

    piped(controller: IStreamController): void {
        this.controller = controller;
    }

    pump(data: Uint8Array | undefined): void {
        if (!data) return;
    }

    start(): void {
        delete this.buffer;
    }

    end(done: boolean, reason?: string): void {
        if (done) {
            this.loaded = true;
            delete this.controller;
        } else {
            logger.warn(44, reason ?? '');
        }
    }

    play(when?: number): void {
        if (this.playing) return;
        if (this.loaded && this.buffer) {
            this.playing = true;
            this.lastStartTime = this.ac.currentTime;
            this.emit('play');
            this.output.start(when);
            this.output.addEventListener('ended', () => {
                this.playing = false;
                this.emit('end');
                if (this.loop) this.play(0);
            });
        } else {
            this.controller?.start();
        }
    }

    stop(): number {
        this.output.stop();
        return this.ac.currentTime - this.lastStartTime;
    }

    connect(target: IAudioInput): void {
        if (!this.buffer) return;
        const node = this.ac.createBufferSource();
        node.buffer = this.buffer;
        this.output = node;
        node.connect(target.input);
        node.loop = this.loop;
    }

    setLoop(loop: boolean): void {
        this.loop = loop;
    }
}

export class AudioElementSource extends AudioSource {
    output: MediaElementAudioSourceNode;

    /** audio 元素 */
    readonly audio: HTMLAudioElement;

    constructor(context: AudioContext) {
        super(context);
        const audio = new Audio();
        audio.preload = 'none';
        this.output = context.createMediaElementSource(audio);
        this.audio = audio;
        audio.addEventListener('play', () => {
            this.playing = true;
            this.emit('play');
        });
        audio.addEventListener('ended', () => {
            this.playing = false;
            this.emit('end');
        });
    }

    /**
     * 设置音频源的路径
     * @param url 音频路径
     */
    setSource(url: string) {
        this.audio.src = url;
    }

    play(when: number): void {
        if (this.playing) return;
        this.audio.currentTime = when;
        this.audio.play();
    }

    stop(): number {
        this.audio.pause();
        this.playing = false;
        this.emit('end');
        return this.audio.currentTime;
    }

    connect(target: IAudioInput): void {
        this.output.connect(target.input);
    }

    setLoop(loop: boolean): void {
        this.audio.loop = loop;
    }
}

export class AudioBufferSource extends AudioSource {
    output: AudioBufferSourceNode;

    /** 音频数据 */
    buffer?: AudioBuffer;
    /** 是否循环 */
    private loop: boolean = false;

    /** 播放开始时刻 */
    private lastStartTime: number = 0;

    constructor(context: AudioContext) {
        super(context);
        this.output = context.createBufferSource();
    }

    /**
     * 设置音频源数据
     * @param buffer 音频源，可以是未解析的 ArrayBuffer，也可以是已解析的 AudioBuffer
     */
    async setBuffer(buffer: ArrayBuffer | AudioBuffer) {
        if (buffer instanceof ArrayBuffer) {
            this.buffer = await this.ac.decodeAudioData(buffer);
        } else {
            this.buffer = buffer;
        }
    }

    play(when?: number): void {
        if (this.playing) return;
        this.playing = true;
        this.lastStartTime = this.ac.currentTime;
        this.emit('play');
        this.output.start(when);
        this.output.addEventListener('ended', () => {
            this.playing = false;
            this.emit('end');
            if (this.loop) this.play(0);
        });
    }

    stop(): number {
        this.output.stop();
        return this.ac.currentTime - this.lastStartTime;
    }

    connect(target: IAudioInput): void {
        if (!this.buffer) return;
        const node = this.ac.createBufferSource();
        node.buffer = this.buffer;
        node.connect(target.input);
    }

    setLoop(loop: boolean): void {
        this.loop = loop;
    }
}
