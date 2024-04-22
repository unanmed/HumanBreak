import BoxAnimate from '@/components/boxAnimate.vue';
import { EmitableEvent, EventEmitter } from '@/core/common/eventEmitter';
import { logger } from '@/core/common/logger';
import { ResponseBase } from '@/core/interface';
import { deleteWith, ensureArray, parseCss, tip } from '@/plugin/utils';
import axios, { toFormData } from 'axios';
import { Component, VNode, h, ref, shallowReactive } from 'vue';
/* @__PURE__ */ import { id, password } from '../../../../user';
import { mainSetting } from '../setting';

type CSSObj = Partial<Record<CanParseCss, string>>;

interface DanmakuResponse extends ResponseBase {
    total: number;
    list: DanmakuInfo[];
}

interface DanmakuInfo {
    id: number;
    comment: string;
    tags: string;
    love: number;
}

interface DanmakuPostInfo extends Partial<DanmakuContentInfo> {
    type: 1 | 2 | 3;
    towername: 'HumanBreak';
    id?: number;
}

interface DanmakuContentInfo {
    comment: string;
    tags: string;
}

interface PostDanmakuResponse extends ResponseBase {
    id: number;
}

interface PostLikeResponse extends ResponseBase {
    liked: boolean;
}

interface DanmakuEvent extends EmitableEvent {
    showStart: (danmaku: Danmaku) => void;
    showEnd: (danmaku: Danmaku) => void;
    like: (liked: boolean, danmaku: Danmaku) => void;
}

type SpecContentFn = (content: string, type: string) => VNode;

export class Danmaku extends EventEmitter<DanmakuEvent> {
    static num: number = 0;
    static backend: string = `/backend/tower/barrage.php`;
    static all: Set<Danmaku> = new Set();
    static allInPos: Partial<Record<FloorIds, Record<LocString, Danmaku>>> = {};

    static showList: Danmaku[] = shallowReactive([]);
    static showMap: Map<number, Danmaku> = new Map();
    static specList: Record<string, SpecContentFn> = {};

    num: number = Danmaku.num++;

    id: number = -1;
    text: string = '';
    x: number = 0;
    y: number = 0;
    floor?: FloorIds;
    showing: boolean = false;
    likedNum: number = 0;
    liked: boolean = false;

    style: CSSObj = {};
    textColor: string = 'white';
    strokeColor: string = 'black';

    private posted: boolean = false;
    private vNode?: VNode;
    private posting: boolean = false;

    /**
     * 发送弹幕
     * @returns 弹幕发送的 Axios Post 信息，为 Promise
     */
    async post() {
        if (this.posted || this.posting) {
            logger.warn(5, `Repeat post danmaku.`);
            return Promise.resolve();
        }

        const data: DanmakuPostInfo = {
            type: 2,
            towername: 'HumanBreak',
            ...this.encode()
        };

        this.posting = true;
        const form = toFormData(data);
        /* @__PURE__ */ form.append('userid', id);
        /* @__PURE__ */ form.append('password', password);

        try {
            const res = await axios.post<PostDanmakuResponse>(
                Danmaku.backend,
                form
            );

            this.id = res.data.id;
            this.posting = false;

            return res;
        } catch (e) {
            this.posted = false;
            this.posting = false;
            logger.error(
                3,
                `Unexpected error when posting danmaku. Error info: ${e}`
            );
            return Promise.resolve();
        }
    }

    /**
     * 将弹幕整合为可以发送的格式
     */
    encode(): DanmakuContentInfo {
        const css = this.getEncodedCSS();
        return {
            comment: this.text,
            tags: JSON.stringify([
                `!css:${JSON.stringify(css)}`,
                `!pos:${this.x},${this.y},${this.floor}`
            ])
        };
    }

    /**
     * 解析弹幕信息
     * @param info 要被解析的弹幕信息
     */
    decode(info: DanmakuContentInfo) {
        this.text = info.comment;

        ensureArray(JSON.parse(info.tags) as string[]).forEach(v => {
            if (v.startsWith('!css:')) {
                this.style = JSON.parse(v.slice(5));
            } else if (v.startsWith('!pos:')) {
                const [x, y, f] = v.slice(5).split(',');
                this.x = parseInt(x);
                this.y = parseInt(y);
                this.floor = f as FloorIds;
            } else {
                logger.warn(3, `Unknown danmaku tag: ${v}`);
            }
        });
    }

    getEncodedCSS() {
        const css = JSON.parse(JSON.stringify(this.style)) as CSSObj;
        if (!css.color) css.color = this.textColor;
        if (!css.textShadow)
            css.textShadow = `1px 1px 1px ${this.strokeColor}, 1px -1px 1px ${this.strokeColor}, -1px 1px 1px ${this.strokeColor}, -1px -1px 1px ${this.strokeColor}`;
        return css;
    }

    /**
     * 设置文字的颜色
     * @param fill 填充颜色
     * @param stroke 描边颜色
     */
    color(fill?: string, stroke?: string) {
        fill && (this.textColor = fill);
        stroke && (this.strokeColor = stroke);
    }

    /**
     * 添加一个图标
     * @param icon 要显示的图标id
     */
    addIcon(icon: AllIds) {
        this.text += `[i:${icon}]`;
    }

    /**
     * 设置这个弹幕整体的css信息
     * @param str css字符串
     * @param overwrite 是否完全覆写原来的css
     */
    css(str: string, overwrite?: boolean): void;
    /**
     * 设置这个弹幕整体的css信息
     * @param str css对象，参考 CSSStyleDeclaration
     * @param overwrite 是否完全覆写原来的css
     */
    css(obj: CSSObj, overwrite?: boolean): void;
    css(obj: string | CSSObj, overwrite: boolean = false) {
        const res = typeof obj === 'string' ? parseCss(obj) : obj;
        if (overwrite) this.style = res;
        else {
            this.style = { ...this.style, ...res };
        }
    }

    /**
     * 将这个弹幕添加至弹幕列表
     */
    addToList() {
        Danmaku.all.add(this);
        if (!this.floor) return;
        Danmaku.allInPos[this.floor] ??= {};
        Danmaku.allInPos[this.floor]![`${this.x},${this.y}`] = this;
    }

    /**
     * 解析这个弹幕为 VNode
     */
    parse() {
        let pointer = -1;
        let ignore = false;

        let str = '';

        let spec = false;
        let specType = '';
        let specTypeEnd = false;
        let specContent = '';

        const children: VNode[] = [];

        while (++pointer < this.text.length) {
            const char = this.text[pointer];

            if (char === '\\' && !ignore) {
                ignore = true;
                continue;
            }

            if (ignore) {
                str += char;
                continue;
            }

            if (char === '[') {
                spec = true;
                children.push(h('span', str));
                str = '';
                continue;
            }

            if (char === ']') {
                if (!spec) {
                    logger.warn(4, `Ignored a mismatched ']' in danmaku.`);
                    str += char;
                } else {
                    spec = false;
                    specTypeEnd = false;
                    children.push(this.createSpecVNode(specType, specContent));
                    specType = '';
                    specContent = '';
                }
                continue;
            }

            if (spec) {
                if (!specTypeEnd) {
                    if (char !== ':') {
                        specType += char;
                    } else {
                        specTypeEnd = true;
                    }
                } else {
                    specContent += char;
                }
                continue;
            }

            str += char;
        }

        if (str.length > 0) {
            children.push(h('span', str));
        }

        return h(
            'span',
            { class: 'danmaku', style: this.getEncodedCSS() },
            children
        );
    }

    /**
     * 获取本弹幕的VNode
     */
    getVNode(nocache: boolean = false) {
        if (nocache) return (this.vNode = this.parse());
        return this.vNode ?? (this.vNode = this.parse());
    }

    /**
     * 显示这个弹幕
     */
    show() {
        this.showing = true;
        Danmaku.showList.push(this);
        Danmaku.showMap.set(this.id, this);
        this.emit('showStart', this);
    }

    /**
     * 显示结束这个弹幕
     */
    showEnd() {
        this.showing = false;
        deleteWith(Danmaku.showList, this);
        Danmaku.showMap.delete(this.id);
        this.emit('showEnd', this);
    }

    /**
     * 点赞或取消点赞
     */
    async triggerLike() {
        const post: DanmakuPostInfo = {
            type: 3,
            towername: 'HumanBreak',
            id: this.id
        };

        const res = await axios.post<PostLikeResponse>(Danmaku.backend, post);
        if (res.data.code !== 0) {
            logger.severe(
                2,
                `Uncaught error in posting like info for danmaku. Danmaku id: ${this.id}.`
            );
            tip('error', `Error ${res.data.code}. ${res.data.message}`);
        } else {
            tip('success', res.data.message);

            if (res.data.liked) {
                this.liked = true;
                this.likedNum++;
            } else {
                this.liked = false;
                this.likedNum--;
            }
            this.emit('like', this.liked, this);
        }

        return res;
    }

    /**
     * 销毁这个弹幕
     */
    destroy() {
        this.showEnd();
        Danmaku.all.delete(this);
        if (this.floor) {
            const floor = Danmaku.allInPos[this.floor];
            if (floor) {
                delete floor[`${this.x},${this.y}`];
            }
        }
    }

    private createSpecVNode(type: string, content: string): VNode {
        if (Danmaku.specList[type]) {
            return Danmaku.specList[type](content, type);
        } else {
            logger.severe(1, `Unknown special danmaku element: ${type}.`);
        }

        return h('span');
    }

    /**
     * 拉取本塔所有弹幕
     */
    static async fetch() {
        const form = toFormData({
            type: 1,
            towername: 'HumanBreak'
        });
        /* @__PURE__ */ form.append('userid', id);
        /* @__PURE__ */ form.append('password', password);
        const data = await axios.post<DanmakuResponse>(Danmaku.backend, form);

        data.data.list.forEach(v => {
            const dan = new Danmaku();
            dan.id = v.id;
            dan.likedNum = v.love;
            dan.decode(v);
            dan.posted = true;
            dan.addToList();
        });
    }

    /**
     * 显示一个弹幕
     * @param dan 要显示的弹幕
     */
    static show(dan: Danmaku) {
        dan.show();
    }

    /**
     * 注册一个特殊显示内容
     * @param type 特殊内容类型
     * @param fn 特殊内容显示函数，返回VNode
     */
    static registerSpecContent(type: string, fn: SpecContentFn) {
        if (this.specList[type]) {
            logger.warn(6, `Registered special danmaku element: ${type}`);
        }
        this.specList[type] = fn;
    }
}

// 图标类型
Danmaku.registerSpecContent('i', content => {
    const iconInfo = core.getBlockInfo(content as AllIds);
    if (!iconInfo) {
        return h(BoxAnimate as Component, {
            id: 'greenSlime',
            noborder: true,
            width: 32,
            height: 32
        });
    }

    return h(BoxAnimate as Component, {
        id: content,
        noborder: true,
        width: 32,
        height: iconInfo.height
    });
});

/* @__PURE__ */ Danmaku.backend = `/danmaku`;

Mota.require('var', 'hook').once('reset', () => {
    Danmaku.fetch();
});

// 勇士移动后显示弹幕
Mota.require('var', 'hook').on('moveOneStep', (x, y, floor) => {
    const enabled = mainSetting.getValue('ui.danmaku', true);
    if (!enabled) return;
    const f = Danmaku.allInPos[floor];
    if (f) {
        const danmaku = f[`${x},${y}`];
        if (danmaku) {
            danmaku.show();
        }
    }
});
