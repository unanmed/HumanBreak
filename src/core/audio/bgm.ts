import { has } from '../../plugin/utils';
import { ResourceController } from '../loader/controller';

export class BgmController extends ResourceController<HTMLAudioElement> {
    playing?: BgmIds;
    lastBgm?: BgmIds;

    /**
     * 添加一个bgm
     * @param uri bgm的uri
     * @param data bgm音频元素
     */
    add(uri: string, data: HTMLAudioElement) {
        if (this.list[uri]) {
            console.warn(`Repeated bgm: '${uri}'.`);
        }
        this.list[uri] = data;
        data.loop = true;
    }

    /**
     * 切换bgm
     * @param id bgm的id
     */
    play(id: BgmIds, when: number = 0) {
        if (this.playing === id) return;
        this.pause();
        if (core.musicStatus.bgmStatus) {
            const bgm = this.get(id);
            bgm.currentTime = when;
            bgm.volume = core.musicStatus.userVolume;
            bgm.play();
            this.playing = id;
        } else {
            delete this.playing;
        }
        this.lastBgm = id;
    }

    /**
     * 加载一个bgm
     * @param id 要加载的bgm
     */
    load(id: BgmIds) {
        const bgm = this.get(id);
        bgm.load();
    }

    /**
     * 停止当前的bgm播放
     */
    pause() {
        if (!has(this.playing)) return;
        const bgm = this.get(this.playing);
        bgm.pause();
        delete this.playing;
    }

    /**
     * 继续上一个BGM的播放
     */
    resume() {
        if (has(this.playing) || !this.lastBgm) return;
        const bgm = this.get(this.lastBgm);
        bgm.play();
        this.playing = this.lastBgm;
    }

    get(id: BgmIds) {
        return this.list[`bgms.${id}`];
    }
}
