import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuejsx from '@vitejs/plugin-vue-jsx';
import path from 'path';
import postcssPresetEnv from 'postcss-preset-env';
import * as glob from 'glob';

const custom = [
    'container', 'image', 'sprite', 'shader', 'text', 'comment', 'custom', 
    'layer', 'layer-group', 'animate', 'icon', 'winskin', 'container-custom'
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
        vue(),
        vuejsx({
            isCustomElement: tag => {
                return custom.includes(tag) || tag.startsWith('g-');
            }
        })
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
        watch: {
            ignored: ['**/public/**']
        },
    }
});
