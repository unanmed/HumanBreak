const audio = new Audio();

const supportMap = new Map<string, boolean>();

/**
 * 检查一种音频类型是否能被播放
 * @param type 音频类型
 */
export function isAudioSupport(type: string): boolean {
    if (supportMap.has(type)) return supportMap.get(type)!;
    else {
        const support = audio.canPlayType(type);
        const canPlay = support === 'maybe' || support === 'probably';
        supportMap.set(type, canPlay);
        return canPlay;
    }
}

const typeMap = new Map<string, string>([
    ['ogg', 'audio/ogg; codecs="vorbis"'],
    ['mp3', 'audio/mpeg'],
    ['wav', 'audio/wav; codecs="1"'],
    ['flac', 'audio/flac'],
    ['opus', 'audio/ogg; codecs="opus"'],
    ['acc', 'audio/acc']
]);

/**
 * 根据文件名拓展猜测其类型
 * @param file 文件名
 */
export function guessTypeByExt(file: string) {
    const ext = /\.[a-zA-Z]$/.exec(file);
    if (!ext?.[0]) return '';
    const type = ext[0].slice(1);
    return typeMap.get(type.toLocaleLowerCase()) ?? '';
}

isAudioSupport('audio/ogg; codecs="vorbis"');
isAudioSupport('audio/mpeg');
isAudioSupport('audio/wav; codecs="1"');
isAudioSupport('audio/flac');
isAudioSupport('audio/ogg; codecs="opus"');
isAudioSupport('audio/acc');

console.log(supportMap);
