import resource from '../../data/resource.json';
import { Resource, getTypeByResource } from './resource';

const info = resource;

export function readyAllResource() {
    info.forEach(v => {
        const type = getTypeByResource(v);
        if (type === 'zip') {
            ancTe.zipResource.set(v, new Resource(v, 'zip'));
        } else {
            ancTe.resource.set(v, new Resource(v, type));
        }
    });
}
