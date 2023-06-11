import resource from '../../data/resource.json';
import { NonZipResource, Resource, getTypeByResource } from './resource';

const info = resource as ResourceInfo[];

export interface ResourceInfo {
    includes: string[];
    zip: boolean;
    zippedName?: string;
}

export function readyAllResource() {
    info.forEach(v => {
        if (v.zip) {
            const id = `zip.${v.zippedName}`;
            ancTe.zipResource.push([[id, new Resource(id, 'zip')]]);
        } else {
            const res: [string, Resource<NonZipResource>][] = v.includes.map(
                v => {
                    const type = getTypeByResource(v);
                    return [v, new Resource(v, type as NonZipResource)];
                }
            );
            ancTe.resource.push(res);
        }
    });
}
