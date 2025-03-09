import { Mota } from './mota';
import * as DataBase from '@user/data-base';
import * as DataFallback from '@user/data-fallback';
import * as DataState from '@user/data-state';
import * as DataUtils from '@user/data-utils';
import * as LegacyPluginData from '@user/legacy-plugin-data';

export function create() {
    Mota.register('@user/data-base', DataBase);
    Mota.register('@user/data-fallback', DataFallback);
    Mota.register('@user/data-state', DataState);
    Mota.register('@user/data-utils', DataUtils);
    Mota.register('@user/legacy-plugin-data', LegacyPluginData);
}
