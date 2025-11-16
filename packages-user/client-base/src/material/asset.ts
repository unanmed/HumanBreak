import { ITextureComposedData } from '@motajs/render-assets';
import { IMaterialAsset } from './types';

export class MaterialAsset implements IMaterialAsset {
    /** 标记列表 */
    private readonly marks: WeakMap<symbol, number> = new WeakMap();
    /** 脏标记，所有值小于此标记的都视为需要更新 */
    private dirtyFlag: number = 0;

    constructor(readonly data: ITextureComposedData) {}

    dirty(): void {
        this.dirtyFlag++;
    }

    mark(): symbol {
        const symbol = Symbol();
        this.marks.set(symbol, this.dirtyFlag);
        return symbol;
    }

    unmark(mark: symbol): void {
        this.marks.delete(mark);
    }

    dirtySince(mark: symbol): boolean {
        const value = this.marks.get(mark) ?? -1;
        return value < this.dirtyFlag;
    }

    hasMark(symbol: symbol): boolean {
        return this.marks.has(symbol);
    }
}
