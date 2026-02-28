import { ITexture } from '@motajs/render-assets';
import {
    FaceDirection,
    HeroAnimateDirection,
    IHeroState,
    IMapLayer
} from '@user/data-state';
import { Font } from '@motajs/render-style';

export interface IMapExtensionManager {
    /**
     * 添加勇士渲染拓展
     * @param state 勇士状态
     * @param layer 勇士所在图层
     */
    addHero(state: IHeroState, layer: IMapLayer): IMapHeroRenderer | null;

    /**
     * 移除勇士渲染拓展
     * @param state 勇士状态
     */
    removeHero(state: IHeroState): void;

    /**
     * 添加开门动画拓展
     */
    addDoor(layer: IMapLayer): IMapDoorRenderer | null;

    /**
     * 移除开门动画拓展
     */
    removeDoor(layer: IMapLayer): void;

    /**
     * 摧毁这个拓展管理对象，释放相关资源
     */
    destroy(): void;
}

export interface IMapHeroRenderer {
    /**
     * 设置勇士图片
     * @param image 勇士使用的图片
     */
    setImage(image: ITexture): void;

    /**
     * 添加跟随者
     * @param image 跟随者图块数字
     * @param id 跟随者的 id，用于删除操作
     */
    addFollower(image: number, id: string): void;

    /**
     * 取消跟随者
     * @param follower 跟随者的 id
     * @param animate 填 `true` 的话，如果删除了中间的跟随者，后续跟随者会使用移动动画移动到下一格，否则瞬移至下一格
     */
    removeFollower(follower: string, animate: boolean): Promise<void>;

    /**
     * 移除所有跟随者
     */
    removeAllFollowers(): void;

    /**
     * 设置勇士位置
     */
    setPosition(x: number, y: number): void;

    /**
     * 开始移动，在移动前需要调用此方法切换勇士状态
     */
    startMove(): void;

    /**
     * 等待勇士移动停止后，将移动状态切换为停止
     * @param waitFollower 是否也等待跟随者移动结束
     */
    waitMoveEnd(waitFollower: boolean): Promise<void>;

    /**
     * 立刻停止移动，勇士和跟随者瞬移到目标点
     */
    stopMove(): void;

    /**
     * 勇士朝某个方向移动
     * @param direction 移动方向
     */
    move(direction: FaceDirection, time: number): Promise<void>;

    /**
     * 跳跃勇士至目标点
     * @param x 目标点横坐标
     * @param y 目标点纵坐标
     * @param time 跳跃时长
     * @param waitFollower 是否等待跟随者也跳跃完毕
     */
    jumpTo(
        x: number,
        y: number,
        time: number,
        waitFollower: boolean
    ): Promise<void>;

    /**
     * 设置勇士不透明度
     * @param alpha 不透明度
     */
    setAlpha(alpha: number): void;

    /**
     * 设置跟随者的不透明度
     * @param identifier 跟随者标识符
     * @param alpha 跟随者不透明度
     */
    setFollowerAlpha(identifier: string, alpha: number): void;

    /**
     * 设置勇士移动的动画播放方向，一般后退会使用反向播放的动画，前进使用正向播放的动画
     * @param direction 动画方向
     */
    setHeroAnimateDirection(direction: HeroAnimateDirection): void;

    /**
     * 设置勇士朝向
     * @param direction 勇士朝向，不填表示顺时针旋转
     */
    turn(direction?: FaceDirection): void;

    /**
     * 摧毁这个勇士渲染拓展，释放相关资源
     */
    destroy(): void;
}

export interface IMapDoorRenderer {
    /**
     * 开启指定位置的门，播放开门动画
     * @param x 门横坐标
     * @param y 门纵坐标
     */
    openDoor(x: number, y: number): Promise<void>;

    /**
     * 在指定位置执行关门动画
     * @param num 门图块数字
     * @param x 门横坐标
     * @param y 门纵坐标
     */
    closeDoor(num: number, x: number, y: number): Promise<void>;

    /**
     * 设置开关门动画两帧之间的间隔
     * @param interval 开门动画间隔
     */
    setAnimateInterval(interval: number): void;

    /**
     * 摧毁这个门动画拓展，释放相关资源
     */
    destroy(): void;
}

export interface IMapTextRenderable {
    /** 文本内容 */
    readonly text: string;
    /** 文本字体 */
    readonly font: Font;
    /** 文本填充样式 */
    readonly fillStyle: CanvasStyle;
    /** 文本描边样式 */
    readonly strokeStyle: CanvasStyle;
    /** 文本横坐标，注意 {@link IMapTextArea.addTextRenderable} 的相对关系 */
    readonly px: number;
    /** 文本纵坐标，注意 {@link IMapTextArea.addTextRenderable} 的相对关系 */
    readonly py: number;
    /** 文本横向对齐方式 */
    readonly textAlign: CanvasTextAlign;
    /** 文本纵向对齐方式 */
    readonly textBaseline: CanvasTextBaseline;
}

export interface IMapTextRequested {
    /**
     * 申请更新指定的图块
     * @param blocks 需要更新数据的图块列表
     */
    requestBlocks(blocks: IMapTextArea[]): void;
}

export interface IMapTextArea {
    /** 图块在地图上的索引 */
    index: number;
    /** 图块横坐标 */
    mapX: number;
    /** 图块纵坐标 */
    mapY: number;

    /**
     * 添加文字可渲染对象。可渲染对象的坐标相对于图块，而非地图。
     * @param renderable 可渲染对象
     */
    addTextRenderable(renderable: IMapTextRenderable): void;

    /**
     * 移除指定的文字可渲染对象
     * @param renderable 可渲染对象
     */
    removeTextRenderable(renderable: IMapTextRenderable): void;

    /**
     * 清除本图块的所有文字可渲染对象
     */
    clear(): void;
}

export interface IOnMapTextRenderer {
    /**
     * 渲染地图文字，返回的画布就是文字画到的画布
     */
    render(): HTMLCanvasElement;

    /**
     * 申请指定图块坐标的文字管理对象
     * @param x 图块横坐标
     * @param y 图块纵坐标
     */
    requireBlockArea(x: number, y: number): Readonly<IMapTextArea>;

    /**
     * 判断是否需要更新
     */
    needUpdate(): boolean;

    /**
     * 清空所有文字内容
     */
    clear(): void;

    /**
     * 摧毁这个文字渲染对象，释放相关资源
     */
    destroy(): void;
}
