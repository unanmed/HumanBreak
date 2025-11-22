import { FaceDirection } from './types';

/**
 * 获取指定朝向的坐标偏移量
 * @param dir 朝向
 */
export function getFaceMovement(dir: FaceDirection): Loc {
    switch (dir) {
        case FaceDirection.Left:
            return { x: -1, y: 0 };
        case FaceDirection.Right:
            return { x: 1, y: 0 };
        case FaceDirection.Up:
            return { x: 0, y: -1 };
        case FaceDirection.Down:
            return { x: 0, y: 1 };
        case FaceDirection.LeftUp:
            return { x: -1, y: -1 };
        case FaceDirection.RightUp:
            return { x: 1, y: -1 };
        case FaceDirection.LeftDown:
            return { x: -1, y: 1 };
        case FaceDirection.RightDown:
            return { x: 1, y: 1 };
        case FaceDirection.Unknown:
            return { x: 0, y: 0 };
    }
}

/**
 * 将八方向朝向降级为四方向朝向
 * @param dir 朝向
 * @param unknown 如果朝向是 `FaceDirection.Unknown`，那么会返回什么，默认还是未知
 */
export function degradeFace(
    dir: FaceDirection,
    unknown: FaceDirection = FaceDirection.Unknown
): FaceDirection {
    switch (dir) {
        case FaceDirection.LeftUp:
            return FaceDirection.Left;
        case FaceDirection.LeftDown:
            return FaceDirection.Left;
        case FaceDirection.RightUp:
            return FaceDirection.Right;
        case FaceDirection.RightDown:
            return FaceDirection.Right;
        case FaceDirection.Unknown:
            return unknown;
    }
    return dir;
}
