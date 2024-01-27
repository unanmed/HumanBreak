///<reference path="../../../src/types/core.d.ts" />

export function removeMaps(fromId, toId, force) {
    toId = toId || fromId;
    var fromIndex = core.floorIds.indexOf(fromId),
        toIndex = core.floorIds.indexOf(toId);
    if (toIndex < 0) toIndex = core.floorIds.length - 1;
    flags.__visited__ = flags.__visited__ || {};
    flags.__removed__ = flags.__removed__ || [];
    flags.__disabled__ = flags.__disabled__ || {};
    flags.__leaveLoc__ = flags.__leaveLoc__ || {};
    flags.__forceDelete__ ??= {};
    let deleted = false;
    for (var i = fromIndex; i <= toIndex; ++i) {
        var floorId = core.floorIds[i];
        if (core.status.maps[floorId].deleted) continue;
        delete flags.__visited__[floorId];
        flags.__removed__.push(floorId);
        delete flags.__disabled__[floorId];
        delete flags.__leaveLoc__[floorId];
        (core.status.autoEvents || []).forEach(event => {
            if (event.floorId == floorId && event.currentFloor) {
                core.autoEventExecuting(event.symbol, false);
                core.autoEventExecuted(event.symbol, false);
            }
        });
        core.status.maps[floorId].deleted = true;
        core.status.maps[floorId].canFlyTo = false;
        core.status.maps[floorId].canFlyFrom = false;
        core.status.maps[floorId].cannotViewMap = true;
        if (force) {
            core.status.maps[floorId].forceDelete = true;
            flags.__forceDelete__[floorId] = true;
        }
        deleteFlags(floorId);
        deleted = true;
    }
    if (deleted && !main.replayChecking) {
        Mota.Plugin.require('fly').splitArea();
    }
}

export function deleteFlags(floorId) {
    delete flags[`jump_${floorId}`];
    delete flags[`inte_${floorId}`];
    delete flags[`loop_${floorId}`];
    delete flags[`melt_${floorId}`];
    delete flags[`night_${floorId}`];
}

// 恢复楼层
// core.plugin.removeMap.resumeMaps("MT1", "MT300") 恢复MT1~MT300之间的全部层
// core.plugin.removeMap.resumeMaps("MT10") 只恢复MT10层
export function resumeMaps(fromId, toId) {
    toId = toId || fromId;
    var fromIndex = core.floorIds.indexOf(fromId),
        toIndex = core.floorIds.indexOf(toId);
    if (toIndex < 0) toIndex = core.floorIds.length - 1;
    flags.__removed__ = flags.__removed__ || [];
    for (var i = fromIndex; i <= toIndex; ++i) {
        var floorId = core.floorIds[i];
        if (!core.status.maps[floorId].deleted) continue;
        if (
            core.status.maps[floorId].forceDelete ||
            flags.__forceDelete__[floorId]
        )
            continue;
        flags.__removed__ = flags.__removed__.filter(f => {
            return f != floorId;
        });
        core.status.maps[floorId] = core.loadFloor(floorId);
    }
}

// 分区砍层相关
var inAnyPartition = floorId => {
    var inPartition = false;
    (core.floorPartitions || []).forEach(floor => {
        var fromIndex = core.floorIds.indexOf(floor[0]);
        var toIndex = core.floorIds.indexOf(floor[1]);
        var index = core.floorIds.indexOf(floorId);
        if (fromIndex < 0 || index < 0) return;
        if (toIndex < 0) toIndex = core.floorIds.length - 1;
        if (index >= fromIndex && index <= toIndex) inPartition = true;
    });
    return inPartition;
};

// 分区砍层
export function autoRemoveMaps(floorId) {
    if (main.mode != 'play' || !inAnyPartition(floorId)) return;
    // 根据分区信息自动砍层与恢复
    (core.floorPartitions || []).forEach(floor => {
        var fromIndex = core.floorIds.indexOf(floor[0]);
        var toIndex = core.floorIds.indexOf(floor[1]);
        var index = core.floorIds.indexOf(floorId);
        if (fromIndex < 0 || index < 0) return;
        if (toIndex < 0) toIndex = core.floorIds.length - 1;
        if (index >= fromIndex && index <= toIndex) {
            core.plugin.removeMap.resumeMaps(
                core.floorIds[fromIndex],
                core.floorIds[toIndex]
            );
        } else {
            removeMaps(core.floorIds[fromIndex], core.floorIds[toIndex]);
        }
    });
}

core.plugin.removeMap = {
    removeMaps,
    deleteFlags,
    resumeMaps,
    autoRemoveMaps
};
