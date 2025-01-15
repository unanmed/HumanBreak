import { loadAllBgm } from './bgmLoader';
import { OpusDecoder, VorbisDecoder } from './decoder';
import { AudioStreamSource } from './source';
import { AudioType } from './support';

loadAllBgm();
AudioStreamSource.registerDecoder(AudioType.Ogg, VorbisDecoder);
AudioStreamSource.registerDecoder(AudioType.Opus, OpusDecoder);

export * from './support';
export * from './effect';
export * from './player';
export * from './source';
export * from './bgmLoader';
