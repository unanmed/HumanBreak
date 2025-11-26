import { ILayerState } from './map';
import { IHeroFollower, IHeroState } from './hero';
import { IRoleFaceBinder } from './common';

export interface IStateSaveData {
    /** 跟随者列表 */
    readonly followers: readonly IHeroFollower[];
}

export interface ICoreState {
    /** 地图状态 */
    readonly layer: ILayerState;
    /** 勇士状态 */
    readonly hero: IHeroState;
    /** 朝向绑定 */
    readonly roleFace: IRoleFaceBinder;
    /** id 到图块数字的映射 */
    readonly idNumberMap: Map<string, number>;
    /** 图块数字到 id 的映射 */
    readonly numberIdMap: Map<number, string>;

    /**
     * 保存状态
     */
    saveState(): IStateSaveData;

    /**
     * 加载状态
     * @param data 状态对象
     */
    loadState(data: IStateSaveData): void;
}
