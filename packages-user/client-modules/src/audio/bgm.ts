import EventEmitter from 'eventemitter3';
import { audioPlayer, AudioPlayer, AudioRoute, AudioStatus } from './player';
import { guessTypeByExt, isAudioSupport } from './support';
import { logger } from '@motajs/common';
import { StreamLoader } from '../loader';
import { linear, sleep, Transition } from 'mutate-animate';
import { VolumeEffect } from './effect';

interface BgmVolume {
    effect: VolumeEffect;
    transition: Transition;
}

interface BgmControllerEvent {
    play: [];
    pause: [];
    resume: [];
    stop: [];
}

export class BgmController<
    T extends string = BgmIds
> extends EventEmitter<BgmControllerEvent> {
    /** bgm音频名称的前缀 */
    prefix: string = 'bgms.';
    /** 每个 bgm 的音量控制器 */
    readonly gain: Map<T, BgmVolume> = new Map();

    /** 正在播放的 bgm */
    playingBgm?: T;
    /** 是否正在播放 */
    playing: boolean = false;

    /** 是否已经启用 */
    enabled: boolean = true;
    /** 主音量控制器 */
    private readonly mainGain: VolumeEffect;
    /** 是否屏蔽所有的音乐切换 */
    private blocking: boolean = false;
    /** 渐变时长 */
    private transitionTime: number = 2000;

    constructor(public readonly player: AudioPlayer) {
        super();
        this.mainGain = player.createVolumeEffect();
    }

    /**
     * 设置音频渐变时长
     * @param time 渐变时长
     */
    setTransitionTime(time: number) {
        this.transitionTime = time;
        for (const [, value] of this.gain) {
            value.transition.time(time);
        }
    }

    /**
     * 屏蔽音乐切换
     */
    blockChange() {
        this.blocking = true;
    }

    /**
     * 取消屏蔽音乐切换
     */
    unblockChange() {
        this.blocking = false;
    }

    /**
     * 设置总音量大小
     * @param volume 音量大小
     */
    setVolume(volume: number) {
        this.mainGain.setVolume(volume);
    }

    /**
     * 获取总音量大小
     */
    getVolume() {
        return this.mainGain.getVolume();
    }

    /**
     * 设置是否启用
     * @param enabled 是否启用
     */
    setEnabled(enabled: boolean) {
        if (enabled) this.resume();
        else this.stop();
        this.enabled = enabled;
    }

    /**
     * 设置 bgm 音频名称的前缀
     */
    setPrefix(prefix: string) {
        this.prefix = prefix;
    }

    private getId(name: T) {
        return `${this.prefix}${name}`;
    }

    /**
     * 根据 bgm 名称获取其 AudioRoute 实例
     * @param id 音频名称
     */
    get(id: T) {
        return this.player.getRoute(this.getId(id));
    }

    /**
     * 添加一个 bgm
     * @param id 要添加的 bgm 的名称
     * @param url 指定 bgm 的加载地址
     */
    addBgm(id: T, url: string = `project/bgms/${id}`) {
        const type = guessTypeByExt(id);
        if (!type) {
            logger.warn(50, id.split('.').slice(0, -1).join('.'));
            return;
        }
        const gain = this.player.createVolumeEffect();
        if (isAudioSupport(type)) {
            const source = audioPlayer.createElementSource();
            source.setSource(url);
            source.setLoop(true);
            const route = new AudioRoute(source, audioPlayer);
            route.addEffect([gain, this.mainGain]);
            audioPlayer.addRoute(this.getId(id), route);
            this.setTransition(id, route, gain);
        } else {
            const source = audioPlayer.createStreamSource();
            const stream = new StreamLoader(url);
            stream.pipe(source);
            source.setLoop(true);
            const route = new AudioRoute(source, audioPlayer);
            route.addEffect([gain, this.mainGain]);
            audioPlayer.addRoute(this.getId(id), route);
            this.setTransition(id, route, gain);
        }
    }

    /**
     * 移除一个 bgm
     * @param id 要移除的 bgm 的名称
     */
    removeBgm(id: T) {
        this.player.removeRoute(this.getId(id));
        const gain = this.gain.get(id);
        gain?.transition.ticker.destroy();
        this.gain.delete(id);
    }

    private setTransition(id: T, route: AudioRoute, gain: VolumeEffect) {
        const transition = new Transition();
        transition
            .time(this.transitionTime)
            .mode(linear())
            .transition('volume', 0);

        const tick = () => {
            gain.setVolume(transition.value.volume);
        };

        /**
         * @param expect 在结束时应该是正在播放还是停止
         */
        const setTick = async (expect: AudioStatus) => {
            transition.ticker.remove(tick);
            transition.ticker.add(tick);
            const identifier = route.stopIdentifier;
            await sleep(this.transitionTime + 500);
            if (
                route.status === expect &&
                identifier === route.stopIdentifier
            ) {
                transition.ticker.remove(tick);
                if (route.status === AudioStatus.Playing) {
                    gain.setVolume(1);
                } else {
                    gain.setVolume(0);
                }
            }
        };

        route.onStart(async () => {
            transition.transition('volume', 1);
            setTick(AudioStatus.Playing);
        });
        route.onEnd(() => {
            transition.transition('volume', 0);
            setTick(AudioStatus.Paused);
        });
        route.setEndTime(this.transitionTime);

        this.gain.set(id, { effect: gain, transition });
    }

    /**
     * 播放一个 bgm
     * @param id 要播放的 bgm 名称
     */
    play(id: T, when?: number) {
        if (this.blocking) return;
        if (id !== this.playingBgm && this.playingBgm) {
            this.player.pause(this.getId(this.playingBgm));
        }
        this.playingBgm = id;
        if (!this.enabled) return;
        this.player.play(this.getId(id), when);
        this.playing = true;
        this.emit('play');
    }

    /**
     * 继续当前的 bgm
     */
    resume() {
        if (this.blocking || !this.enabled || this.playing) return;
        if (this.playingBgm) {
            this.player.resume(this.getId(this.playingBgm));
        }
        this.playing = true;
        this.emit('resume');
    }

    /**
     * 暂停当前的 bgm
     */
    pause() {
        if (this.blocking || !this.enabled) return;
        if (this.playingBgm) {
            this.player.pause(this.getId(this.playingBgm));
        }
        this.playing = false;
        this.emit('pause');
    }

    /**
     * 停止当前的 bgm
     */
    stop() {
        if (this.blocking || !this.enabled) return;
        if (this.playingBgm) {
            this.player.stop(this.getId(this.playingBgm));
        }
        this.playing = false;
        this.emit('stop');
    }
}

export const bgmController = new BgmController<BgmIds>(audioPlayer);

export function loadAllBgm() {
    const { loading } = Mota.require('@user/data-base');
    loading.once('coreInit', () => {
        const data = data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d;
        for (const bgm of data.main.bgms) {
            bgmController.addBgm(bgm);
        }
    });
}
