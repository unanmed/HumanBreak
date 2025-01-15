import EventEmitter from 'eventemitter3';
import { IStreamController, IStreamReader } from '../loader';
import { IAudioInput, IAudioOutput } from './effect';
import { logger } from '@/core/common/logger';
import { AudioType } from './support';
import CodecParser, { CodecFrame, MimeType, OggPage } from 'codec-parser';
import { isNil } from 'lodash-es';

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

export interface IAudioDecodeError {
    /** 错误信息 */
    message: string;
}

export interface IAudioDecodeData {
    /** 每个声道的音频信息 */
    channelData: Float32Array[];
    /** 已经被解码的 PCM 采样数 */
    samplesDecoded: number;
    /** 音频采样率 */
    sampleRate: number;
    /** 解码错误信息 */
    errors: IAudioDecodeError[];
}

export interface IAudioDecoder {
    /**
     * 创建音频解码器
     */
    create(): Promise<void>;

    /**
     * 摧毁这个解码器
     */
    destroy(): void;

    /**
     * 解码流数据
     * @param data 流数据
     */
    decode(data: Uint8Array): Promise<IAudioDecodeData>;

    /**
     * 当音频解码完成后，会调用此函数，需要返回之前还未解析或未返回的音频数据。调用后，该解码器将不会被再次使用
     */
    flush(): Promise<IAudioDecodeData>;
}

const fileSignatures: Map<string, AudioType> = new Map([
    ['49 44 33', AudioType.Mp3],
    ['4F 67 67 53', AudioType.Ogg],
    ['52 49 46 46', AudioType.Wav],
    ['66 4C 61 43', AudioType.Flac],
    ['4F 70 75 73', AudioType.Opus],
    ['FF F1', AudioType.Aac],
    ['FF F9', AudioType.Aac]
]);

const mimeTypeMap: Record<AudioType, MimeType> = {
    [AudioType.Aac]: 'audio/aac',
    [AudioType.Flac]: 'audio/flac',
    [AudioType.Mp3]: 'audio/mpeg',
    [AudioType.Ogg]: 'application/ogg',
    [AudioType.Opus]: 'application/ogg',
    [AudioType.Wav]: 'application/ogg'
};

function isOggPage(data: any): data is OggPage {
    return !isNil(data.isFirstPage);
}

export class AudioStreamSource extends AudioSource implements IStreamReader {
    static readonly decoderMap: Map<AudioType, IAudioDecoder> = new Map();
    output: AudioBufferSourceNode;

    /** 音频数据 */
    buffer?: AudioBuffer;

    /** 是否已经完全加载完毕 */
    loaded: boolean = false;
    /** 已经缓冲了多长时间，如果缓冲完那么跟歌曲时长一致 */
    buffered: number = 0;
    /** 已经缓冲的采样点数量 */
    bufferedSamples: number = 0;
    /** 歌曲时长，加载完毕之前保持为 0 */
    duration: number = 0;
    /** 在流传输阶段，至少缓冲多长时间的音频之后才开始播放，单位秒 */
    bufferPlayDuration: number = 1;
    /** 音频的采样率，未成功解析出之前保持为 0 */
    sampleRate: number = 0;

    private controller?: IStreamController;
    private loop: boolean = false;

    private target?: IAudioInput;

    /** 开始播放时刻 */
    private lastStartTime: number = 0;

    /** 是否已经获取到头文件 */
    private headerRecieved: boolean = false;
    /** 音频类型 */
    private audioType: AudioType | '' = '';
    /** 音频解码器 */
    private decoder?: IAudioDecoder;
    /** 音频解析器 */
    private parser?: CodecParser;
    /** 每多长时间组成一个缓存 Float32Array */
    private bufferChunkSize = 10;
    /** 缓存音频数据，每 bufferChunkSize 秒钟组成一个 Float32Array，用于流式解码 */
    private audioData: Float32Array[][] = [];

    /**
     * 注册一个解码器
     * @param type 要注册的解码器允许解码的类型
     * @param decoder 解码器对象
     */
    static registerDecoder(type: AudioType, decoder: IAudioDecoder) {
        if (this.decoderMap.has(type)) {
            logger.warn(47, type);
            return;
        }
        this.decoderMap.set(type, decoder);
    }

    constructor(context: AudioContext) {
        super(context);
        this.output = context.createBufferSource();
    }

    /**
     * 设置每个缓存数据的大小，默认为10秒钟一个缓存数据
     * @param size 每个缓存数据的时长，单位秒
     */
    setChunkSize(size: number) {
        if (this.controller?.loading || this.loaded) return;
        this.bufferChunkSize = size;
    }

    piped(controller: IStreamController): void {
        this.controller = controller;
    }

    async pump(data: Uint8Array | undefined, done: boolean): Promise<void> {
        if (!data) return;
        if (!this.headerRecieved) {
            // 检查头文件获取音频类型
            const toCheck = [...data.slice(0, 16)];
            const hexArray = toCheck.map(v => v.toString(16).padStart(2, '0'));
            const hex = hexArray.join(' ');
            for (const [key, value] of fileSignatures) {
                if (hex.startsWith(key)) {
                    this.audioType = value;
                    break;
                }
            }
            if (!this.audioType) {
                logger.error(25, hex);
                return;
            }
            // 创建解码器
            const decoder = AudioStreamSource.decoderMap.get(this.audioType);
            this.decoder = decoder;
            if (!decoder) {
                logger.error(24, this.audioType);
                return Promise.reject(
                    `Cannot decode stream source type of '${this.audioType}', since there is no registered decoder for that type.`
                );
            }
            // 创建数据解析器
            const mime = mimeTypeMap[this.audioType];
            const parser = new CodecParser(mime);
            this.parser = parser;
            await decoder.create();
            this.headerRecieved = true;
        }

        const decoder = this.decoder;
        const parser = this.parser;
        if (!decoder || !parser) {
            return Promise.reject(
                'No parser or decoder attached in this AudioStreamSource'
            );
        }

        await this.decodeData(data, decoder, parser);
        if (done) await this.decodeFlushData(decoder, parser);
        this.checkBufferedPlay();
    }

    /**
     * 检查采样率，如果还未解析出采样率，那么将设置采样率，如果当前采样率与之前不同，那么发出警告
     */
    private checkSampleRate(info: (OggPage | CodecFrame)[]) {
        const first = info[0];
        if (first) {
            const frame = isOggPage(first) ? first.codecFrames[0] : first;
            if (frame) {
                const rate = frame.header.sampleRate;
                if (this.sampleRate === 0) {
                    this.sampleRate = rate;
                } else {
                    if (rate !== this.sampleRate) {
                        logger.warn(48);
                    }
                }
            }
        }
    }

    /**
     * 解析音频数据
     */
    private async decodeData(
        data: Uint8Array,
        decoder: IAudioDecoder,
        parser: CodecParser
    ) {
        // 解析音频数据
        const audioData = await decoder.decode(data);
        // @ts-expect-error 库类型声明错误
        const audioInfo = [...parser.parseChunk(data)] as (
            | OggPage
            | CodecFrame
        )[];

        // 检查采样率
        this.checkSampleRate(audioInfo);
        // 追加音频数据
        this.appendDecodedData(audioData, audioInfo);
    }

    /**
     * 解码剩余数据
     */
    private async decodeFlushData(decoder: IAudioDecoder, parser: CodecParser) {
        const audioData = await decoder.flush();
        // @ts-expect-error 库类型声明错误
        const audioInfo = [...parser.flush()] as (OggPage | CodecFrame)[];

        this.checkSampleRate(audioInfo);
        this.appendDecodedData(audioData, audioInfo);
    }

    /**
     * 追加音频数据
     */
    private appendDecodedData(
        data: IAudioDecodeData,
        info: (CodecFrame | OggPage)[]
    ) {
        const channels = data.channelData.length;
        if (channels === 0) return;
        if (this.audioData.length !== channels) {
            this.audioData = [];
            for (let i = 0; i < channels; i++) {
                this.audioData.push([]);
            }
        }
        // 计算出应该放在哪
        const chunk = this.sampleRate * this.bufferChunkSize;
        const sampled = this.bufferedSamples;
        const pushIndex = Math.floor(sampled / chunk);
        const bufferIndex = sampled % (this.sampleRate * chunk);
        const dataLength = data.channelData[0].length;
        const restLength = chunk - bufferIndex;
        // 把数据放入缓存
        for (let i = 0; i < channels; i++) {
            const audioData = this.audioData[i];
            if (!audioData[pushIndex]) {
                audioData.push(new Float32Array(chunk * this.sampleRate));
            }
            audioData[pushIndex].set(data.channelData[i], bufferIndex);
            if (restLength < dataLength) {
                const nextData = new Float32Array(chunk * this.sampleRate);
                nextData.set(data.channelData[i].slice(restLength), 0);
                audioData.push(nextData);
            }
        }
        this.buffered += info.reduce((prev, curr) => prev + curr.duration, 0);
        this.bufferedSamples += info.reduce(
            (prev, curr) => prev + curr.samples,
            0
        );
    }

    /**
     * 检查已缓冲内容，并在未开始播放时播放
     */
    private checkBufferedPlay() {
        if (this.playing || this.loaded) return;
        const played = this.ac.currentTime - this.lastStartTime;
        const dt = this.buffered - played;
        if (dt < this.bufferPlayDuration) return;
        // 需要播放
        const buffer = this.ac.createBuffer(
            this.audioData.length,
            this.bufferedSamples,
            this.sampleRate
        );
        this.buffer = buffer;
        const chunk = this.sampleRate * this.bufferChunkSize;
        const bufferedChunks = Math.floor(this.buffered / chunk);
        const restLength = this.buffered % chunk;
        for (let i = 0; i < this.audioData.length; i++) {
            const audio = this.audioData[i];
            const data = new Float32Array(this.bufferedSamples);
            for (let j = 0; j < bufferedChunks; j++) {
                data.set(audio[j], chunk * j);
            }
            if (restLength !== 0) data.set(audio[bufferedChunks], 0);
            buffer.copyToChannel(data, i, 0);
        }
        this.createSourceNode(buffer);
        this.output.start(played);
        this.lastStartTime = this.ac.currentTime;
        this.output.addEventListener('ended', () => {
            this.checkBufferedPlay();
        });
    }

    private mergeBuffers() {}

    async start() {
        delete this.buffer;
        this.headerRecieved = false;
        this.audioType = '';
    }

    end(done: boolean, reason?: string): void {
        if (done) {
            this.loaded = true;
            delete this.controller;
            this.mergeBuffers();
            const played = this.ac.currentTime - this.lastStartTime;
            this.output.stop();
            this.play(played);
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
            this.createSourceNode(this.buffer);
            this.output.start(when);
            this.output.addEventListener('ended', () => {
                this.playing = false;
                this.emit('end');
                if (this.loop && !this.output.loop) this.play(0);
            });
        } else {
            this.controller?.start();
        }
    }

    private createSourceNode(buffer: AudioBuffer) {
        if (!this.target) return;
        const node = this.ac.createBufferSource();
        node.buffer = buffer;
        this.output = node;
        node.connect(this.target.input);
        node.loop = this.loop;
    }

    stop(): number {
        this.output.stop();
        return this.ac.currentTime - this.lastStartTime;
    }

    connect(target: IAudioInput): void {
        this.target = target;
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
    private target?: IAudioInput;

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
        if (this.playing || !this.buffer) return;
        this.playing = true;
        this.lastStartTime = this.ac.currentTime;
        this.emit('play');
        this.createSourceNode(this.buffer);
        this.output.start(when);
        this.output.addEventListener('ended', () => {
            this.playing = false;
            this.emit('end');
            if (this.loop && !this.output.loop) this.play(0);
        });
    }

    private createSourceNode(buffer: AudioBuffer) {
        if (!this.target) return;
        const node = this.ac.createBufferSource();
        node.buffer = buffer;
        this.output = node;
        node.connect(this.target.input);
        node.loop = this.loop;
    }

    stop(): number {
        this.output.stop();
        return this.ac.currentTime - this.lastStartTime;
    }

    connect(target: IAudioInput): void {
        this.target = target;
    }

    setLoop(loop: boolean): void {
        this.loop = loop;
    }
}
