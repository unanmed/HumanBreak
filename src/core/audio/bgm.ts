import { Animation, TimingFn, Transition, linear, sleep } from 'mutate-animate';
import { Undoable } from '../interface';
import { ResourceController } from '../loader/controller';
import { has } from '@/plugin/utils';

interface AnimatingBgm {
    end: () => void;
    ani: Transition;
    timeout: number;
    currentTime: number;
    endVolume: number;
}

export class BgmController
    extends ResourceController<HTMLAudioElement>
    implements Undoable<BgmIds>
{
    /** Bgm播放栈，可以undo，最多存放10个 */
    stack: BgmIds[] = [];
    /** Bgm的redo栈，最多存放10个 */
    redoStack: BgmIds[] = [];
    /** 当前播放的bgm */
    now?: BgmIds;

    /** 渐变切歌时长 */
    transitionTime: number = 2000;
    /** 渐变切歌的音量曲线 */
    transitionCurve: TimingFn = linear();

    /** 音量 */
    volume: number = 1;
    /** 是否关闭了bgm */
    disable: boolean = false;

    /** 是否正在播放bgm */
    playing: boolean = false;

    private transitionData: Map<BgmIds, AnimatingBgm> = new Map();

    /**
     * 添加一个bgm
     * @param uri bgm的`uri`，由于bgm是一类资源，因此`uri`为`bgms.xxx`的形式
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
     * 加载一个bgm
     * @param id 要加载的bgm
     */
    load(id: BgmIds) {
        const bgm = this.get(id);
        bgm.load();
    }

    /**
     * 切换bgm，具有渐变效果，可以通过监听切换事件，同时调用preventDefault来阻止渐变，
     * 并使用自己的切歌程序。阻止后，不会将切换的歌曲加入播放栈，也不会进行切歌，
     * 所有的切歌操作均由你自己的程序执行
     * @param id 要切换至的bgm
     * @param when 切换至的歌从什么时候开始播放，默认-1，表示不改变，整数表示设置为目标值
     */
    changeTo(id: BgmIds, when: number = -1, noStack: boolean = false) {
        if (id === this.now) return;
        let prevent = false;
        const preventDefault = () => {
            prevent = true;
        };
        const ev = { preventDefault };

        this.emit('changeBgm', ev, id, this.now);

        if (prevent) return;

        this.playing = true;
        if (!this.disable) {
            this.setTransitionAnimate(id, 1);
            if (this.now) this.setTransitionAnimate(this.now, 0, when);
        }

        if (!noStack) {
            if (this.now) this.stack.push(this.now);
            this.redoStack = [];
        }
        this.now = id;
    }

    /**
     * 暂停当前bgm的播放，继续播放时将会延续暂停的时刻，同样可以使用preventDefault使用自己的暂停程序
     * @param transition 是否使用渐变效果，默认使用
     */
    pause(transition: boolean = true) {
        if (!this.now) return;
        let prevent = false;
        const preventDefault = () => {
            prevent = true;
        };
        const ev = { preventDefault };

        this.emit('pause', ev, this.now);

        if (prevent) return;

        this.playing = false;

        if (transition) this.setTransitionAnimate(this.now, 0);
        else this.get(this.now).pause();
    }

    /**
     * 继续当前bgm的播放，从上一次暂停的时刻开始播放，同样可以使用preventDefault使用自己的播放程序
     * @param transition 是否使用渐变效果，默认使用
     */
    resume(transition: boolean = true) {
        if (!this.now) return;
        let prevent = false;
        const preventDefault = () => {
            prevent = true;
        };
        const ev = { preventDefault };

        this.emit('resume', ev, this.now);

        if (prevent) return;

        this.playing = true;

        if (!this.disable) {
            if (transition) this.setTransitionAnimate(this.now, 1);
            else this.get(this.now).play();
        }
    }

    /**
     * 播放bgm，不进行渐变操作，效果为没有渐变的切歌，也会触发changeBgm事件，可以被preventDefault
     * @param id 要播放的bgm
     * @param when 从bgm的何时开始播放
     */
    play(id: BgmIds, when: number = 0, noStack: boolean = false) {
        if (id === this.now) return;
        let prevent = false;
        const preventDefault = () => {
            prevent = true;
        };
        const ev = { preventDefault };

        this.emit('changeBgm', ev, id, this.now);

        if (prevent) return;

        this.playing = true;

        const before = this.now ? null : this.get(this.now!);
        const to = this.get(id);
        if (before) {
            before.pause();
        }
        to.currentTime = when;
        to.volume = this.volume;
        to.play();

        if (!this.disable) {
            if (!noStack) {
                if (this.now) this.stack.push(this.now);
                this.redoStack = [];
            }
            this.now = id;
        }
    }

    /**
     * 撤销当前播放，改为播放前一个bgm
     */
    undo(transition: boolean = true, when: number = 0) {
        if (this.stack.length === 0) return;
        else {
            const to = this.stack.pop()!;
            if (this.now) this.redoStack.push(this.now);
            else return;

            if (transition) this.changeTo(to, when, true);
            else this.play(to, when, true);
            return this.now;
        }
    }

    /**
     * 取消上一次的撤销，改为播放上一次撤销的bgm
     */
    redo(transition: boolean = true, when: number = 0) {
        if (this.redoStack.length === 0) return;
        else {
            const to = this.redoStack.pop()!;
            if (this.now) this.stack.push(this.now);
            else return;

            if (transition) this.changeTo(to, when, true);
            else this.play(to, when, true);
            return this.now;
        }
    }

    /**
     * 设置渐变切歌信息
     * @param time 渐变时长
     * @param curve 渐变的音量曲线
     */
    setTransition(time?: number, curve?: TimingFn) {
        has(time) && (this.transitionTime = time);
        has(curve) && (this.transitionCurve = curve);
    }

    /**
     * 根据id获取bgm
     * @param id 要获取的bgm的id
     */
    get(id: BgmIds) {
        return this.list[`bgms.${id}`];
    }

    private setTransitionAnimate(id: BgmIds, to: number, when: number = -1) {
        const bgm = this.get(id);

        let tran = this.transitionData.get(id);
        if (!tran) {
            const ani = new Transition();
            ani.value.volume = bgm.paused ? 0 : 1;
            const end = () => {
                ani.ticker.destroy();
                if (tran!.endVolume === 0) {
                    bgm.pause();
                } else {
                    bgm.volume = tran!.endVolume * this.volume;
                }
                this.transitionData.delete(id);
            };
            tran = {
                end,
                ani: ani,
                timeout: -1,
                currentTime: bgm.currentTime,
                endVolume: to
            };
            this.transitionData.set(id, tran);
            ani.ticker.add(() => {
                bgm.volume = ani.value.volume * this.volume;
            });
        }

        if (to !== 0) {
            bgm.volume = tran.ani.value.volume * this.volume;
            if (bgm.paused) bgm.play();
        }
        if (when !== -1) {
            bgm.currentTime = when;
        }
        tran.endVolume = to;

        tran.ani
            .time(this.transitionTime)
            .mode(this.transitionCurve)
            .absolute()
            .transition('volume', to);

        if (tran.timeout !== -1) {
            clearTimeout(tran.timeout);
        }
        tran.timeout = window.setTimeout(tran.end, this.transitionTime);
    }
}

export const bgm = new BgmController();
