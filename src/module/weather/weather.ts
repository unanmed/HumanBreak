import { logger } from '@/core/common/logger';
import { Ticker } from 'mutate-animate';

export interface IWeather {
    /**
     * 初始化天气，当天气被添加时会被立刻调用
     */
    activate(): void;

    /**
     * 每帧执行的函数
     */
    frame(): void;

    /**
     * 摧毁这个天气，当天气被删除时会执行
     */
    deactivate(): void;
}

interface Weather<T extends IWeather = IWeather> {
    id: string;
    new (level?: number): T;
}

export class WeatherController {
    static list: Map<string, Weather> = new Map();

    /** 当前的所有天气 */
    active: Set<IWeather> = new Set();
    ticker: Ticker = new Ticker();

    private tick = () => {
        this.active.forEach(v => {
            v.frame();
        });
    };

    /**
     * 获取一个天气
     * @param weather 要获取的天气
     */
    getWeather<T extends IWeather>(weather: Weather<T>): T | null {
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
        weather.activate();
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
        weather.deactivate();
    }

    static register(weather: Weather) {
        this.list.set(weather.id, weather);
    }
}
