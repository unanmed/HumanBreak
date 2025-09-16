import { RenderItem } from '@motajs/render-core';
import { IWeather, IWeatherController, IWeatherInstance } from './types';
import { logger } from '@motajs/common';
import { isNil } from 'lodash-es';
import { Ticker } from 'mutate-animate';

type WeatherConstructor = new () => IWeather;

export class WeatherController implements IWeatherController {
    /** 暴露到全局的控制器 */
    static extern: Map<string, IWeatherController> = new Map();
    /** 注册的天气 */
    static weathers: Map<string, WeatherConstructor> = new Map();

    private static ticker: Ticker = new Ticker();

    /** 暴露至全局的 id */
    private externId?: string;
    /** 天气元素纵深 */
    private zIndex: number = 100;

    readonly active: Set<IWeatherInstance> = new Set();

    container: RenderItem | null = null;

    constructor() {
        WeatherController.ticker.add(this.tick);
    }

    private tick = (time: number) => {
        this.active.forEach(v => v.weather.tick(time));
    };

    /**
     * 设置天气元素纵深，第一个天气会被设置为 `zIndex`，之后依次是 `zIndex+1` `zIndex+2` ...
     * @param zIndex 第一个天气的纵深
     */
    setZIndex(zIndex: number) {
        this.zIndex = zIndex;
        let n = zIndex;
        this.active.forEach(v => {
            v.setZIndex(n);
            n++;
        });
    }

    bind(container: RenderItem): void {
        if (this.container) {
            logger.warn(65);
            return;
        }
        this.container = container;
    }

    private getWeatherObject<R extends RenderItem, T extends IWeather<R>>(
        weather: string | T
    ): T | null {
        if (typeof weather === 'string') {
            const Weather = WeatherController.weathers.get(weather);
            if (!Weather) {
                logger.warn(25, weather);
                return null;
            }
            return new Weather() as T;
        } else {
            return weather;
        }
    }

    activate(weather: string, level?: number): IWeatherInstance | null;
    activate<R extends RenderItem, T extends IWeather<R>>(
        weather: T,
        level?: number
    ): IWeatherInstance<R, T> | null;
    activate<R extends RenderItem, T extends IWeather<R>>(
        weather: string | T,
        level: number = 5
    ): IWeatherInstance<R, T> | null {
        const obj = this.getWeatherObject<R, T>(weather);
        if (!obj || !this.container) return null;
        const element = obj.create(level);
        element.size(this.container.width, this.container.height);
        const instance = new WeatherInstance(obj, element);
        instance.setZIndex(this.zIndex + this.active.size);
        this.active.add(instance);
        this.container.appendChild(element);
        return instance;
    }

    deactivate(instance: IWeatherInstance): void {
        this.container?.removeChild(instance.element);
        instance.weather.destroy();
        this.active.delete(instance);
    }

    clearWeather(): void {
        this.active.forEach(v => {
            v.weather.destroy();
        });
        this.active.clear();
    }

    /**
     * 将此控制器暴露至全局，允许使用 {@link WeatherController.get} 获取到实例
     * @param id 暴露给全局的 id
     */
    extern(id: string) {
        WeatherController.extern.set(id, this);
        this.externId = id;
    }

    destroy() {
        this.clearWeather();
        WeatherController.ticker.remove(this.tick);
        if (!isNil(this.externId)) {
            WeatherController.extern.delete(this.externId);
        }
    }

    /**
     * 获取暴露至全局的控制器
     * @param id 控制器暴露至全局的 id
     */
    static get(id: string): IWeatherController | null {
        return this.extern.get(id) ?? null;
    }

    /**
     * 注册一个天气
     * @param id 天气的名称
     * @param weather 天气的构造器
     */
    static register(id: string, weather: WeatherConstructor) {
        this.weathers.set(id, weather);
    }
}

export class WeatherInstance<
    R extends RenderItem = RenderItem,
    T extends IWeather<R> = IWeather<R>
> implements IWeatherInstance<R, T>
{
    constructor(
        readonly weather: T,
        readonly element: R
    ) {}

    setZIndex(zIndex: number): void {
        this.element.setZIndex(zIndex);
    }
}
