import resource from '@/data/resource.json';
import { EmitableEvent, EventEmitter } from '../common/eventEmitter';
import {
    Resource,
    getTypeByResource,
    zipResource,
    resource as res
} from './resource';

const info = resource;

/**
 * 构建游戏包后的加载
 */
export function readyAllResource() {
    /* @__PURE__ */ if (main.RESOURCE_TYPE === 'dev') return readyDevResource();
    info.resource.forEach(v => {
        const type = getTypeByResource(v);
        if (type === 'zip') {
            zipResource.set(v, new Resource(v, 'zip'));
        } else {
            res.set(v, new Resource(v, type));
        }
    });
}

/**
 * 开发时的加载
 */
/* @__PURE__ */ async function readyDevResource() {
    const loading = Mota.require('var', 'loading');
    const loadData = (await import('../../data/resource-dev.json')).default;

    loadData.forEach(v => {
        const type = getTypeByResource(v);
        if (type !== 'zip') {
            res.set(v, new Resource(v, type));
        }
    });
    res.forEach(v => v.active());
    loading.once('coreInit', () => {
        const animates = new Resource('__all_animates__', 'text');
        res.set('__all_animates__', animates);
        animates.active();
    });
}
