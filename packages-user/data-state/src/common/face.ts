import { logger } from '@motajs/common';
import { IFaceData, IRoleFaceBinder } from './types';
import { isNil } from 'lodash-es';
import { FaceDirection } from '.';

interface FaceInfo {
    /** 此图块的朝向 */
    readonly face: FaceDirection;
    /** 此图块对应的映射 */
    readonly map: Map<FaceDirection, number>;
}

export class RoleFaceBinder implements IRoleFaceBinder {
    /** 每个图块对应的朝向信息 */
    private faceMap: Map<number, FaceInfo> = new Map();
    /** 主要朝向映射 */
    private mainMap: Map<number, FaceDirection> = new Map();

    malloc(identifier: number, main: FaceDirection): void {
        this.mainMap.set(identifier, main);
        const map = new Map<FaceDirection, number>();
        map.set(main, identifier);
        const info: FaceInfo = { face: main, map };
        this.faceMap.set(identifier, info);
    }

    bind(identifier: number, main: number, face: FaceDirection): void {
        const mainFace = this.mainMap.get(main);
        if (isNil(mainFace)) {
            logger.error(43, main.toString());
            return;
        }
        if (mainFace === face) {
            logger.error(44, main.toString());
            return;
        }
        const { map } = this.faceMap.get(main)!;
        map.set(face, identifier);
        const info: FaceInfo = { face, map };
        this.faceMap.set(identifier, info);
        this.mainMap.set(identifier, mainFace);
    }

    getFaceOf(identifier: number, face: FaceDirection): IFaceData | null {
        const info = this.faceMap.get(identifier);
        if (!info) return null;
        const target = info.map.get(face);
        if (isNil(target)) return null;
        const data: IFaceData = { identifier: target, face };
        return data;
    }

    getFaceDirection(identifier: number): FaceDirection | undefined {
        return this.faceMap.get(identifier)?.face;
    }

    getMainFace(identifier: number): IFaceData | null {
        const face = this.mainMap.get(identifier);
        if (isNil(face)) return null;
        const data: IFaceData = { identifier, face };
        return data;
    }
}
