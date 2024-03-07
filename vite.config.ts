import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';
import components from 'unplugin-vue-components/vite';
import vuejsx from '@vitejs/plugin-vue-jsx';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
// @ts-ignore
import postcssPreset from 'postcss-preset-env';

const FSHOST = 'http://127.0.0.1:3000/';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vuejsx(),
        components({
            resolvers: [
                AntDesignVueResolver({
                    importStyle: false
                })
            ]
        })
    ],
    base: `./`,
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
            plugins: [postcssPreset()]
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
                    return './' + path.replace(/^\/all/, '');
                }
            },
            '^/forceTem/.*': {
                target: FSHOST,
                changeOrigin: true,
                rewrite(path) {
                    return './' + path.replace(/^\/forceTem/, '');
                }
            }
        },
        watch: {
            ignored: ['**/public/**']
        }
    }
});
