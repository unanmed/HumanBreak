import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';
import components from 'unplugin-vue-components/vite';
import vuejsx from '@vitejs/plugin-vue-jsx'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import motaConfig from './mota.config';
import { resolve } from 'path';
import postcssPresetEnv from 'postcss-preset-env';

const FSHOST = 'http://127.0.0.1:3000/';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vuejsx(),
        legacy({
            targets: ['defaults', 'not IE 11'],
            polyfills: true,
            modernPolyfills: true
        }),
        components({ resolvers: [AntDesignVueResolver()] })
    ],
    base: `/games/${motaConfig.name}/`,
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@ui': resolve(__dirname, './src/ui')
        }
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
                        'three',
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
