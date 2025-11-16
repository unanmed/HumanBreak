import { SizedCanvasImageSource } from '@motajs/render-assets';
import {
    IMaterialGetter,
    IMaterialManager,
    materials
} from '@user/client-base';
import { IMapAssetData, IMapAssetManager } from './types';
import { PrivateListDirtyTracker } from '@motajs/common';

export class MapAssetManager implements IMapAssetManager {
    materials: IMaterialManager = materials;

    generateAsset(): IMapAssetData {
        const data = new MapAssetData();

        return data;
    }
}

class MapAssetData
    extends PrivateListDirtyTracker<number>
    implements IMapAssetData
{
    sourceList: ImageBitmap[] = [];
    skipRef: Map<SizedCanvasImageSource, number> = new Map();
    materials: IMaterialGetter = materials;

    constructor() {
        super(0);
    }
}
