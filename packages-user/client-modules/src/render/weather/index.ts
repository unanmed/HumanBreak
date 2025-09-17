import { WeatherController } from './controller';
import {
    CloudWeather,
    FogWeather,
    RainWeather,
    SnowWeather,
    SunWeather
} from './presets';

export function createWeather() {
    WeatherController.register('cloud', CloudWeather);
    WeatherController.register('rain', RainWeather);
    WeatherController.register('snow', SnowWeather);
    WeatherController.register('sun', SunWeather);
    WeatherController.register('fog', FogWeather);
}

export * from './presets';
export * from './controller';
export * from './types';
export * from './weather';
