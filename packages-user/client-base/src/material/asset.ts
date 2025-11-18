import { ITextureComposedData } from '@motajs/render-assets';
import { IMaterialAsset } from './types';
import { IDirtyMark } from '@motajs/common';

export class MaterialAsset implements IMaterialAsset {
    /** 标记列表 */
    private readonly marks: WeakMap<IDirtyMark, number> = new WeakMap();
    /** 脏标记，所有值小于此标记的都视为需要更新 */
    private dirtyFlag: number = 0;

    constructor(readonly data: ITextureComposedData) {}

    dirty(): void {
        this.dirtyFlag++;
    }

    mark(): IDirtyMark {
        const symbol = {};
        this.marks.set(symbol, this.dirtyFlag);
        return symbol;
    }

    unmark(mark: IDirtyMark): void {
        this.marks.delete(mark);
    }

    dirtySince(mark: IDirtyMark): boolean {
        const value = this.marks.get(mark) ?? -1;
        return value < this.dirtyFlag;
    }

    hasMark(symbol: IDirtyMark): boolean {
        return this.marks.has(symbol);
    }
}
