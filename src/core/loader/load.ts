import resource from '../../data/resource.json';
import { Resource, getTypeByResource } from './resource';

const info = resource;

/**
 * 构建游戏包后的加载
 */
export function readyAllResource() {
    /* @__PURE__ */ if (main.RESOURCE_TYPE === 'dev') return readyDevResource();
    info.resource.forEach(v => {
        const type = getTypeByResource(v);
        if (type === 'zip') {
            ancTe.zipResource.set(v, new Resource(v, 'zip'));
        } else {
            ancTe.resource.set(v, new Resource(v, type));
        }
    });
}

/**
 * 开发时的加载
 */
/* @__PURE__ */ async function readyDevResource() {
    const loadData = (await import('../../data/resource-dev.json')).default;

    loadData.forEach(v => {
        const type = getTypeByResource(v);
        if (type !== 'zip') {
            ancTe.resource.set(v, new Resource(v, type));
        }
    });
    ancTe.resource.forEach(v => v.active());
}
