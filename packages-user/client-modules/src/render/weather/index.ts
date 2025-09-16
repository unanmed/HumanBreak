import { WeatherController } from './controller';
import { CloudWeather, RainWeather, SunWeather } from './presets';

export function createWeather() {
    WeatherController.register('cloud', CloudWeather);
    WeatherController.register('rain', RainWeather);
    WeatherController.register('sun', SunWeather);
    // WeatherController.register('snow', SnowWeather);
}

export * from './presets';
export * from './controller';
export * from './types';
export * from './weather';
