import { message } from 'ant-design-vue';
import { MessageApi } from 'ant-design-vue/lib/message';
import { isNil } from 'lodash';
import { Animation, TimingFn } from 'mutate-animate';
import { ComputedRef, ref } from 'vue';
import { EVENT_KEY_CODE_MAP } from './keyCodes';

type CanParseCss = keyof {
    [P in keyof CSSStyleDeclaration as CSSStyleDeclaration[P] extends string
        ? P extends string
            ? P
            : never
        : never]: CSSStyleDeclaration[P];
};

export default function init() {
    return { has, getDamageColor, parseCss, tip };
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
    const str = css.replace(/[\n\s\t]*/g, '').replace(/[;,]*/g, ';');
    const styles = str.split(';');
    const res: Partial<Record<CanParseCss, string>> = {};

    for (const one of styles) {
        const [key, data] = one.split(':');
        const cssKey = key.replace(/\-([a-z])/g, (str, $1) =>
            $1.toUpperCase()
        ) as CanParseCss;
        res[cssKey] = data;
    }
    return res;
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
