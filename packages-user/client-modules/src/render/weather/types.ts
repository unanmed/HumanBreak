import { RenderItem } from '@motajs/render-core';

export interface IWeather<T extends RenderItem = RenderItem> {
    /** 天气的等级，-1 表示未创建 */
    readonly level: number;

    /**
     * 创建天气
     * @param level 天气等级
     * @returns 天气的渲染元素
     */
    create(level: number): T;

    /**
     * 摧毁这个天气
     */
    destroy(): void;

    /**
     * 每帧执行一次的函数
     * @param timestamp 当前时间戳
     */
    tick(timestamp: number): void;
}

export interface IWeatherInstance<
    R extends RenderItem = RenderItem,
    T extends IWeather<R> = IWeather<R>
> {
    /** 天气对象 */
    readonly weather: T;
    /** 天气的渲染元素 */
    readonly element: R;

    /**
     * 设置这个天气的纵深
     * @param zIndex 纵深
     */
    setZIndex(zIndex: number): void;
}

export interface IWeatherController {
    /** 天气控制器绑定到的渲染元素 */
    readonly container: RenderItem | null;
    /** 所有已激活的天气 */
    readonly active: Set<IWeatherInstance>;

    /**
     * 绑定控制器到渲染元素
     * @param container 绑定的渲染元素，需要能够添加子元素，一般绑定到 `container`
     */
    bind(container: RenderItem): void;

    /**
     * 使用天气名称添加天气
     * @param weather 天气的名称
     * @param level 天气的等级
     * @returns 天气实例
     */
    activate(weather: string, level?: number): IWeatherInstance | null;
    /**
     * 使用天气对象添加天气
     * @param weather 天气对象
     * @param level 天气的等级
     * @returns 天气实例
     */
    activate<R extends RenderItem, T extends IWeather<R>>(
        weather: T,
        level?: number
    ): IWeatherInstance<R, T> | null;

    /**
     * 取消天气
     * @param instance 天气实例
     */
    deactivate(instance: IWeatherInstance): void;

    /**
     * 清空天气
     */
    clearWeather(): void;

    /**
     * 摧毁这个控制器
     */
    destroy(): void;
}
