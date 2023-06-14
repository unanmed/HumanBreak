import { EmitableEvent, EventEmitter } from '../common/eventEmitter';

const ac = new AudioContext();

interface BaseNode {
    node: AudioNode;
    channel?: number;
}

interface AudioPlayerEvent extends EmitableEvent {
    play: (node: AudioBufferSourceNode) => void;
    update: (audio: AudioBuffer) => void;
    end: (node: AudioBufferSourceNode) => void;
}

export class AudioPlayer extends EventEmitter<AudioPlayerEvent> {
    static ac: AudioContext = ac;
    static index: number = 0;

    /** 音频的索引，这样的话可以复用来提高性能表现 */
    index: number = AudioPlayer.index++;

    data: ArrayBuffer;
    buffer: AudioBuffer | null = null;
    source?: AudioBufferSourceNode;

    baseNode: BaseNode[] = [];

    constructor(data: ArrayBuffer) {
        super();
        this.data = data;
        this.update(data);
    }

    /**
     * 更新音频数据
     * @param data 音频的ArrayBuffer数据
     */
    async update(data: ArrayBuffer) {
        this.data = data;
        this.buffer = await ac.decodeAudioData(data);
        this.emit('update', this.buffer);
    }

    /**
     * 获取音频源数据节点
     */
    getSource() {
        this.source ??= ac.createBufferSource();
        this.source.buffer = this.buffer;

        return this.source;
    }

    /**
     * 播放音频
     */
    play(when?: number, offset?: number, duration?: number) {
        if (!this.source) return;
        this.ready();
        this.source?.start(when, offset, duration);

        const source = this.source;
        this.source?.addEventListener('ended', ev => {
            this.emit('end', source);
        });
        this.emit('play', source);

        delete this.source;
        return source;
    }

    /**
     * 准备音频资源连接
     */
    ready() {
        const source = this.getSource();
        this.baseNode.forEach(v => {
            source.connect(v.node, 0, v.channel);
        });
    }

    /**
     * 获取音频输出destination
     */
    getDestination() {
        return ac.destination;
    }
}
