import { logger } from '@motajs/common';

export const enum PatchClass {
    Actions,
    Control,
    Core,
    Data,
    Enemys,
    Events,
    Icons,
    Items,
    Loader,
    Maps,
    UI,
    Utils
}

interface PatchList {
    [PatchClass.Actions]: Actions;
    [PatchClass.Control]: Control;
    [PatchClass.Core]: Core;
    [PatchClass.Data]: Omit<DataCore, 'main'>;
    [PatchClass.Enemys]: Enemys;
    [PatchClass.Events]: Events;
    [PatchClass.Icons]: Icons;
    [PatchClass.Items]: Items;
    [PatchClass.Loader]: Loader;
    [PatchClass.Maps]: Maps;
    [PatchClass.UI]: Ui;
    [PatchClass.Utils]: Utils;
}

const patchName = {
    [PatchClass.Actions]: 'actions',
    [PatchClass.Control]: 'control',
    [PatchClass.Core]: 'core',
    [PatchClass.Data]: 'data',
    [PatchClass.Enemys]: 'enemys',
    [PatchClass.Events]: 'events',
    [PatchClass.Icons]: 'icons',
    [PatchClass.Items]: 'items',
    [PatchClass.Loader]: 'loader',
    [PatchClass.Maps]: 'maps',
    [PatchClass.UI]: 'ui',
    [PatchClass.Utils]: 'utils'
};

export class Patch<T extends PatchClass> {
    private static patchList: Set<Patch<PatchClass>> = new Set();
    private static patched: Partial<Record<PatchClass, Set<string>>> = {};

    private patches: Map<string, (...params: any[]) => any> = new Map();

    constructor(public readonly patchClass: T) {
        Patch.patchList.add(this);
    }

    /**
     * 添加函数修改
     * @param key 要修改的函数名
     * @param patch 修改为的函数内容
     */
    add<
        K extends Exclude<
            SelectKey<PatchList[T], (...params: any[]) => any>,
            symbol | number
        >
    >(key: K, patch: PatchList[T][K]) {
        if (this.patches.has(key)) {
            logger.warn(49, patchName[this.patchClass], key);
        }
        this.patches.set(key, patch);
    }

    private static getPatchClass(patch: PatchClass): any {
        switch (patch) {
            case PatchClass.Actions:
                return actions.prototype;
            case PatchClass.Control:
                return control.prototype;
            case PatchClass.Core:
                return core;
            case PatchClass.Data:
                return data.prototype;
            case PatchClass.Enemys:
                return enemys.prototype;
            case PatchClass.Events:
                return events.prototype;
            case PatchClass.Icons:
                return icons.prototype;
            case PatchClass.Items:
                return items.prototype;
            case PatchClass.Loader:
                return loader.prototype;
            case PatchClass.Maps:
                return maps.prototype;
            case PatchClass.UI:
                return ui.prototype;
            case PatchClass.Utils:
                return utils.prototype;
        }
    }

    /**
     * 修改添加的所有函数
     */
    static patchAll() {
        this.patchList.forEach(v => this.patch(v));
    }

    /**
     * 修改某个实例添加的所有函数
     * @param patch 要修改的函数实例
     */
    static patch(patch: Patch<PatchClass>) {
        const patchClass = patch.patchClass;
        this.patched[patchClass] ??= new Set();
        const set = this.patched[patchClass];
        const obj = this.getPatchClass(patchClass);
        for (const [key, func] of patch.patches) {
            // console.log(key);

            if (set.has(key)) {
                logger.warn(49, patchName[patchClass], key);
            }
            set.add(key);
            obj[key] = func;
        }
        this.patchList.delete(patch);
    }
}
