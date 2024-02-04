import { has } from '@/plugin/utils';
import { AudioParamOf, AudioPlayer } from './audio';
import resource from '@/data/resource.json';
import { ResourceController } from '../loader/controller';

// todo: 立体声，可设置音源位置

type Panner = AudioParamOf<PannerNode>;
type Listener = AudioParamOf<AudioListener>;

export class SoundEffect extends AudioPlayer {
    static playIndex = 0;

    private playing: Record<string, AudioBufferSourceNode> = {};
    private _stopingAll: boolean = false;
    private playMap: Map<AudioBufferSourceNode, number> = new Map();

    private _stereo: boolean = false;

    gain: GainNode = AudioPlayer.ac.createGain();
    panner: PannerNode | null = null;
    merger: ChannelMergerNode | null = null;

    set volumn(value: number) {
        this.gain.gain.value = value;
    }
    get volumn(): number {
        return this.gain.gain.value;
    }

    set stereo(value: boolean) {
        if (value !== this._stereo) this.initAudio(value);
        this._stereo = value;
    }
    get stereo(): boolean {
        return this._stereo;
    }

    constructor(data: ArrayBuffer, stereo: boolean = true) {
        super(data);

        this.on('end', node => {
            if (this._stopingAll) return;
            const index = this.playMap.get(node);
            if (!index) return;
            delete this.playing[index];
            this.playMap.delete(node);
        });
        this.on('update', () => {
            this.initAudio(this._stereo);
        });

        this._stereo = stereo;
    }

    /**
     * 设置音频路由线路
     * ```txt
     * 不启用立体声：source -> gain -> destination
     * 启用立体声：source -> panner -> gain --> destination
     * 单声道立体声：source -> merger -> panner -> gain -> destination
     * 单声道立体声指音源为单声道，合成为双声道后模拟为立体声
     * ```
     * @param stereo 是否启用立体声
     */
    protected initAudio(stereo: boolean = true) {
        const channel = this.buffer?.numberOfChannels;
        const ac = AudioPlayer.ac;
        if (!channel) return;
        this.panner = null;
        this.merger = null;
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
        this.playMap.clear();
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

    /**
     * 设置立体声信息
     * @param source 立体声声源位置与朝向
     * @param listener 听者的位置、头顶方向、面朝方向
     */
    setPanner(source: Partial<Panner>, listener: Partial<Listener>) {
        if (!this.panner) return;
        for (const [key, value] of Object.entries(source)) {
            this.panner[key as keyof Panner].value = value;
        }
        const l = AudioPlayer.ac.listener;
        for (const [key, value] of Object.entries(listener)) {
            l[key as keyof Listener].value = value;
        }
    }
}

export class SoundController extends ResourceController<
    ArrayBuffer,
    SoundEffect
> {
    private seIndex: Record<string, SoundEffect> = {};

    /**
     * 添加一个新的音频
     * @param uri 音频的uri
     * @param data 音频的ArrayBuffer信息，会被解析为AudioBuffer
     */
    add(uri: string, data: ArrayBuffer) {
        const stereo = resource.stereoSE.includes(uri);
        const se = new SoundEffect(data, stereo);
        if (this.list[uri]) {
            console.warn(`Repeated sound effect: '${uri}'.`);
        }
        return (this.list[uri] = se);
    }

    /**
     * 播放音频
     * @param sound 音效的名称
     * @returns 本次播放的音效的唯一标识符，如果音效不存在返回-1
     */
    play(sound: SoundIds, end?: () => void): number {
        const se = this.get(sound);
        const index = se.playSE();
        if (!has(index)) return -1;
        this.seIndex[index] = se;
        if (end) se.once('end', end);
        se.volumn = core.musicStatus.userVolume;

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

    getPlaying(sound?: SoundIds) {
        if (sound) {
            const se = this.get(sound);
            return Object.keys(this.seIndex).filter(
                v => this.seIndex[v] === se
            );
        } else {
            return Object.keys(this.seIndex);
        }
    }
}

export const sound = new SoundController();
