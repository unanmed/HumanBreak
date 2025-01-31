import { Patch } from '@/common/patch';
import { patchAudio } from './audio';
import { patchWeather } from './weather';

export function patchAll() {
    patchAudio();
    patchWeather();
    const loading = Mota.require('var', 'loading');
    loading.once('coreInit', () => {
        Patch.patchAll();
    });
}
