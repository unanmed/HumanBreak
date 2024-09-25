const dirMap: Record<Dir2, Dir> = {
    down: 'down',
    left: 'left',
    leftdown: 'left',
    leftup: 'left',
    right: 'right',
    rightdown: 'right',
    rightup: 'right',
    up: 'up'
};

/**
 * 将八方向转换为四方向，一般用于斜角移动时的方向显示
 * @param dir 八方向
 */
export function toDir(dir: Dir2): Dir {
    return dirMap[dir];
}

const backDirMap: Record<Dir2, Dir2> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
    leftup: 'rightdown',
    rightup: 'leftdown',
    leftdown: 'rightup',
    rightdown: 'leftup'
};

export function backDir(dir: Dir): Dir;
export function backDir(dir: Dir2): Dir2;
export function backDir(dir: Dir2): Dir2 {
    return backDirMap[dir];
}
