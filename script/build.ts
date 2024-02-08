import fss from 'fs';
import fs from 'fs-extra';
import Fontmin from 'fontmin';
import * as babel from '@babel/core';
import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';
import rollupBabel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { splitResorce } from './resource.js';
import compressing from 'compressing';
import * as vite from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { buildDeclaration } from './buildDeclaration.js';

const type = process.argv[2];
const map = false;
const resorce = false;
const compress = type === 'dist';

(async function () {
    const timestamp = Date.now();
    // 1. vite打包
    await vite.build({
        plugins: [
            legacy({
                targets: ['defaults', 'not IE 11'],
                polyfills: true,
                modernPolyfills: true
            })
        ]
    });

    // 2. 压缩游戏进程
    try {
        await fs.remove('./dist/project/processG.min.js');

        const build = await rollup.rollup({
            input: 'src/game/index.ts',
            plugins: [
                typescript({
                    sourceMap: false,
                    declaration: true,
                    declarationDir: './dist/types/'
                }),
                rollupBabel({
                    // todo: 是否需要添加 polyfill?
                    babelHelpers: 'bundled',
                    sourceType: 'module'
                }),
                terser(),
                resolve(),
                commonjs()
            ]
        });
        await build.write({
            format: 'iife',
            name: 'CorePlugin',
            file: './dist/project/processG.min.js'
        });

        await fs.remove('./dist/project/plugin/');
    } catch (e) {
        console.log('压缩插件失败');
        console.log(e);
    }

    // 3. 压缩main.js
    try {
        // 先获取不能压缩的部分
        const main = (await fs.readFile('./public/main.js', 'utf-8'))
            .replace(
                /this.pluginUseCompress\s*=\s*false\;/,
                'this.pluginUseCompress = true;'
            )
            .replace('this.timestamp = 0', `this.timestamp = ${timestamp};`);

        const endIndex = main.indexOf('// >>>> body end');
        const nonCompress = main.slice(0, endIndex);
        const needCompress = main.slice(endIndex + 17);
        const compressed = babel.transformSync(needCompress)?.code;
        await fs.writeFile('./dist/main.js', nonCompress + compressed, 'utf-8');
    } catch (e) {
        console.log('main.js压缩失败');
        console.log(e);
    }

    // 4. 打包类型标注
    try {
        await buildDeclaration();
    } catch (e) {
        console.log('打包类型标注失败');
        console.log(e);
    }

    // 5. 迁移类型标注文件
    try {
        await fs.copyFile('./_temp/types/index.d.ts', './dist/index.d.ts');
        await fs.copy('./src/types', './dist/types');
        await fs.copy('./src/source', './dist/source');
    } catch (e) {
        console.log('迁移类型标注文件');
        console.log(e);
    }

    // 6. 部分修改类型标注
    try {
        const indexDTS = await fs.readFile('./dist/index.d.ts', 'utf-8');
        const re = '///<reference path="./types/core.d.ts" />\n' + indexDTS;
        await fs.writeFile('./dist/index.d.ts', re, 'utf-8');

        const pluginDTS = await fs.readFile(
            './dist/types/plugin.d.ts',
            'utf-8'
        );
        const rep = pluginDTS.replaceAll(`../game/system`, `../index.d.ts`);
        await fs.writeFile('./dist/types/plugin.d.ts', rep);

        const js = ['functions.js', 'plugins.js'];
        for (const file of js) {
            const info = await fs.readFile('./dist/project/' + file, 'utf-8');
            const re = info.replace(
                /\/\/\/\<reference\s*path=('|").*('|")\s*\/>/g,
                `///<reference path="../types/core.d.ts" />`
            );
            await fs.writeFile('./dist/project/' + file, re, 'utf-8');
        }
    } catch (e) {
        console.log('修改类型标注失败');
        console.log(e);
    }

    // 7. tsconfig.json
    try {
        const content = `{
    "compilerOptions": {
        "lib": ["ESNext", "DOM", "DOM.Iterable"]
    },
    "include": ["index.d.ts", "types/**/d.ts"]
}`;
        await fs.writeFile('./dist/tsconfig.json', content, 'utf-8');
    } catch (e) {
        console.log('添加tsconfig.json失败');
        console.log(e);
    }

    // 8. 文档
    try {
        await fs.move('./docs/.vitepress/dist', './dist/_docs');
    } catch (e) {
        console.log('移动文档失败');
        console.log(e);
    }

    // 9. 启动服务
    try {
        await fs.copy('./script/template/启动服务.exe', './dist/启动服务.exe');
    } catch (e) {
        console.log('移动启动服务失败');
        console.log(e);
    }

    // 10. 压缩
    if (compress) {
        try {
            await fs.ensureDir('./out');
            await compressing.zip.compressDir('./dist', './out/dist.zip');

            // 压缩资源
            if (resorce) {
                const resources = await fs.readdir('./dist-resource');
                for await (const index of resources) {
                    await compressing.zip.compressDir(
                        `./dist-resource/${index}`,
                        `./out/${index}.zip`
                    );
                }
            }
        } catch (e) {
            console.log('压缩为zip失败！');
            console.log(e);
        }
    }
})();
