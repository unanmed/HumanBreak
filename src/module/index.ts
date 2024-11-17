import { controller } from './weather';
import { RainWeather } from './weather/rain';
import { WeatherController } from './weather/weather';

Mota.register('module', 'Weather', {
    controller,
    WeatherController,
    RainWeather
});
