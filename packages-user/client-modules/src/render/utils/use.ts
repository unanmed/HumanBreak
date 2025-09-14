import { onUnmounted } from 'vue';
import { WeatherController } from '../weather';

export function useWeather(): [WeatherController] {
    const weather = new WeatherController();

    onUnmounted(() => {
        weather.destroy();
    });

    return [weather];
}
