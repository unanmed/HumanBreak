import { WeatherController } from './controller';
import { CloudWeather, RainWeather } from './presets';

export function createWeather() {
    WeatherController.register('cloud', CloudWeather);
    WeatherController.register('rain', RainWeather);
    // WeatherController.register('snow', SnowWeather);
    // WeatherController.register('sun', SunWeather);
}

export * from './presets';
export * from './controller';
export * from './types';
export * from './weather';
