import { onUnmounted } from 'vue';
import { WeatherController } from '../weather';

let weatherId = 0;

export function useWeather(): [WeatherController] {
    const weather = new WeatherController(`@weather-${weatherId}`);
    weatherId++;

    onUnmounted(() => {
        weather.destroy();
    });

    return [weather];
}
