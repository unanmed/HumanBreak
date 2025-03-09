import { IWeather } from './weather';

export class SunWeather implements IWeather {
    static id: string = 'sun';

    activate(): void {}

    frame(): void {}

    deactivate(): void {}
}
