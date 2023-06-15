import { has } from '../../plugin/utils';
import { AudioPlayer } from './audio';
import resource from '../../data/resource.json';

export class SoundEffect extends AudioPlayer {
    static playIndex = 0;

    private playing: Record<string, AudioBufferSourceNode> = {};
    private _stopingAll: boolean = false;
    private playMap: Map<AudioBufferSourceNode, number> = new Map();

    stereo: boolean = false;

    gain: GainNode = AudioPlayer.ac.createGain();
    panner: PannerNode | null = null;
    merger: ChannelMergerNode | null = null;

    constructor(data: ArrayBuffer, stereo: boolean = false) {
        super(data);

        this.on('end', node => {
            if (this._stopingAll) return;
            const index = this.playMap.get(node);
            if (!index) return;
            delete this.playing[index];
        });
        this.on('update', () => {
            this.initAudio(this.stereo);
        });

        this.stereo = stereo;
    }

    /**
     * 设置音频路由线路
     * @param stereo 是否启用立体声
     */
    protected initAudio(stereo: boolean = false) {
        const channel = this.buffer?.numberOfChannels;
        const ac = AudioPlayer.ac;
        if (!channel) return;
        if (stereo) {
            this.panner = ac.createPanner();
            this.panner.connect(this.gain);
            if (channel === 1) {
                this.merger = ac.createChannelMerger();
                this.merger.connect(this.panner);
                this.baseNode = [
                    { node: this.merger, channel: 0 },
                    { node: this.merger, channel: 1 }
                ];
            } else {
                this.baseNode = [{ node: this.panner }];
            }
        } else {
            this.baseNode = [{ node: this.gain }];
        }
        this.gain.connect(this.getDestination());
    }

    /**
     * 播放音频
     * @returns 音频的唯一id
     */
    playSE() {
        const node = this.play();
        if (!node) return;
        const index = SoundEffect.playIndex++;
        this.playing[index] = node;
        this.playMap.set(node, index);
        return index;
    }

    /**
     * 停止所有音频
     */
    stopAll() {
        this._stopingAll = true;
        Object.values(this.playing).forEach(v => {
            v.stop();
        });
        this.playing = {};
        this._stopingAll = false;
    }

    /**
     * 根据唯一id停止音频
     * @param index 音频唯一id
     */
    stopByIndex(index: number) {
        this.playing[index]?.stop();
        delete this.playing[index];
    }
}

class SoundController {
    list: Record<string, SoundEffect> = {};

    private seIndex: Record<number, SoundEffect> = {};

    /**
     * 添加一个新的音频
     * @param uri 音频的uri
     * @param data 音频的ArrayBuffer信息，会被解析为AudioBuffer
     */
    add(uri: string, data: ArrayBuffer) {
        const stereo = resource.stereoSE.includes(uri);
        const se = new SoundEffect(data, stereo);
        if (this.list[uri]) {
            console.warn(`Repeated sound effect: ${uri}.`);
        }
        return (this.list[uri] = se);
    }

    /**
     * 移除一个音频
     * @param uri 要移除的音频的uri
     */
    remove(uri: string) {
        delete this.list[uri];
    }

    /**
     * 播放音频
     * @param sound 音效的名称
     * @returns 本次播放的音效的唯一标识符，如果音效不存在返回-1
     */
    play(sound: SoundIds): number {
        const se = this.get(sound);
        const index = se.playSE();
        if (!has(index)) return -1;
        this.seIndex[index] = se;

        return index;
    }

    /**
     * 停止一个音效的播放
     * @param id 音效的唯一标识符
     */
    stop(id: number) {
        const se = this.seIndex[id];
        se.stopByIndex(id);
    }

    /**
     * 停止一个名称的所有音效的播放
     * @param id 音效名称
     */
    stopById(id: SoundIds) {
        const se = this.get(id);
        se.stopAll();
    }

    /**
     * 停止所有音效的播放
     */
    stopAll() {
        Object.values(this.list).forEach(v => v.stopAll());
    }

    /**
     * 获取一个音效实例
     * @param sound 音效名称
     */
    get(sound: SoundIds) {
        return this.list[`sounds.${sound}`];
    }
}

declare global {
    interface AncTe {
        sound: SoundController;
    }
}
ancTe.sound = new SoundController();
