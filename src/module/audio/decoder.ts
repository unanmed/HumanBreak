import { OggVorbisDecoderWebWorker } from '@wasm-audio-decoders/ogg-vorbis';
import { IAudioDecodeData, IAudioDecoder } from './source';
import { OggOpusDecoderWebWorker } from 'ogg-opus-decoder';

export class VorbisDecoder implements IAudioDecoder {
    decoder?: OggVorbisDecoderWebWorker;

    async create(): Promise<void> {
        this.decoder = new OggVorbisDecoderWebWorker();
        await this.decoder.ready;
    }

    destroy(): void {
        this.decoder?.free();
    }

    async decode(data: Uint8Array): Promise<IAudioDecodeData | undefined> {
        return this.decoder?.decode(data);
    }

    async flush(): Promise<IAudioDecodeData | undefined> {
        return this.decoder?.flush();
    }
}

export class OpusDecoder implements IAudioDecoder {
    decoder?: OggOpusDecoderWebWorker;

    async create(): Promise<void> {
        this.decoder = new OggOpusDecoderWebWorker();
        await this.decoder.ready;
    }

    destroy(): void {
        this.decoder?.free();
    }

    async decode(data: Uint8Array): Promise<IAudioDecodeData | undefined> {
        return this.decoder?.decode(data);
    }

    async flush(): Promise<IAudioDecodeData | undefined> {
        return await this.decoder?.flush();
    }
}
