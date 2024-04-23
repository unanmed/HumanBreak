import { message } from 'ant-design-vue';
import { MessageApi } from 'ant-design-vue/lib/message';
import { isNil } from 'lodash-es';
import { Animation, sleep, TimingFn } from 'mutate-animate';
import { ref } from 'vue';
import { EVENT_KEY_CODE_MAP, KeyCode } from './keyCodes';
import axios from 'axios';
import { decompressFromBase64 } from 'lz-string';
import { parseColor } from './webgl/utils';
import { Keyboard, KeyboardEmits } from '@/core/main/custom/keyboard';
import { fixedUi, mainUi } from '@/core/main/init/ui';
import { isAssist } from '@/core/main/custom/hotkey';
import { logger } from '@/core/common/logger';

type CanParseCss = keyof {
    [P in keyof CSSStyleDeclaration as CSSStyleDeclaration[P] extends string
        ? P extends string
            ? P
            : never
        : never]: CSSStyleDeclaration[P];
};

export default function init() {
    return {
        has,
        getDamageColor,
        parseCss,
        tip,
        changeLocalStorage,
        swapChapter
    };
}

/**
 * 判定一个值是否不是undefined或null
 * @param value 要判断的值
 */
export function has<T>(value: T): value is NonNullable<T> {
    return !isNil(value);
}

/**
 * 根据伤害大小获取颜色
 * @param damage 伤害大小
 */
export function getDamageColor(damage: number): Color {
    if (typeof damage !== 'number') return '#f00';
    if (damage === 0) return '#2f2';
    if (damage < 0) return '#7f7';
    if (damage < core.status.hero.hp / 3) return '#fff';
    if (damage < (core.status.hero.hp * 2) / 3) return '#ff4';
    if (damage < core.status.hero.hp) return '#f93';
    return '#f22';
}

/**
 * 设置画布的长宽
 * @param canvas 画布
 * @param w 宽度
 * @param h 高度
 */
export function setCanvasSize(
    canvas: HTMLCanvasElement,
    w: number,
    h: number
): void {
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
}

/**
 * 获取事件中的keycode对应的键
 * @param key 要获取的键
 */
export function keycode(key: number) {
    return EVENT_KEY_CODE_MAP[key];
}

/**
 * 解析css字符串为CSSStyleDeclaration对象
 * @param css 要解析的css字符串
 */
export function parseCss(css: string): Partial<Record<CanParseCss, string>> {
    if (css.length === 0) return {};

    let pointer = -1;
    let inProp = true;
    let prop = '';
    let value = '';
    let upper = false;
    const res: Partial<Record<CanParseCss, string>> = {};

    while (++pointer < css.length) {
        const char = css[pointer];

        if ((char === ' ' || char === '\n' || char === '\r') && inProp) {
            continue;
        }

        if (char === '-' && inProp) {
            if (prop.length !== 0) {
                upper = true;
            }
            continue;
        }

        if (char === ':') {
            if (!inProp) {
                logger.error(
                    3,
                    `Syntax error in parsing CSS: Unexpected ':'. Col: ${pointer}. CSS string: '${css}'`
                );
                return res;
            }
            inProp = false;
            continue;
        }

        if (char === ';') {
            if (prop.length === 0) continue;
            if (inProp) {
                logger.error(
                    4,
                    `Syntax error in parsing CSS: Unexpected ';'. Col: ${pointer}. CSS string: '${css}'`
                );
                return res;
            }
            res[prop as CanParseCss] = value.trim();
            inProp = true;
            prop = '';
            value = '';
            continue;
        }

        if (upper) {
            if (!inProp) {
                logger.error(
                    5,
                    `Syntax error in parsing CSS: Missing property name after '-'. Col: ${pointer}. CSS string: '${css}'`
                );
            }
            prop += char.toUpperCase();
            upper = false;
        } else {
            if (inProp) prop += char;
            else value += char;
        }
    }
    if (inProp && prop.length > 0) {
        logger.error(
            6,
            `Syntax error in parsing CSS: Unexpected end of css, expecting ':'. Col: ${pointer}. CSS string: '${css}'`
        );
        return res;
    }
    if (!inProp && value.trim().length === 0) {
        logger.error(
            7,
            `Syntax error in parsing CSS: Unexpected end of css, expecting property value. Col: ${pointer}. CSS string: '${css}'`
        );
        return res;
    }
    if (prop.length > 0) res[prop as CanParseCss] = value.trim();

    return res;
}

export function stringifyCSS(css: Partial<Record<CanParseCss, string>>) {
    let str = '';

    for (const [key, value] of Object.entries(css)) {
        let pointer = -1;
        let prop = '';
        while (++pointer < key.length) {
            const char = key[pointer];
            if (char.toLowerCase() === char) {
                prop += char;
            } else {
                prop += `-${char.toLowerCase()}`;
            }
        }
        str += `${prop}:${value};`;
    }

    return str;
}

/**
 * 使用打字机效果显示一段文字
 * @param str 要打出的字符串
 * @param time 打出总用时，默认1秒，当第四个参数是true时，该项为每个字的平均时间
 * @param timing 打出时的速率曲线，默认为线性变化
 * @param avr 是否将第二个参数视为每个字的平均时间
 * @returns 文字的响应式变量
 */
export function type(
    str: string,
    time: number = 1000,
    timing: TimingFn = n => n,
    avr: boolean = false
): Ref<string> {
    const toShow = eval('`' + str + '`') as string;
    if (typeof toShow !== 'string') {
        throw new TypeError('Error str type in typing!');
    }
    if (toShow.startsWith('!!html')) return ref(toShow);
    if (avr) time *= toShow.length;
    const ani = new Animation();
    const content = ref('');
    const all = toShow.length;

    const fn = (time: number) => {
        if (!has(time)) return;
        const now = ani.x;
        content.value = toShow.slice(0, Math.floor(now));
        if (Math.floor(now) === all) {
            ani.ticker.destroy();
            content.value = toShow;
        }
    };

    ani.ticker.add(fn);

    ani.mode(timing).time(time).move(all, 0);

    setTimeout(() => ani.ticker.destroy(), time + 100);

    return content;
}

export function tip(
    type: Exclude<keyof MessageApi, 'open' | 'config' | 'destroy'>,
    text: string
) {
    message[type]({
        content: text,
        class: 'antdv-message'
    });
}

/**
 * 设置文字分段换行等
 * @param str 文字
 */
export function splitText(str: string[]) {
    return str
        .map((v, i, a) => {
            if (/^\d+\./.test(v)) return `${'&nbsp;'.repeat(12)}${v}`;
            else if (
                (has(a[i - 1]) && v !== '<br>' && a[i - 1] === '<br>') ||
                i === 0
            ) {
                return `${'&nbsp;'.repeat(8)}${v}`;
            } else return v;
        })
        .join('');
}

/**
 * 在下一帧执行某个函数
 * @param cb 执行的函数
 */
export function nextFrame(cb: (time: number) => void) {
    requestAnimationFrame(() => {
        requestAnimationFrame(cb);
    });
}

/**
 * 下载一个画布对应的图片
 * @param canvas 画布
 * @param name 图片名称
 */
export function downloadCanvasImage(
    canvas: HTMLCanvasElement,
    name: string
): void {
    const data = canvas.toDataURL('image/png');
    download(data, name);
}

/**
 * 下载一个文件
 * @param content 下载的内容
 * @param name 文件名称
 */
export function download(content: string, name: string) {
    const a = document.createElement('a');
    a.download = `${name}.png`;
    a.href = content;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * 间隔一段时间调用一个函数
 * @param funcs 函数列表
 * @param interval 调用间隔
 */
export async function doByInterval(
    funcs: (() => void)[],
    interval: number,
    awaitFirst: boolean = false
) {
    if (awaitFirst) {
        await sleep(interval);
    }
    for await (const fn of funcs) {
        fn();
        await sleep(interval);
    }
}

/**
 * 更改一个本地存储
 * @deprecated
 * @param name 要更改的信息
 * @param fn 更改时执行的函数
 * @param defaultValue 如果不存在时获取的默认值
 */
export function changeLocalStorage<T>(
    name: string,
    fn: (data: T) => T,
    defaultValue?: T
) {
    const now = core.getLocalStorage(name, defaultValue);
    const to = fn(now);
    core.setLocalStorage(name, to);
}

export async function swapChapter(chapter: number, hard: number) {
    const h = hard === 2 ? 'hard' : 'easy';
    const save = await axios.get(
        `${import.meta.env.BASE_URL}swap/${chapter}.${h}.h5save`,
        {
            responseType: 'text',
            responseEncoding: 'utf-8'
        }
    );
    const data = JSON.parse(decompressFromBase64(save.data));

    core.loadData(data.data, () => {
        core.removeFlag('__fromLoad__');
        core.drawTip('读档成功');
    });
}

export function ensureArray<T>(arr: T): T extends any[] ? T : T[] {
    // @ts-ignore
    return arr instanceof Array ? arr : [arr];
}

export function pColor(color: string) {
    const arr = parseColor(color);
    arr[3] ??= 1;
    return `rgba(${arr.join(',')})` as Color;
}

/**
 * 删除数组内的某个项，返回删除后的数组
 * @param arr 要操作的数组
 * @param ele 要删除的项
 */
export function deleteWith<T>(arr: T[], ele: T): T[] {
    const index = arr.indexOf(ele);
    if (index === -1) return arr;
    arr.splice(index, 1);
    return arr;
}

export function spliceBy<T>(arr: T[], from: T): T[] {
    const index = arr.indexOf(from);
    if (index === -1) return arr;
    arr.splice(index);
    return arr;
}

export async function triggerFullscreen(full: boolean) {
    if (!Mota.Plugin.inited) return;
    const { maxGameScale } = Mota.Plugin.require('utils_g');
    if (!!document.fullscreenElement && !full) {
        await document.exitFullscreen();
        requestAnimationFrame(() => {
            maxGameScale(1);
        });
    }
    if (full && !document.fullscreenElement) {
        await document.body.requestFullscreen();
        requestAnimationFrame(() => {
            maxGameScale();
        });
    }
}

/**
 * 根据布尔值数组转换成一个二进制数
 * @param arr 要转换的布尔值数组
 */
export function generateBinary(arr: boolean[]) {
    let num = 0;
    arr.forEach((v, i) => {
        if (v) {
            num += 1 << i;
        }
    });
    return num;
}

/**
 * 获得某个状态的中文名
 * @param name 要获取的属性名
 */
export function getStatusLabel(name: string) {
    return (
        {
            name: '名称',
            lv: '等级',
            hpmax: '生命回复',
            hp: '生命',
            manamax: '魔力上限',
            mana: '额外攻击',
            atk: '攻击',
            def: '防御',
            mdef: '智慧',
            money: '金币',
            exp: '经验',
            point: '加点',
            steps: '步数',
            up: '升级',
            none: '无'
        }[name] || name
    );
}

export function flipBinary(num: number, col: number) {
    const n = 1 << col;
    if (num & n) return num & ~n;
    else return num | n;
}

/**
 * 唤起虚拟键盘，并获取到一次按键操作
 * @param emitAssist 是否可以获取辅助按键，为true时，如果按下辅助按键，那么会立刻返回该按键，
 *                   否则会视为开关辅助按键
 * @param assist 初始化的辅助按键
 */
export function getVitualKeyOnce(
    emitAssist: boolean = false,
    assist: number = 0,
    emittable: KeyCode[] = []
): Promise<KeyboardEmits> {
    return new Promise(res => {
        const key = Keyboard.get('full')!;
        key.withAssist(assist);
        const id = mainUi.open('virtualKey', { keyboard: key });
        key.on('emit', (item, assist, index, ev) => {
            ev.preventDefault();
            if (emitAssist) {
                if (emittable.length === 0 || emittable.includes(item.key)) {
                    res({ key: item.key, assist: 0 });
                    key.disposeScope();
                    mainUi.close(id);
                }
            } else {
                if (
                    !isAssist(item.key) &&
                    (emittable.length === 0 || emittable.includes(item.key))
                ) {
                    res({ key: item.key, assist });
                    key.disposeScope();
                    mainUi.close(id);
                }
            }
        });
    });
}

export function formatSize(size: number) {
    return size < 1 << 10
        ? `${size.toFixed(2)}B`
        : size < 1 << 20
        ? `${(size / (1 << 10)).toFixed(2)}KB`
        : size < 1 << 30
        ? `${(size / (1 << 20)).toFixed(2)}MB`
        : `${(size / (1 << 30)).toFixed(2)}GB`;
}

let num = 0;
export function requireUniqueSymbol() {
    return num++;
}

export function openDanmakuPoster() {
    if (!fixedUi.hasName('danmakuEditor')) {
        fixedUi.open('danmakuEditor');
    }
}

export function getIconHeight(icon: AllIds | 'hero') {
    if (icon === 'hero') {
        if (core.isPlaying()) {
            return (
                core.material.images.images[core.status.hero.image].height / 4
            );
        } else {
            return 48;
        }
    }
    return core.getBlockInfo(icon)?.height ?? 32;
}
