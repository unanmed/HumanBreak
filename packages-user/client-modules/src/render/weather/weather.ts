import { RenderItem } from '@motajs/render-core';
import { IWeather } from './types';

export abstract class Weather<T extends RenderItem> implements IWeather<T> {
    level: number = -1;

    protected element: T | null = null;

    create(level: number): T {
        this.level = level;
        const element = this.createElement(level);
        this.element = element;
        return element;
    }

    destroy(): void {
        this.element?.destroy();
        this.onDestroy();
    }

    abstract tick(timestamp: number): void;

    /**
     * 创建天气的渲染元素，并进行初始化
     * @param level 天气的等级
     */
    abstract createElement(level: number): T;

    /**
     * 当天气被摧毁时调用，进行清理工作，会自动摧毁渲染元素，不需要手动处理
     */
    abstract onDestroy(): void;
}
