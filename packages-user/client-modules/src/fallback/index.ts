import { Patch } from '@motajs/legacy-common';
import { patchAudio } from './audio';
import { patchWeather } from './weather';
import { patchUI } from './ui';

export function patchAll() {
    patchAudio();
    patchWeather();
    patchUI();
}
