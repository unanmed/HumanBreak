import { Mota } from '@user/entry-data';
import * as Client from '@motajs/client';
import * as ClientBase from '@motajs/client-base';
import * as LegacyClient from '@motajs/legacy-client';
import * as LegacySystem from '@motajs/legacy-system';
import * as LegacyUI from '@motajs/legacy-ui';
import * as Render from '@motajs/render';
import * as RenderAssets from '@motajs/render-assets';
import * as RenderCore from '@motajs/render-core';
import * as RenderElements from '@motajs/render-elements';
import * as RenderStyle from '@motajs/render-style';
import * as RenderVue from '@motajs/render-vue';
import * as System from '@motajs/system';
import * as SystemAction from '@motajs/system-action';
import * as SystemUI from '@motajs/system-ui';
import * as UserClientBase from '@user/client-base';
import * as ClientModules from '@user/client-modules';
import * as LegacyPluginClient from '@user/legacy-plugin-client';
import * as MutateAnimate from 'mutate-animate';
import * as Vue from 'vue';
import * as Lodash from 'lodash-es';
import { hook, loading } from '@user/data-base';

export function create() {
    loading.once('registered', createModule);

    Mota.register('@motajs/client', Client);
    Mota.register('@motajs/client-base', ClientBase);
    Mota.register('@motajs/legacy-client', LegacyClient);
    Mota.register('@motajs/legacy-system', LegacySystem);
    Mota.register('@motajs/legacy-ui', LegacyUI);
    Mota.register('@motajs/render', Render);
    Mota.register('@motajs/render-assets', RenderAssets);
    Mota.register('@motajs/render-core', RenderCore);
    Mota.register('@motajs/render-elements', RenderElements);
    Mota.register('@motajs/render-style', RenderStyle);
    Mota.register('@motajs/render-vue', RenderVue);
    Mota.register('@motajs/system', System);
    Mota.register('@motajs/system-action', SystemAction);
    Mota.register('@motajs/system-ui', SystemUI);
    Mota.register('@user/client-base', UserClientBase);
    Mota.register('@user/client-modules', ClientModules);
    Mota.register('@user/legacy-plugin-client', LegacyPluginClient);
    Mota.register('MutateAnimate', MutateAnimate);
    Mota.register('Vue', Vue);
    Mota.register('Lodash', Lodash);

    loading.emit('clientRegistered');
}

async function createModule() {
    UserClientBase.create();
    ClientModules.create();
    LegacyUI.create();

    await import('ant-design-vue/dist/antd.dark.css');
    main.renderLoaded = true;
    hook.emit('renderLoaded');
}
