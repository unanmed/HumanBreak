import { has } from '../../plugin/utils';
import { ResourceController } from '../loader/controller';

class BgmController extends ResourceController<HTMLAudioElement> {
    playing?: BgmIds;

    /**
     * 添加一个bgm
     * @param uri bgm的uri
     * @param data bgm音频元素
     */
    add(uri: string, data: HTMLAudioElement) {
        if (this.list[uri]) {
            console.warn(`Repeated bgm: '${uri}'`);
        }
        this.list[uri] = data;
        data.loop = true;
    }

    /**
     * 切换bgm
     * @param id bgm的id
     */
    play(id: BgmIds) {
        const bgm = this.get(id);
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
    stop() {
        if (!has(this.playing)) return;
        const bgm = this.get(this.playing);
        bgm.pause();
    }

    get(id: BgmIds) {
        return this.list[`bgm.${id}`];
    }
}

declare global {
    interface AncTe {
        bgm: BgmController;
    }
}
ancTe.bgm = new BgmController();
