import { logger } from '@/core/common/logger';
import { RenderItem } from '@/core/render';
import { Ticker } from 'mutate-animate';

export interface IWeather {
    /**
     * 初始化天气，当天气被添加时会被立刻调用
     */
    activate(item: RenderItem): void;

    /**
     * 每帧执行的函数
     */
    frame(): void;

    /**
     * 摧毁这个天气，当天气被删除时会执行
     */
    deactivate(item: RenderItem): void;
}

type Weather = new (level?: number) => IWeather;

export class WeatherController {
    static list: Map<string, Weather> = new Map();
    static map: Map<string, WeatherController> = new Map();

    /** 当前的所有天气 */
    active: Set<IWeather> = new Set();
    ticker: Ticker = new Ticker();

    private binded?: RenderItem;

    constructor(public readonly id: string) {
        WeatherController.map.set(id, this);
    }

    private tick = () => {
        this.active.forEach(v => {
            v.frame();
        });
    };

    /**
     * 清空所有天气
     */
    clearWeather() {
        if (this.binded) {
            this.active.forEach(v => {
                v.deactivate(this.binded!);
            });
        }
        this.active.clear();
    }

    /**
     * 获取一个天气
     * @param weather 要获取的天气
     */
    getWeather<T extends IWeather = IWeather>(weather: Weather): T | null {
        return ([...this.active].find(v => v instanceof weather) as T) ?? null;
    }

    /**
     * 添加一个天气，如果天气不存在则抛出警告。注意虽然原则上不允许天气重复。
     * @param id 天气的id
     * @param level 天气的等级
     * @returns 天气实例，可以操作天气的效果，也可以用来删除
     */
    activate(id: string, level?: number) {
        const Weather = WeatherController.list.get(id);
        if (!Weather) {
            logger.warn(25, id);
            return;
        }
        const weather = new Weather(level);
        this.active.add(weather);
        if (this.binded) {
            weather.activate(this.binded);
        }
        if (!this.ticker.funcs.has(this.tick)) {
            this.ticker.add(this.tick);
        }
        return weather;
    }

    /**
     * 删除一个天气
     * @param weather 要删除的天气
     */
    deactivate(weather: IWeather) {
        this.active.delete(weather);
        if (this.active.size === 0) {
            this.ticker.remove(this.tick);
        }
        if (this.binded) {
            weather.deactivate(this.binded);
        }
    }

    /**
     * 将这个天气控制器绑定至一个渲染元素上
     * @param item 要绑定的元素，不填表示取消绑定
     */
    bind(item?: RenderItem) {
        if (this.binded) {
            this.active.forEach(v => v.deactivate(this.binded!));
        }
        this.binded = item;
        if (item) {
            this.active.forEach(v => v.activate(item));
        }
    }

    /**
     * 摧毁这个天气控制器
     */
    destroy() {
        WeatherController.map.delete(this.id);
    }

    static get(id: string) {
        return this.map.get(id);
    }

    static register(id: string, weather: Weather) {
        this.list.set(id, weather);
    }
}
