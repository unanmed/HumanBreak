import { patchAll } from '@user/data-fallback';
import { createMota } from './mota';
import { create } from './create';

createMota();
patchAll();
create();

export * from './mota';
