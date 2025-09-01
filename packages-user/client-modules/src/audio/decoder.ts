import { logger } from '@motajs/common';
import { OggVorbisDecoderWebWorker } from '@wasm-audio-decoders/ogg-vorbis';
import { OggOpusDecoderWebWorker } from 'ogg-opus-decoder';
import { AudioType, isAudioSupport } from './support';
import type { AudioPlayer } from './player';

const fileSignatures: [AudioType, number[]][] = [
    [AudioType.Mp3, [0x49, 0x44, 0x33]],
    [AudioType.Ogg, [0x4f, 0x67, 0x67, 0x53]],
    [AudioType.Wav, [0x52, 0x49, 0x46, 0x46]],
    [AudioType.Flac, [0x66, 0x4c, 0x61, 0x43]],
    [AudioType.Aac, [0xff, 0xf1]],
    [AudioType.Aac, [0xff, 0xf9]]
];
const oggHeaders: [AudioType, number[]][] = [
    [AudioType.Opus, [0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64]]
];

export function checkAudioType(data: Uint8Array) {
    let audioType: AudioType | '' = '';
    // 检查头文件获取音频类型，仅检查前256个字节
    const toCheck = data.slice(0, 256);
    for (const [type, value] of fileSignatures) {
        if (value.every((v, i) => toCheck[i] === v)) {
            audioType = type;
            break;
        }
    }
    if (audioType === AudioType.Ogg) {
        // 如果是ogg的话，进一步判断是不是opus
        for (const [key, value] of oggHeaders) {
            const has = toCheck.some((_, i) => {
                return value.every((v, ii) => toCheck[i + ii] === v);
            });
            if (has) {
                audioType = key;
                break;
            }
        }
    }
    return audioType;
}

export interface IAudioDecodeError {
    /** 错误信息 */
    message: string;
}

export interface IAudioDecodeData {
    /** 每个声道的音频信息 */
    channelData: Float32Array<ArrayBuffer>[];
    /** 已经被解码的 PCM 采样数 */
    samplesDecoded: number;
    /** 音频采样率 */
    sampleRate: number;
    /** 解码错误信息 */
    errors: IAudioDecodeError[];
}

export abstract class AudioDecoder {
    static readonly decoderMap: Map<AudioType, new () => AudioDecoder> =
        new Map();

    /**
     * 注册一个解码器
     * @param type 要注册的解码器允许解码的类型
     * @param decoder 解码器对象
     */
    static registerDecoder(type: AudioType, decoder: new () => AudioDecoder) {
        if (this.decoderMap.has(type)) {
            logger.warn(47, type);
            return;
        }
        this.decoderMap.set(type, decoder);
    }

    /**
     * 解码音频数据
     * @param data 音频文件数据
     * @param player AudioPlayer实例
     */
    static async decodeAudioData(data: Uint8Array, player: AudioPlayer) {
        // 检查头文件获取音频类型，仅检查前256个字节
        const toCheck = data.slice(0, 256);
        const type = checkAudioType(data);
        if (type === '') {
            logger.error(
                25,
                [...toCheck]
                    .map(v => v.toString(16).padStart(2, '0'))
                    .join(' ')
                    .toUpperCase()
            );
            return null;
        }
        if (isAudioSupport(type)) {
            if (data.buffer instanceof ArrayBuffer) {
                return player.ac.decodeAudioData(data.buffer);
            } else {
                return null;
            }
        } else {
            const Decoder = this.decoderMap.get(type);
            if (!Decoder) {
                return null;
            } else {
                const decoder = new Decoder();
                await decoder.create();
                const decodedData = await decoder.decodeAll(data);
                if (!decodedData) return null;
                const buffer = player.ac.createBuffer(
                    decodedData.channelData.length,
                    decodedData.channelData[0].length,
                    decodedData.sampleRate
                );
                decodedData.channelData.forEach((v, i) => {
                    buffer.copyToChannel(v, i);
                });
                decoder.destroy();
                return buffer;
            }
        }
    }

    /**
     * 创建音频解码器
     */
    abstract create(): Promise<void>;

    /**
     * 摧毁这个解码器
     */
    abstract destroy(): void;

    /**
     * 解码流数据
     * @param data 流数据
     */
    abstract decode(data: Uint8Array): Promise<IAudioDecodeData | undefined>;

    /**
     * 解码整个文件
     * @param data 文件数据
     */
    abstract decodeAll(data: Uint8Array): Promise<IAudioDecodeData | undefined>;

    /**
     * 当音频解码完成后，会调用此函数，需要返回之前还未解析或未返回的音频数据。调用后，该解码器将不会被再次使用
     */
    abstract flush(): Promise<IAudioDecodeData | undefined>;
}

export class VorbisDecoder extends AudioDecoder {
    decoder?: OggVorbisDecoderWebWorker;

    async create(): Promise<void> {
        this.decoder = new OggVorbisDecoderWebWorker();
        await this.decoder.ready;
    }

    destroy(): void {
        this.decoder?.free();
    }

    async decode(data: Uint8Array): Promise<IAudioDecodeData | undefined> {
        return this.decoder?.decode(data) as Promise<IAudioDecodeData>;
    }

    async decodeAll(data: Uint8Array): Promise<IAudioDecodeData | undefined> {
        return this.decoder?.decodeFile(data) as Promise<IAudioDecodeData>;
    }

    async flush(): Promise<IAudioDecodeData | undefined> {
        return this.decoder?.flush() as Promise<IAudioDecodeData>;
    }
}

export class OpusDecoder extends AudioDecoder {
    decoder?: OggOpusDecoderWebWorker;

    async create(): Promise<void> {
        this.decoder = new OggOpusDecoderWebWorker({
            speechQualityEnhancement: 'none'
        });
        await this.decoder.ready;
    }

    destroy(): void {
        this.decoder?.free();
    }

    async decode(data: Uint8Array): Promise<IAudioDecodeData | undefined> {
        return this.decoder?.decode(data) as Promise<IAudioDecodeData>;
    }

    async decodeAll(data: Uint8Array): Promise<IAudioDecodeData | undefined> {
        return this.decoder?.decodeFile(data) as Promise<IAudioDecodeData>;
    }

    async flush(): Promise<IAudioDecodeData | undefined> {
        return this.decoder?.flush() as Promise<IAudioDecodeData>;
    }
}
