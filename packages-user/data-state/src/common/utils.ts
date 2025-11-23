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

/**
 * 获取指定朝向旋转后的朝向
 * @param dir 当前朝向
 * @param anticlockwise 是否逆时针旋转，默认顺时针
 * @param face8 是否使用八朝向。为 `false` 时，旋转为九十度旋转，即 上->右->下->左，左上->右上->右下->左下。
 *              为 `true` 时，旋转为四十五度旋转，即 上->右上->右->右下->下->左下->左->左上。逆时针反过来旋转。
 */
export function nextFaceDirection(
    dir: FaceDirection,
    anticlockwise: boolean = false,
    face8: boolean = false
): FaceDirection {
    if (face8) {
        if (anticlockwise) {
            switch (dir) {
                case FaceDirection.Left:
                    return FaceDirection.LeftDown;
                case FaceDirection.LeftDown:
                    return FaceDirection.Down;
                case FaceDirection.Down:
                    return FaceDirection.RightDown;
                case FaceDirection.RightDown:
                    return FaceDirection.Right;
                case FaceDirection.Right:
                    return FaceDirection.RightUp;
                case FaceDirection.RightUp:
                    return FaceDirection.Up;
                case FaceDirection.Up:
                    return FaceDirection.LeftUp;
                case FaceDirection.LeftUp:
                    return FaceDirection.Left;
                case FaceDirection.Unknown:
                    return FaceDirection.Unknown;
            }
        } else {
            switch (dir) {
                case FaceDirection.Left:
                    return FaceDirection.LeftUp;
                case FaceDirection.LeftUp:
                    return FaceDirection.Up;
                case FaceDirection.Up:
                    return FaceDirection.RightUp;
                case FaceDirection.RightUp:
                    return FaceDirection.Right;
                case FaceDirection.Right:
                    return FaceDirection.RightDown;
                case FaceDirection.RightDown:
                    return FaceDirection.Down;
                case FaceDirection.Down:
                    return FaceDirection.LeftDown;
                case FaceDirection.LeftDown:
                    return FaceDirection.Left;
                case FaceDirection.Unknown:
                    return FaceDirection.Unknown;
            }
        }
    } else {
        if (anticlockwise) {
            switch (dir) {
                case FaceDirection.Left:
                    return FaceDirection.Down;
                case FaceDirection.Down:
                    return FaceDirection.Right;
                case FaceDirection.Right:
                    return FaceDirection.Up;
                case FaceDirection.Up:
                    return FaceDirection.Left;
                case FaceDirection.LeftUp:
                    return FaceDirection.LeftDown;
                case FaceDirection.LeftDown:
                    return FaceDirection.RightDown;
                case FaceDirection.RightDown:
                    return FaceDirection.RightUp;
                case FaceDirection.RightUp:
                    return FaceDirection.LeftUp;
                case FaceDirection.Unknown:
                    return FaceDirection.Unknown;
            }
        } else {
            switch (dir) {
                case FaceDirection.Left:
                    return FaceDirection.Up;
                case FaceDirection.Up:
                    return FaceDirection.Right;
                case FaceDirection.Right:
                    return FaceDirection.Down;
                case FaceDirection.Down:
                    return FaceDirection.Left;
                case FaceDirection.LeftUp:
                    return FaceDirection.RightUp;
                case FaceDirection.RightUp:
                    return FaceDirection.RightDown;
                case FaceDirection.RightDown:
                    return FaceDirection.LeftDown;
                case FaceDirection.LeftDown:
                    return FaceDirection.LeftUp;
                case FaceDirection.Unknown:
                    return FaceDirection.Unknown;
            }
        }
    }
}

/**
 * 根据朝向字符串获取朝向枚举值
 * @param dir 朝向字符串
 */
export function fromDirectionString(dir: Dir2): FaceDirection {
    switch (dir) {
        case 'left':
            return FaceDirection.Left;
        case 'right':
            return FaceDirection.Right;
        case 'up':
            return FaceDirection.Up;
        case 'down':
            return FaceDirection.Down;
        case 'leftup':
            return FaceDirection.LeftUp;
        case 'rightup':
            return FaceDirection.RightUp;
        case 'leftdown':
            return FaceDirection.LeftDown;
        case 'rightdown':
            return FaceDirection.RightDown;
        default:
            return FaceDirection.Unknown;
    }
}
