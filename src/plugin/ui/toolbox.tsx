import { has } from '../utils';

interface ClsMap {
    tools: '消耗道具';
    constants: '永久道具';
    all: '全部道具';
}

interface AllItem {
    tools: [ItemIdOf<'tools'>, number][];
    constants: [ItemIdOf<'constants'>, number][];
}

const clsMap: ClsMap = {
    tools: '消耗道具',
    constants: '永久道具',
    all: '全部道具'
};

/**
 * 根据道具的cls获取中文类型
 * @param cls 道具的cls
 */
export function getClsName<T extends keyof ClsMap | 'all'>(cls: T): ClsMap[T] {
    return clsMap[cls];
}

/**
 * 获取某个类型的所有道具
 * @param cls 道具类型
 */
export function getItems(cls: 'all'): AllItem;
export function getItems(cls: keyof ClsMap): [string, number][];
export function getItems(cls: keyof ClsMap | 'all') {
    const i = core.status.hero.items;
    if (cls === 'all') {
        return {
            tools: Object.entries(i.tools),
            constants: Object.entries(i.constants)
        };
    }
    const items = i[cls];
    const data = Object.entries(items);
    return data;
}
