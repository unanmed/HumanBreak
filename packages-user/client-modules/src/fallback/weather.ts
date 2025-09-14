import { Patch, PatchClass } from '@motajs/legacy-common';
import { WeatherController } from '../render/weather';
import { isNil } from 'lodash-es';

// todo: 添加弃用警告 logger.warn(56)

export function patchWeather() {
    const patch = new Patch(PatchClass.Control);
    let nowWeather: string = '';
    let nowLevel: number = 0;

    patch.add('setWeather', (type, level) => {
        const weather = WeatherController.get('main');
        if (!weather) return;
        if (type === nowWeather && level === nowLevel) return;
        weather.clearWeather();
        if (!isNil(type)) {
            weather.activate(type, level);
            nowWeather = type;
            nowLevel = level ?? 5;
        }
    });
}
