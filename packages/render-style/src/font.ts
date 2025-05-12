import { logger } from '@motajs/common';

export interface IFontConfig {
    /** 字体类型 */
    readonly family: string;
    /** 字体大小的值 */
    readonly size: number;
    /** 字体大小单位，推荐使用 px */
    readonly sizeUnit: string;
    /** 字体粗细，范围 0-1000 */
    readonly weight: number;
    /** 是否斜体 */
    readonly italic: boolean;
}

export const enum FontWeight {
    Light = 300,
    Normal = 400,
    Bold = 700
}

type _FontStretch =
    | 'ultra-condensed'
    | 'extra-condensed'
    | 'condensed'
    | 'semi-condensed'
    | 'normal'
    | 'semi-expanded'
    | 'expanded'
    | 'extra-expanded'
    | 'ultra-expanded';

type _FontVariant = 'normal' | 'small-caps';

export class Font implements IFontConfig {
    static defaultFamily: string = 'Verdana';
    static defaultSize: number = 16;
    static defaultSizeUnit: string = 'px';
    static defaultWeight: number = 400;
    static defaultItalic: boolean = false;

    private readonly fallbacks: Font[] = [];

    private fontString: string = '';

    constructor(
        public readonly family: string = Font.defaultFamily,
        public readonly size: number = Font.defaultSize,
        public readonly sizeUnit: string = Font.defaultSizeUnit,
        public readonly weight: number = Font.defaultWeight,
        public readonly italic: boolean = Font.defaultItalic
    ) {
        this.fontString = this.getFont();
    }

    /**
     * 添加后备字体，若当前字体不可用，那么会使用后备字体，后备字体也可以添加后备字体，但是请避免递归添加
     * @param fallback 后备字体
     */
    addFallback(...fallback: Font[]) {
        this.fallbacks.push(...fallback);
        this.fontString = this.getFont();
    }

    private build() {
        return `${this.italic ? 'italic ' : ''} ${this.weight} ${this.size}${
            this.sizeUnit
        } ${this.family}`;
    }

    private getFallbackFont(used: Set<Font>) {
        let font = this.build();
        this.fallbacks.forEach(v => {
            if (used.has(v)) {
                logger.warn(62, this.build());
                return;
            }
            used.add(v);
            font += `, ${v.getFallbackFont(used)}`;
        });
        return font;
    }

    private getFont() {
        if (this.fallbacks.length === 0) {
            return this.build();
        } else {
            const usedFont = new Set<Font>();
            return this.getFallbackFont(usedFont);
        }
    }

    /**
     * 获取字体的 CSS 字符串
     */
    string() {
        return this.fontString;
    }

    private static parseOne(str: string) {
        if (!str) return new Font();
        let italic = this.defaultItalic;
        let weight = this.defaultWeight;
        let size = this.defaultSize;
        let unit = this.defaultSizeUnit;
        let family = this.defaultFamily;
        const tokens = str.split(/\s+/);
        tokens.forEach(v => {
            // font-italic
            if (v === 'italic') {
                italic = true;
                return;
            }

            // font-weight
            const num = Number(v);
            if (!isNaN(num)) {
                weight = num;
                return;
            }

            // font-size
            const parse = parseFloat(v);
            if (!isNaN(parse)) {
                size = parse;
                unit = v.slice(parse.toString().length);
                return;
            }
        });
        family = tokens.at(-1) ?? 'Verdana';
        return new Font(family, size, unit, weight, italic);
    }

    /**
     * 从 CSS 字体字符串解析出 Font 实例，不支持的属性将被忽略
     */
    static parse(str: string) {
        const fonts = str.split(',');
        const main = this.parseOne(fonts[0]);
        for (let i = 1; i < fonts.length; i++) {
            main.addFallback(this.parseOne(fonts[i]));
        }
    }

    /**
     * 设置默认字体
     */
    static setDefaults(font: Font) {
        this.defaultFamily = font.family;
        this.defaultItalic = font.italic;
        this.defaultSize = font.size;
        this.defaultSizeUnit = font.sizeUnit;
        this.defaultWeight = font.weight;
    }

    /**
     * 获取默认字体
     */
    static defaults() {
        return new Font();
    }

    /**
     * 复制一个字体，同时修改字体的一部分属性
     * @param font 要复制的字体
     */
    static clone(
        font: Font,
        {
            family = font.family,
            size = font.size,
            sizeUnit = font.sizeUnit,
            weight = font.weight,
            italic = font.italic
        }: Partial<IFontConfig>
    ) {
        return new Font(family, size, sizeUnit, weight, italic);
    }
}
