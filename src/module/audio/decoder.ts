import { OggVorbisDecoder } from '@wasm-audio-decoders/ogg-vorbis';
import { IAudioDecodeData, IAudioDecoder } from './source';
import { OggOpusDecoder } from 'ogg-opus-decoder';

export class VorbisDecoder implements IAudioDecoder {
    decoder?: OggVorbisDecoder;

    async create(): Promise<void> {
        this.decoder = new OggVorbisDecoder();
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

export class OpusDecoder implements IAudioDecoder {
    decoder?: OggOpusDecoder;

    async create(): Promise<void> {
        this.decoder = new OggOpusDecoder();
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
