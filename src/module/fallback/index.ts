import { Patch } from '@/common/patch';
import { patchAudio } from './audio';

patchAudio();

export function patchAll() {
    const loading = Mota.require('var', 'loading');
    loading.once('coreInit', () => {
        Patch.patchAll();
    });
}
