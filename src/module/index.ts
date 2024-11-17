import { controller } from './weather';
import { WeatherController } from './weather/weather';

Mota.register('module', 'Weather', {
    controller,
    WeatherController
});
