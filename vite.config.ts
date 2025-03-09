import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';
import components from 'unplugin-vue-components/vite';
import vuejsx from '@vitejs/plugin-vue-jsx'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import path, { resolve } from 'path';
import postcssPresetEnv from 'postcss-preset-env';
import * as glob from 'glob'

const FSHOST = 'http://127.0.0.1:3000/';

const custom = [
    'container', 'image', 'sprite', 'shader', 'text', 'comment', 'custom', 
    'layer', 'layer-group', 'animate', 'damage', 'graphics', 'icon', 'winskin',
    'container-custom'
]

const aliases = glob.sync('packages/*/src').map((srcPath) => {
    const packageName = path.basename(path.dirname(srcPath));
    return {
        find: `@motajs/${packageName}`,
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
        legacy({
            targets: [
                'Chrome >= 56',
                'Firefox >= 51',
                'Edge >= 79',
                'Safari >= 15',
                'Opera >= 43'
            ],
            polyfills: true,
            modernPolyfills: true
        }),
        components({ resolvers: [AntDesignVueResolver()] })
    ],
    base: `./`,
    resolve: {
        alias: [
            ...aliases
        ]
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    antdv: ['ant-design-vue', '@ant-design/icons-vue'],
                    common: [
                        'lodash-es',
                        'axios',
                        'lz-string',
                        'chart.js',
                        'mutate-animate',
                        '@vueuse/core'
                    ]
                }
            }
        }
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
            '^/all/.*': {
                target: FSHOST,
                changeOrigin: true,
                rewrite(path) {
                    return path.replace(/^\/all/, '');
                },
            },
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
