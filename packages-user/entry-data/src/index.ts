import { createMota } from './mota';
import { create } from './create';
import { patchAll } from '@user/data-fallback';
import { loading } from '@user/data-base';
import { Patch } from '@motajs/legacy-common';

createMota();
patchAll();
create();

loading.once('coreInit', () => {
    Patch.patchAll();
});

export * from './mota';
