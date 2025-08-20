import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import components from 'unplugin-vue-components/vite';
import vuejsx from '@vitejs/plugin-vue-jsx';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';
import postcssPresetEnv from 'postcss-preset-env';
import * as glob from 'glob';

const FSHOST = 'http://127.0.0.1:3000/';

const custom = [
    'container', 'image', 'sprite', 'shader', 'text', 'comment', 'custom', 
    'layer', 'layer-group', 'animate', 'damage', 'graphics', 'icon', 'winskin',
    'container-custom'
];

const aliases = glob.sync('packages/*/src').map((srcPath) => {
    const packageName = path.basename(path.dirname(srcPath));
    return {
        find: `@motajs/${packageName}`,
        replacement: path.resolve(__dirname, srcPath),
    };
});

const aliasesUser = glob.sync('packages-user/*/src').map((srcPath) => {
    const packageName = path.basename(path.dirname(srcPath));
    return {
        find: `@user/${packageName}`,
        replacement: path.resolve(__dirname, srcPath),
    };
});

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue({
            customElement: custom
        }),
        vuejsx({
            isCustomElement: (tag) => {
                return custom.includes(tag) || tag.startsWith('g-');
            }
        }),
        components({ resolvers: [AntDesignVueResolver()] })
    ],
    base: `./`,
    resolve: {
        alias: [
            ...aliases,
            ...aliasesUser
        ]
    },
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true
            }
        },
        postcss: {
            plugins: [postcssPresetEnv()]
        }
    },
    server: {
        proxy: {
            '/readFile': FSHOST,
            '/writeFile': FSHOST,
            '/writeMultiFiles': FSHOST,
            '/listFile': FSHOST,
            '/makeDir': FSHOST,
            '/moveFile': FSHOST,
            '/deleteFile': FSHOST,
            '^/all/.*': FSHOST,
            '^/forceTem/.*': {
                target: FSHOST,
                changeOrigin: true,
                rewrite(path) {
                    return path.replace(/^\/forceTem/, '');
                },
            },
            '/danmaku': 'https://h5mota.com/backend/tower/barrage.php'
        },
        watch: {
            ignored: ['**/public/**']
        },
    }
});
