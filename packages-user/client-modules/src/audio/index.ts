import { loadAllBgm } from './bgm';
import { OpusDecoder, VorbisDecoder } from './decoder';
import { AudioType } from './support';
import { AudioDecoder } from './decoder';

export function createAudio() {
    loadAllBgm();
    AudioDecoder.registerDecoder(AudioType.Ogg, VorbisDecoder);
    AudioDecoder.registerDecoder(AudioType.Opus, OpusDecoder);
}

export * from './support';
export * from './effect';
export * from './player';
export * from './source';
export * from './bgm';
export * from './decoder';
export * from './sound';
