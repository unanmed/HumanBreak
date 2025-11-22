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

export function locInMap(x: number, y: number, floorId: FloorIds) {
    const { width, height } = core.status.maps[floorId];
    return x >= 0 && y >= 0 && x < width && y < height;
}

/**
 * 广义检查能否移动，指定两个点以及行走方向，返回能否执行上述移动。
 * 可以传入地图之外的点，视为可以随意移动。仅检查 cannotIn 和 cannotOut，不检查 noPass
 * @param fx 出点横坐标
 * @param fy 出点纵坐标
 * @param tx 入点横坐标
 * @param ty 入点纵坐标
 * @param dir 行走方向
 * @param fromFloorId 出点楼层id
 * @param toFloorId 入点楼层id
 */
export function checkCanMoveExtended(
    fx: number,
    fy: number,
    tx: number,
    ty: number,
    dir: Dir,
    fromFloorId: FloorIds = core.status.floorId,
    toFloorId: FloorIds = core.status.floorId
) {
    const fromInMap = locInMap(fx, fy, fromFloorId);
    const toInMap = locInMap(tx, ty, toFloorId);
    const map = maps_90f36752_8815_4be8_b32b_d7fad1d0542e;

    if (fromInMap) {
        const cannotMove = core.floors[fromFloorId].cannotMove;
        const fromIndex: LocString = `${fx},${fy}`;
        // 检查当前点是否有不可出
        if (cannotMove[fromIndex]?.includes(dir)) return false;
        const blocks = getBlockForLoc(fx, fy, fromFloorId);
        const can = blocks.some(v => {
            if (v === 0) return false;
            const out = map[v as Exclude<AllNumbers, 0>]?.cannotOut;
            return out?.includes(dir);
        });
        if (can) return false;
    }
    if (toInMap) {
        const cannotMoveIn = core.floors[toFloorId].cannotMoveIn;
        const toIndex: LocString = `${tx},${ty}`;
        const back = backDir(dir);
        // 检查目标点是否有不可入
        if (cannotMoveIn[toIndex]?.includes(back)) return false;
        const blocks = getBlockForLoc(tx, ty, toFloorId);
        const can = blocks.some(v => {
            if (v === 0) return false;
            const out = map[v as Exclude<AllNumbers, 0>]?.cannotIn;
            return out?.includes(back);
        });
        if (can) return false;
    }

    return true;
}

function getBlockForLoc(x: number, y: number, floorId: FloorIds) {
    const map = core.status.maps[floorId];
    const floor = core.floors[floorId];
    return [
        floor.bgmap[y][x],
        floor.bg2map[y][x],
        map.map[y][x],
        floor.bgmap[y][x],
        floor.bg2map[y][x]
    ];
}
