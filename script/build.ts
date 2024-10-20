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

const map = !!Number(process.argv[2]);
const resorce = !!Number(process.argv[3]);
const compress = !!Number(process.argv[4]);

(async function () {
    const timestamp = Date.now();
    // 1. 去除未使用的文件
    const data = (() => {
        const data = fss.readFileSync('./public/project/data.js', 'utf-8');
        const json = JSON.parse(
            data
                .split(/(\n|\r\n)/)
                .slice(1)
                .join('\n')
        );
        return json;
    })() as { main: Record<string, string[]> };
    const main = data.main;
    try {
        const data = [
            ['./dist/project/floors', '.js', 'floorIds'],
            ['./dist/project/bgms', '', 'bgms'],
            ['./dist/project/sounds', '', 'sounds'],
            ['./dist/project/images', '', 'images'],
            ['./dist/project/animates', '.animate', 'animates'],
            ['./dist/project/tilesets', '', 'tilesets'],
            ['./dist/project/fonts', '.ttf', 'fonts']
        ];
        await Promise.all(
            data.map(async v => {
                const all = await fs.readdir(`${v[0]}`);
                const data = main[v[2]].map(vv => vv + v[1]);
                all.forEach(async vv => {
                    if (!data.includes(vv)) {
                        await fs.rm(`${v[0]}/${vv}`);
                    }
                });
            })
        );
        if (!map) await fs.remove('./dist/maps/');
        // 在线查看什么都看不到，这编辑器难道还需要留着吗？
        await fs.remove('./dist/_server');
        await fs.remove('./dist/editor.html');
        await fs.remove('./dist/server.cjs');
    } catch {}

    // 2. 压缩字体
    try {
        // 获取要压缩的文字列表，libs & projects下的所有js文件
        let texts = ``;
        const exclude = `\n \t`;
        const libs = await fs.readdir('./public/libs');
        const project = await fs.readdir('./public/project');
        const floors = await fs.readdir('./public/project/floors');
        const assets = await fs.readdir('./dist/assets/');
        const all = [
            ...libs.map(v => `./public/libs/${v}`),
            ...project.map(v => `./public/project/${v}`),
            ...floors.map(v => `./public/project/floors/${v}`),
            ...assets.map(v => `./dist/assets/${v}`)
        ];
        for await (const dir of all) {
            const stat = await fs.stat(dir);
            if (!stat.isFile()) continue;
            if (dir.endsWith('.ttf')) continue;
            const file = await fs.readFile(dir, 'utf-8');
            for (let i = 0; i < file.length; i++) {
                const char = file[i];
                if (!texts.includes(char) && !exclude.includes(char))
                    texts += char;
            }
        }

        // 获取所有字体（直接压缩字体会报错
        const fonts = main.fonts;
        await Promise.all([
            ...fonts.map(v =>
                (async () => {
                    const fontmin = new Fontmin();
                    fontmin
                        .src<string>(`./public/project/fonts/${v}.ttf`)
                        .dest('./dist/project/fonts')
                        .use(
                            Fontmin.glyph({
                                text: texts
                            })
                        );
                    await new Promise(res => {
                        fontmin.run(err => {
                            if (err) throw err;
                            res('');
                        });
                    });
                })()
            )
        ]);
        await Promise.all([
            ...fonts.map(v => {
                return fs.rename(
                    `./dist/project/fonts/${v}.ttf`,
                    `./dist/project/fonts/${v}-${timestamp}.ttf`
                );
            })
        ]);
    } catch (e) {
        console.log('字体压缩失败');
    }

    // 3. 压缩js插件
    try {
        await fs.remove('./dist/project/plugin.min.js');

        const build = await rollup.rollup({
            input: 'src/plugin/game/index.js',
            plugins: [
                typescript({
                    sourceMap: false
                }),
                rollupBabel({
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
            file: './dist/project/plugin.min.js'
        });

        await fs.remove('./dist/project/plugin/');
    } catch (e) {
        console.log('压缩插件失败');
    }

    // 4. 压缩main.js
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
    } catch {
        console.log('main.js压缩失败');
    }

    // 5. 杂项
    try {
        await fs.copy('./LICENSE', './dist/LICENSE');
    } catch {}

    // 6. 资源分离
    if (resorce) {
        await splitResorce(compress);
    }

    // 7. 压缩
    if (compress) {
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
    }
})();
