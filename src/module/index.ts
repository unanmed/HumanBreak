import { patchAll } from './fallback';
import { controller } from './weather';
import { RainWeather } from './weather/rain';
import { WeatherController } from './weather/weather';

patchAll();
Mota.register('module', 'Weather', {
    controller,
    WeatherController,
    RainWeather
});

export * from './weather';
export * from './audio';
export * from './loader';
