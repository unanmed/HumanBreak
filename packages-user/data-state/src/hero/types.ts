import { IHookBase, IHookable } from '@motajs/common';
import { FaceDirection } from '../common/types';

export const enum HeroAnimateDirection {
    /** 正向播放动画 */
    Forward,
    /** 反向播放动画 */
    Backward
}

export interface IHeroFollower {
    /** 跟随者的图块数字 */
    readonly num: number;
    /** 跟随者的标识符 */
    readonly identifier: string;
    /** 跟随者的不透明度 */
    alpha: number;
}

export interface IHeroStateHooks extends IHookBase {
    /**
     * 当设置勇士的坐标时触发
     * @param controller 钩子控制器
     * @param x 勇士横坐标
     * @param y 勇士纵坐标
     */
    onSetPosition(x: number, y: number): void;

    /**
     * 当设置勇士朝向时触发
     * @param direction 勇士朝向
     */
    onTurnHero(direction: FaceDirection): void;

    /**
     * 当勇士开始移动时触发
     */
    onStartMove(): void;

    /**
     * 当移动勇士时触发
     * @param controller 钩子控制器
     * @param direction 移动方向
     * @param time 移动动画时长
     */
    onMoveHero(direction: FaceDirection, time: number): Promise<void>;

    /**
     * 当停止移动时触发
     */
    onEndMove(): Promise<void>;

    /**
     * 当勇士跳跃时触发
     * @param x 目标点横坐标
     * @param y 目标点纵坐标
     * @param time 跳跃动画时长
     * @param waitFollower 是否等待跟随者跳跃完毕
     */
    onJumpHero(
        x: number,
        y: number,
        time: number,
        waitFollower: boolean
    ): Promise<void>;

    /**
     * 当设置勇士图片时触发
     * @param image 勇士图片 id
     */
    onSetImage(image: ImageIds): void;

    /**
     * 当设置勇士不透明度时执行
     * @param alpha 不透明度
     */
    onSetAlpha(alpha: number): void;

    /**
     * 添加跟随者时触发
     * @param follower 跟随者的图块数字
     * @param identifier 跟随者的标识符
     */
    onAddFollower(follower: number, identifier: string): void;

    /**
     * 当移除跟随者时触发
     * @param identifier 跟随者的标识符
     * @param animate 填 `true` 的话，如果删除了中间的跟随者，后续跟随者会使用移动动画移动到下一格，否则瞬移至下一格
     */
    onRemoveFollower(identifier: string, animate: boolean): void;

    /**
     * 当移除所有跟随者时触发
     */
    onRemoveAllFollowers(): void;

    /**
     * 设置跟随者的不透明度
     * @param identifier 跟随者标识符
     * @param alpha 跟随者不透明度
     */
    onSetFollowerAlpha(identifier: string, alpha: number): void;
}

export interface IHeroState extends IHookable<IHeroStateHooks> {
    /** 勇士横坐标 */
    readonly x: number;
    /** 勇士纵坐标 */
    readonly y: number;
    /** 勇士朝向 */
    readonly direction: FaceDirection;
    /** 勇士图片 */
    readonly image?: ImageIds;
    /** 跟随者列表 */
    readonly followers: readonly IHeroFollower[];
    /** 勇士当前的不透明度 */
    readonly alpha: number;

    /**
     * 设置勇士位置
     * @param x 横坐标
     * @param y 纵坐标
     */
    setPosition(x: number, y: number): void;

    /**
     * 设置勇士朝向
     * @param direction 勇士朝向，不填表示顺时针旋转
     */
    turn(direction?: FaceDirection): void;

    /**
     * 开始勇士移动，在移动前必须先调用此方法将勇士切换为移动状态
     */
    startMove(): void;

    /**
     * 移动勇士。能否移动的逻辑暂时不在这里，目前作为过渡作用，仅服务于渲染
     * @param dir 移动方向
     * @param time 移动动画时长，默认 100ms
     * @returns 移动的 `Promise`，当相关的移动动画结束后兑现
     */
    move(dir: FaceDirection, time?: number): Promise<void>;

    /**
     * 结束勇士移动
     * @returns 当移动动画结束后兑现的 `Promise`
     */
    endMove(): Promise<void>;

    /**
     * 跳跃勇士至目标点
     * @param x 目标点横坐标
     * @param y 目标点纵坐标
     * @param time 跳跃动画时长，默认 500ms
     * @param waitFollower 是否等待跟随者跳跃完毕，默认不等待
     * @returns 跳跃的 `Promise`，当相关的移动动画结束后兑现
     */
    jumpHero(
        x: number,
        y: number,
        time?: number,
        waitFollower?: boolean
    ): Promise<void>;

    /**
     * 设置勇士图片
     * @param image 图片 id
     */
    setImage(image: ImageIds): void;

    /**
     * 设置勇士的不透明度
     * @param alpha 不透明度
     */
    setAlpha(alpha: number): void;

    /**
     * 添加一个跟随者
     * @param follower 跟随者的图块数字
     * @param identifier 跟随者的标识符，可以用来移除
     */
    addFollower(follower: number, identifier: string): void;

    /**
     * 移除指定的跟随者
     * @param identifier 跟随者的标识符
     * @param animate 填 `true` 的话，如果删除了中间的跟随者，后续跟随者会使用移动动画移动到下一格，否则瞬移至下一格
     */
    removeFollower(identifier: string, animate?: boolean): void;

    /**
     * 移除所有跟随者
     */
    removeAllFollowers(): void;

    /**
     * 设置指定跟随者的不透明度
     * @param identifier 跟随者标识符
     * @param alpha 跟随者不透明度
     */
    setFollowerAlpha(identifier: string, alpha: number): void;
}
