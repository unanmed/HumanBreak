import resource from '../../data/resource.json';
import { Resource, ResourceType } from './resource';

const info = resource as ResourceInfo[];

export interface ResourceInfo {
    floor: [FloorIds, FloorIds][];
    includes: string[];
    zip: boolean;
    zippedName?: string;
}

export function readyAllResource() {
    info.forEach(v => {
        if (v.zip) {
            const res = new Resource(`zip.${v.zippedName}`, 'zip');
            ancTe.resource.push([[`zip.${v.zippedName}`, res]]);
        } else {
            const res: [string, Resource][] = v.includes.map(v => {
                const type = v.split('.')[0];
                return [v, new Resource(v, type as ResourceType)];
            });
            ancTe.resource.push(res);
        }
    });
}
