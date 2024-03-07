import { createApp } from 'vue';
import './styles.less';
import 'ant-design-vue/dist/antd.dark.less';

export * from './game/system';

const list = [
    'libs/thirdparty/lz-string.min.js',
    'libs/thirdparty/priority-queue.min.js',
    'libs/thirdparty/localforage.min.js',
    'libs/thirdparty/zip.min.js',
    'project/data.js',
    'main.js'
];

load();

async function load() {
    await loadJsList(list);
    await import('./game/index');
    await import('./core/index');
    const { default: App } = await import('./App.vue');

    createApp(App).mount('#root');

    main.init('play');
    main.listen();
}

function loadJsList(list: string[]) {
    return Promise.all(
        list.map(v => {
            return loadJs(v);
        })
    );
}

function loadJs(src: string) {
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);

    return new Promise<void>(res => {
        script.addEventListener(
            'load',
            () => {
                res();
            },
            { once: true }
        );
    });
}
