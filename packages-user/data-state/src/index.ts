import { loading } from '@user/data-base';
import { createMechanism } from './mechanism';
import { CoreState } from './core';
import { isNil } from 'lodash-es';
import { FaceDirection } from './common';

function createCoreState() {
    //#region 地图部分

    const width = core._WIDTH_;
    const height = core._HEIGHT_;
    const bg = state.layer.addLayer(width, height);
    const bg2 = state.layer.addLayer(width, height);
    const event = state.layer.addLayer(width, height);
    const fg = state.layer.addLayer(width, height);
    const fg2 = state.layer.addLayer(width, height);
    state.layer.setLayerAlias(bg, 'bg');
    state.layer.setLayerAlias(bg2, 'bg2');
    state.layer.setLayerAlias(event, 'event');
    state.layer.setLayerAlias(fg, 'fg');
    state.layer.setLayerAlias(fg2, 'fg2');

    //#endregion

    //#region 图块部分

    const data = Object.entries(core.maps.blocksInfo);
    for (const [key, block] of data) {
        const num = Number(key);
        state.idNumberMap.set(block.id, num);
        state.numberIdMap.set(num, block.id);
    }

    for (const [key, block] of data) {
        if (!block.faceIds) continue;
        const { down, up, left, right } = block.faceIds;
        const downNum = state.idNumberMap.get(down);
        if (downNum !== Number(key)) continue;
        const upNum = state.idNumberMap.get(up);
        const leftNum = state.idNumberMap.get(left);
        const rightNum = state.idNumberMap.get(right);
        state.roleFace.malloc(downNum, FaceDirection.Down);
        if (!isNil(upNum)) {
            state.roleFace.bind(upNum, downNum, FaceDirection.Up);
        }
        if (!isNil(leftNum)) {
            state.roleFace.bind(leftNum, downNum, FaceDirection.Left);
        }
        if (!isNil(rightNum)) {
            state.roleFace.bind(rightNum, downNum, FaceDirection.Right);
        }
    }

    //#endregion
}

export function create() {
    createMechanism();
    loading.once('loaded', () => {
        // 加载后初始化全局状态
        createCoreState();
    });
}

/**
 * 数据端核心状态，目前处于过渡阶段，仅服务于渲染，不负责任何逻辑计算，会在后续把核心逻辑逐渐移动至此对象。
 * 此对象是数据端状态，本身不负责任何渲染操作，仅会向渲染端发送数据让渲染端渲染，不要把渲染操作直接放到此对象上，
 * 否则可能导致录像验证失败。
 */
export const state = new CoreState();

export * from './common';
export * from './core';
export * from './enemy';
export * from './hero';
export * from './map';
export * from './mechanism';
export * from './legacy';
