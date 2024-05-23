import BoxAnimate from '@/components/boxAnimate.vue';
import { EventEmitter } from '@/core/common/eventEmitter';
import { logger } from '@/core/common/logger';
import { ResponseBase } from '@/core/interface';
import {
    deleteWith,
    ensureArray,
    getIconHeight,
    parseCss,
    tip
} from '@/plugin/utils';
import axios, { AxiosResponse, toFormData } from 'axios';
import { Component, VNode, h, shallowReactive } from 'vue';
// /* @__PURE__ */ import { id, password } from '../../../../user';
import { mainSetting } from '../setting';

type CSSObj = Partial<Record<CanParseCss, string>>;

interface DanmakuResponse extends ResponseBase {
    total: number;
    list: DanmakuInfo[];
}

interface DanmakuInfo {
    id: string;
    comment: string;
    tags: string;
    love: string;
    my_love_type: boolean;
    userid: string;
    deler: string;
    upload_time: string;
    tower_name: string;
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

interface DanmakuEvent {
    showStart: (danmaku: Danmaku) => void;
    showEnd: (danmaku: Danmaku) => void;
    like: (liked: boolean, danmaku: Danmaku) => void;
}

type SpecContentFn = (content: string, type: string) => VNode;

interface AllowedCSS {
    property: string;
    check: (value: string, prop: string) => true | string;
}

const allowedCSS: Partial<Record<CanParseCss, AllowedCSS>> = {
    color: {
        property: 'color',
        check: () => true
    },
    backgroundColor: {
        property: 'backgroundColor',
        check: () => true
    },
    fontSize: {
        property: 'fontSize',
        check: value => {
            if (!/^\d+%$/.test(value)) {
                return '字体大小只能设置为百分格式';
            }
            if (parseInt(value) > 200) {
                return '字体最大只能为200%';
            }
            return true;
        }
    }
};

export class Danmaku extends EventEmitter<DanmakuEvent> {
    static backend: string = `/backend/tower/barrage.php`;
    static all: Set<Danmaku> = new Set();
    static allInPos: Partial<Record<FloorIds, Record<LocString, Danmaku[]>>> =
        {};

    static showList: Danmaku[] = shallowReactive([]);
    static showMap: Map<number, Danmaku> = new Map();
    static specList: Record<string, SpecContentFn> = {};

    static lastEditoredDanmaku?: Danmaku;

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
    vNode?: VNode;
    private posting: boolean = false;

    /**
     * 发送弹幕
     * @returns 弹幕发送的 Axios Post 信息，为 Promise
     */
    async post(): Promise<AxiosResponse<PostDanmakuResponse>> {
        if (this.posted || this.posting) {
            logger.warn(5, `Repeat post danmaku.`);
            return Promise.reject();
        }

        const data: DanmakuPostInfo = {
            type: 2,
            towername: 'HumanBreak',
            ...this.encode()
        };

        this.posting = true;
        const form = toFormData(data);
        // /* @__PURE__ */ form.append('userid', id);
        // /* @__PURE__ */ form.append('password', password);

        try {
            const res = await axios.post<PostDanmakuResponse>(
                Danmaku.backend,
                form
            );

            this.id = res.data.id;
            this.posting = false;

            if (res.data.code === 0) {
                this.posted = true;
                tip('success', '发送成功');
                this.addToList();
            } else {
                tip('error', res.data.message);
            }

            return res;
        } catch (e) {
            this.posted = false;
            this.posting = false;
            logger.error(
                1,
                `Unexpected error when posting danmaku. Error info: ${e}`
            );
            return Promise.reject();
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
        return { ...css, ...this.style };
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
        const allow = Danmaku.checkCSSAllow(res);
        if (allow.length === 0) {
            if (overwrite) this.style = res;
            else {
                this.style = { ...this.style, ...res };
            }
        } else {
            logger.error(
                8,
                `Post not allowed css danmaku. Allow info: ${allow.join(',')}`
            );
        }
    }

    /**
     * 将这个弹幕添加至弹幕列表
     */
    addToList() {
        Danmaku.all.add(this);
        if (!this.floor) return;
        Danmaku.allInPos[this.floor] ??= {};
        Danmaku.allInPos[this.floor]![`${this.x},${this.y}`] ??= [];
        Danmaku.allInPos[this.floor]![`${this.x},${this.y}`].push(this);
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
        if (this.showing) return;
        this.showing = true;
        Danmaku.showList.push(this);
        Danmaku.showMap.set(this.id, this);
        this.emit('showStart', this);
    }

    /**
     * 显示结束这个弹幕
     */
    showEnd() {
        if (!this.showing) return;
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

        const form = toFormData(post);
        // /* @__PURE__ */ form.append('userid', id);
        // /* @__PURE__ */ form.append('password', password);

        const res = await axios.post<PostLikeResponse>(Danmaku.backend, form);
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
     * 检查CSS内容是否符合发弹幕要求
     * @param css 要检查的CSS内容
     */
    static checkCSSAllow(css: CSSObj) {
        const problem: string[] = [];
        for (const [key, value] of Object.entries(css)) {
            if (!allowedCSS[key as CanParseCss]) {
                problem.push(`不允许的CSS:${key}`);
                continue;
            } else {
                const res = allowedCSS[key as CanParseCss]!.check(value, key);
                if (res !== true) {
                    problem.push(res);
                }
            }
        }

        return problem;
    }

    /**
     * 拉取本塔所有弹幕
     */
    static async fetch() {
        Danmaku.all.clear();
        Danmaku.allInPos = {};
        const form = toFormData({
            type: 1,
            towername: 'HumanBreak'
        });
        // /* @__PURE__ */ form.append('userid', id);
        // /* @__PURE__ */ form.append('password', password);
        const data = await axios.post<DanmakuResponse>(Danmaku.backend, form);

        data.data.list.forEach(v => {
            const dan = new Danmaku();
            dan.id = parseInt(v.id);
            dan.likedNum = parseInt(v.love);
            dan.liked = v.my_love_type;
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
    const height = getIconHeight(content as AllIds);

    return h(BoxAnimate as Component, {
        id: content,
        noborder: true,
        noAnimate: true,
        width: 32,
        height
    });
});

if (import.meta.env.DEV) {
    Danmaku.backend = `/danmaku`;
}

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
            danmaku.forEach(v => {
                setTimeout(() => {
                    v.show();
                }, Math.random() * 1000);
            });
        }
    }
});
