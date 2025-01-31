import { RainWeather } from './rain';
import { SnowWeather } from './snow';
import { SunWeather } from './sun';
import { WeatherController } from './weather';

WeatherController.register('rain', RainWeather);
WeatherController.register('sun', SunWeather);
WeatherController.register('snow', SnowWeather);

export * from './weather';
export * from './rain';
