import { soundPlayer } from './audio';
import { patchAll } from './fallback';
import { create } from './render';
import { RainWeather } from './weather/rain';
import { WeatherController } from './weather/weather';

patchAll();
Mota.register('module', 'Weather', {
    WeatherController,
    RainWeather
});
Mota.register('module', 'Audio', {
    soundPlayer
});
Mota.require('var', 'loading').once('coreInit', create);

export * from './weather';
export * from './audio';
export * from './loader';
export * from './fallback';
export * from './render';
