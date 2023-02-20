import { has } from '../utils';

export default function init() {
    return { isWebGLSupported };
}

export const isWebGLSupported = (function () {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl');
})();

const cssColors = {
    black: '#000000',
    silver: '#c0c0c0',
    gray: '#808080',
    white: '#ffffff',
    maroon: '#800000',
    red: '#ff0000',
    purple: '#800080',
    fuchsia: '#ff00ff',
    green: '#008000',
    lime: '#00ff00',
    olive: '#808000',
    yellow: '#ffff00',
    navy: '#000080',
    blue: '#0000ff',
    teal: '#008080',
    aqua: '#00ffff',
    orange: '#ffa500',
    aliceblue: '#f0f8ff',
    antiquewhite: '#faebd7',
    aquamarine: '#7fffd4',
    azure: '#f0ffff',
    beige: '#f5f5dc',
    bisque: '#ffe4c4',
    blanchedalmond: '#ffebcd',
    blueviolet: '#8a2be2',
    brown: '#a52a2a',
    burlywood: '#deb887',
    cadetblue: '#5f9ea0',
    chartreuse: '#7fff00',
    chocolate: '#d2691e',
    coral: '#ff7f50',
    cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc',
    crimson: '#dc143c',
    cyan: '#00ffff',
    darkblue: '#00008b',
    darkcyan: '#008b8b',
    darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9',
    darkgreen: '#006400',
    darkgrey: '#a9a9a9',
    darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f',
    darkorange: '#ff8c00',
    darkorchid: '#9932cc',
    darkred: '#8b0000',
    darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f',
    darkslategrey: '#2f4f4f',
    darkturquoise: '#00ced1',
    darkviolet: '#9400d3',
    deeppink: '#ff1493',
    deepskyblue: '#00bfff',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1e90ff',
    firebrick: '#b22222',
    floralwhite: '#fffaf0',
    forestgreen: '#228b22',
    gainsboro: '#dcdcdc',
    ghostwhite: '#f8f8ff',
    gold: '#ffd700',
    goldenrod: '#daa520',
    greenyellow: '#adff2f',
    grey: '#808080',
    honeydew: '#f0fff0',
    hotpink: '#ff69b4',
    indianred: '#cd5c5c',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    lavender: '#e6e6fa',
    lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00',
    lemonchiffon: '#fffacd',
    lightblue: '#add8e6',
    lightcoral: '#f08080',
    lightcyan: '#e0ffff',
    lightgoldenrodyellow: '#fafad2',
    lightgray: '#d3d3d3',
    lightgreen: '#90ee90',
    lightgrey: '#d3d3d3',
    lightpink: '#ffb6c1',
    lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0',
    limegreen: '#32cd32',
    linen: '#faf0e6',
    magenta: '#ff00ff',
    mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd',
    mediumorchid: '#ba55d3',
    mediumpurple: '#9370db',
    mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585',
    midnightblue: '#191970',
    mintcream: '#f5fffa',
    mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5',
    navajowhite: '#ffdead',
    oldlace: '#fdf5e6',
    olivedrab: '#6b8e23',
    orangered: '#ff4500',
    orchid: '#da70d6',
    palegoldenrod: '#eee8aa',
    palegreen: '#98fb98',
    paleturquoise: '#afeeee',
    palevioletred: '#db7093',
    papayawhip: '#ffefd5',
    peachpuff: '#ffdab9',
    peru: '#cd853f',
    pink: '#ffc0cb',
    plum: '#dda0dd',
    powderblue: '#b0e0e6',
    rosybrown: '#bc8f8f',
    royalblue: '#4169e1',
    saddlebrown: '#8b4513',
    salmon: '#fa8072',
    sandybrown: '#f4a460',
    seagreen: '#2e8b57',
    seashell: '#fff5ee',
    sienna: '#a0522d',
    skyblue: '#87ceeb',
    slateblue: '#6a5acd',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#fffafa',
    springgreen: '#00ff7f',
    steelblue: '#4682b4',
    tan: '#d2b48c',
    thistle: '#d8bfd8',
    tomato: '#ff6347',
    turquoise: '#40e0d0',
    violet: '#ee82ee',
    wheat: '#f5deb3',
    whitesmoke: '#f5f5f5',
    yellowgreen: '#9acd32',
    transparent: '#0000'
};

/**
 * 颜色字符串转rgb数组
 * @param color 颜色字符串
 */
export function parseColor(color: string): RGBArray {
    if (color.startsWith('rgb')) {
        // rgb
        const match = color.match(/rgba?\([\d\,\s\.%]+\)/);
        if (!has(match)) throw new Error(`Invalid color is delivered!`);
        const l = color.includes('a');
        return match[0]
            .slice(l ? 5 : 4, -1)
            .split(',')
            .map((v, i) => {
                const vv = v.trim();
                if (vv.endsWith('%')) {
                    if (i === 3) {
                        return parseInt(vv) / 100;
                    } else {
                        return (parseInt(vv) * 255) / 100;
                    }
                } else return parseFloat(vv);
            })
            .slice(0, l ? 4 : 3) as RGBArray;
    } else if (color.startsWith('#')) {
        // 十六进制
        const content = color.slice(1);
        if (![3, 4, 6, 8].includes(content.length)) {
            throw new Error(`Invalid color is delivered!`);
        }

        if (content.length <= 4) {
            const res = content
                .split('')
                .map(v => Number(`0x${v}${v}`)) as RGBArray;
            if (res.length === 4) res[3]! /= 255;
            return res;
        } else {
            const res = Array(content.length / 2)
                .fill(1)
                .map((v, i) =>
                    Number(`0x${content[i * 2]}${content[i * 2 + 1]}`)
                ) as RGBArray;
            if (res.length === 4) res[3]! /= 255;
            return res;
        }
    } else if (color.startsWith('hsl')) {
        // hsl，转成rgb后输出
        const match = color.match(/hsla?\([\d\,\s\.%]+\)/);
        if (!has(match)) throw new Error(`Invalid color is delivered!`);
        const l = color.includes('a');
        const hsl = match[0]
            .slice(l ? 5 : 4, -1)
            .split(',')
            .map(v => {
                const vv = v.trim();
                if (vv.endsWith('%')) return parseInt(vv) / 100;
                else return parseFloat(vv);
            });
        const rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
        return (l ? rgb.concat([hsl[3]]) : rgb) as RGBArray;
    } else {
        // 单词
        const rgb = cssColors[color as keyof typeof cssColors];
        if (!has(rgb)) {
            throw new Error(`Invalid color is delivered!`);
        }
        return parseColor(rgb);
    }
}

/**
 * hsl转rgb
 * @param h 色相
 * @param s 饱和度
 * @param l 亮度
 */
export function hslToRgb(h: number, s: number, l: number) {
    if (s == 0) {
        return [0, 0, 0];
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const r = hue2rgb(p, q, h + 1 / 3);
        const g = hue2rgb(p, q, h);
        const b = hue2rgb(p, q, h - 1 / 3);
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
}
