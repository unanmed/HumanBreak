import { build, loadConfigFromFile, mergeConfig, UserConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';
import { copy, emptyDir, ensureDir } from 'fs-extra';
import { OutputAsset, OutputChunk, RollupOutput } from 'rollup';
import Fontmin from 'fontmin';
import { readdir, readFile, rmdir, stat, writeFile } from 'fs/promises';
import { transformAsync } from '@babel/core';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { zip } from 'compressing';
import { RequiredData, RequiredIconsData, ResourceType } from './types';
import { splitResource, SplittedResource } from './build-resource';
import { formatSize } from './utils';

// 资源分离步骤的单包大小，默认 2M，可以自行调整
const RESOUCE_SIZE = 2 * 2 ** 20;

const distDir = resolve(process.cwd(), 'dist');
const tempDir = resolve(process.cwd(), '_temp');

/**
 * 构建游戏代码
 * @param entry 入口文件
 */
async function buildClient(outDir: string) {
    const configFile = resolve(process.cwd(), 'vite.config.ts');
    const config = await loadConfigFromFile(
        { command: 'build', mode: 'production' },
        configFile
    );
    const resolved = mergeConfig(config?.config ?? {}, {
        plugins: [
            legacy({
                targets: [
                    'Chrome >= 56',
                    'Firefox >= 51',
                    'Edge >= 79',
                    'Safari >= 15',
                    'Opera >= 43'
                ],
                polyfills: true,
                modernPolyfills: true,
                renderModernChunks: false
            })
        ],
        build: {
            outDir,
            copyPublicDir: true,
            rollupOptions: {
                external: ['@wasm-audio-decoders/opus-ml'],
                output: {
                    format: 'es',
                    entryFileNames: '[name].[hash].js',
                    chunkFileNames: 'chunks/[name].[hash].js',
                    assetFileNames: 'assets/[name].[hash][extname]',
                    manualChunks: {
                        antdv: ['ant-design-vue', '@ant-design/icons-vue'],
                        common: [
                            'lodash-es',
                            'axios',
                            'lz-string',
                            'chart.js',
                            'mutate-animate',
                            'eventemitter3',
                            'gl-matrix',
                            'jszip',
                            'anon-tokyo',
                            'vue'
                        ],
                        audio: [
                            'codec-parser',
                            'opus-decoder',
                            'ogg-opus-decoder',
                            '@wasm-audio-decoders/ogg-vorbis'
                        ]
                    }
                }
            }
        }
    } satisfies UserConfig);

    return build({
        ...resolved,
        configFile: false
    });
}

async function buildData(outDir: string, entry: string) {
    const configFile = resolve(process.cwd(), 'vite.config.ts');
    const config = await loadConfigFromFile(
        { command: 'build', mode: 'production' },
        configFile
    );
    const resolved = mergeConfig(config?.config ?? {}, {
        build: {
            outDir,
            copyPublicDir: false,
            lib: {
                entry,
                name: 'ProcessData',
                fileName: 'data',
                formats: ['iife']
            }
        }
    } satisfies UserConfig);

    return build({
        ...resolved,
        configFile: false
    });
}

const enum ProgressStatus {
    Success,
    Fail,
    Working,
    Warn
}

/**
 * 输出构建步骤
 * @param step 步骤数
 * @param final 最后一步的状态
 */
function logProgress(step: number, final: ProgressStatus) {
    const list = [
        `1. 构建前准备`,
        `2. 构建客户端代码`,
        `3. 构建数据端代码`,
        `4. 压缩 main.js`,
        `5. 压缩字体`,
        `6. 资源分块`,
        `7. 最后处理`,
        `8. 压缩为 zip`
    ];

    const str = list.reduce((prev, curr, idx) => {
        if (idx > step) {
            return prev;
        } else if (idx === step) {
            switch (final) {
                case ProgressStatus.Fail:
                    return prev + `❌ ${curr}\n错误信息：\n`;
                case ProgressStatus.Success:
                    return prev + `✅ ${curr}\n`;
                case ProgressStatus.Working:
                    return prev + `🔄 ${curr}\n`;
                case ProgressStatus.Warn:
                    return prev + `⚠️  ${curr}\n`;
            }
        } else {
            return prev + `✅ ${curr}\n`;
        }
    }, '');

    console.clear();
    console.log(str);
}

/**
 * 获取规范化文件名
 * @param output Rollup 输出
 * @param client 是否是客户端代码
 */
function getFileName(output: OutputChunk | OutputAsset, client: boolean) {
    const name = output.fileName;
    if (name.startsWith('index-legacy') && client) {
        return 'main';
    }
    if (name.startsWith('data') && !client) {
        return 'main';
    }
    if (name.startsWith('index.html') && client) {
        return 'index';
    }
    const index = name.indexOf('-legacy');
    const unhash = name.slice(0, index);
    return unhash;
}

/**
 * 获取文件大小
 * @param output Rollup 输出
 */
function getFileSize(output: OutputChunk | OutputAsset) {
    if (output.type === 'asset') {
        if (typeof output.source === 'string') {
            return Buffer.byteLength(output.source);
        } else {
            return output.source.byteLength;
        }
    } else {
        return Buffer.byteLength(output.code);
    }
}

const enum ClientDataLevel {
    Error,
    Suspect,
    Pass
}

/**
 * 检查客户端与数据端文件大小，并给出数据端引用客户端的可能性
 * @param client 客户端文件大小
 * @param data 数据端文件大小
 */
function checkClientData(
    client: Map<string, number>,
    data: Map<string, number>
) {
    let error = false;
    let warn = false;

    const clientMain = client.get('main');
    const dataMain = data.get('main');

    if (clientMain && dataMain) {
        if (clientMain <= dataMain) {
            error = true;
        } else if (clientMain / 2 < dataMain) {
            warn = true;
        }
    }

    let clientTotal = 0;
    let dataTotal = 0;

    client.forEach(v => {
        clientTotal += v;
    });

    data.forEach(v => {
        dataTotal += v;
    });

    if (clientTotal <= dataTotal) {
        error = true;
    }

    if (clientTotal / 4 < dataTotal) {
        warn = true;
    }

    if (error) return ClientDataLevel.Error;
    else if (warn) return ClientDataLevel.Suspect;
    else return ClientDataLevel.Pass;
}

async function getAllChars(client: RollupOutput[]) {
    const chars = new Set<string>();

    // 1. 客户端构建结果
    client.forEach(v => {
        v.output.forEach(v => {
            if (v.type === 'chunk' && v.fileName.startsWith('index')) {
                const set = new Set(v.code);
                set.forEach(v => chars.add(v));
            }
        });
    });

    // 2. 样板内容
    const files: string[] = [];

    files.push(resolve(tempDir, 'client/main.js'));
    files.push(resolve(tempDir, 'client/project/data.js'));
    files.push(resolve(tempDir, 'client/project/enemys.js'));
    files.push(resolve(tempDir, 'client/project/events.js'));
    files.push(resolve(tempDir, 'client/project/functions.js'));
    files.push(resolve(tempDir, 'client/project/icons.js'));
    files.push(resolve(tempDir, 'client/project/items.js'));
    files.push(resolve(tempDir, 'client/project/maps.js'));

    const floors = await readdir(resolve(tempDir, 'client/project/floors'));
    const ids = floors.map(v => resolve(tempDir, 'client/project/floors', v));
    files.push(...ids);

    const libs = await readdir(resolve(tempDir, 'client/libs'));
    files.push(...libs.map(v => resolve(tempDir, 'client/libs', v)));

    await Promise.all(
        files.map(async v => {
            const stats = await stat(v);
            if (!stats.isFile()) return;
            const file = await readFile(v, 'utf-8');
            const set = new Set(file);
            set.forEach(v => chars.add(v));
        })
    );

    return chars;
}

interface CompressedLoadListItem {
    type: ResourceType;
    name: string;
    usage: string;
}

type CompressedLoadList = Record<string, CompressedLoadListItem[]>;

/**
 * 生成资源地图 json 文件
 */
function generateResourceJSON(resources: SplittedResource[]) {
    const list: CompressedLoadList = {};

    resources.forEach(file => {
        const uri = `project/resource/${file.fileName}`;
        file.content.forEach(content => {
            const item: CompressedLoadListItem = {
                type: content.type,
                name: content.name,
                usage: content.usage
            };
            list[uri] ??= [];
            list[uri].push(item);
        });
    });

    return JSON.stringify(list);
}

async function buildGame() {
    logProgress(0, ProgressStatus.Working);

    //#region 准备步骤
    try {
        await ensureDir(distDir);
        await ensureDir(tempDir);
        await emptyDir(distDir);
        await emptyDir(tempDir);
        await ensureDir(resolve(tempDir, 'fonts'));
        await ensureDir(resolve(tempDir, 'common'));
        await ensureDir(resolve(tempDir, 'resource'));
    } catch (e) {
        logProgress(0, ProgressStatus.Fail);
        console.error(e);
        process.exit(1);
    }

    logProgress(1, ProgressStatus.Working);

    //#region 构建客户端
    const clientPack = await buildClient(resolve(tempDir, 'client')).catch(
        reason => {
            logProgress(1, ProgressStatus.Fail);
            console.error(reason);
            process.exit(1);
        }
    );

    logProgress(2, ProgressStatus.Working);

    //#region 构建数据端
    const dataPack = await buildData(
        resolve(tempDir, 'data'),
        resolve(process.cwd(), 'src/data.ts')
    ).catch(reason => {
        logProgress(2, ProgressStatus.Fail);
        console.error(reason);
        process.exit(1);
    });

    const clientSize = new Map<string, number>();
    const dataSize = new Map<string, number>();

    const clientPackArr = [];
    const dataPackArr = [];

    // 判断客户端与数据端的构建包大小，从而推断是否出现了数据端引用客户端的问题

    if (clientPack instanceof Array) {
        clientPackArr.push(...clientPack);
    } else if ('close' in clientPack) {
        // pass.
    } else {
        clientPackArr.push(clientPack);
    }
    if (dataPack instanceof Array) {
        dataPackArr.push(...dataPack);
    } else if ('close' in dataPack) {
        // pass.
    } else {
        dataPackArr.push(dataPack);
    }

    // 获取每个 chunk 的大小
    clientPackArr.forEach(v => {
        v.output.forEach(v => {
            const name = getFileName(v, true);
            const size = getFileSize(v);
            clientSize.set(name, size);
        });
    });
    dataPackArr.forEach(v => {
        v.output.forEach(v => {
            const name = getFileName(v, false);
            const size = getFileSize(v);
            dataSize.set(name, size);
        });
    });

    const level = checkClientData(clientSize, dataSize);

    if (level === ClientDataLevel.Error) {
        logProgress(2, ProgressStatus.Fail);
        console.error(`客户端似乎引用了数据端内容，请仔细检查后再构建！`);
        process.exit(1);
    }

    // 解析全塔属性
    const dataFile = await readFile(
        resolve(process.cwd(), 'public/project/data.js'),
        'utf-8'
    );
    const dataObject: RequiredData = JSON.parse(
        dataFile.split('\n').slice(1).join('\n')
    );
    const mainData = dataObject.main;

    logProgress(3, ProgressStatus.Working);

    //#region 压缩 main
    try {
        const main = await readFile(
            resolve(tempDir, 'client/main.js'),
            'utf-8'
        );
        const [head, tail] = main.split('// >>>> body end');
        const transformed = await transformAsync(tail, {
            presets: [['@babel/preset-env']],
            sourceType: 'script',
            minified: true,
            comments: false
        });
        if (!transformed || !transformed.code) {
            throw new ReferenceError(
                `Cannot write main.js since transform result is empty.`
            );
        }
        const code = transformed.code;
        await writeFile(
            resolve(tempDir, 'common/main.js'),
            head + '\n// >>>> body end\n' + code,
            'utf-8'
        );
    } catch (e) {
        logProgress(3, ProgressStatus.Fail);
        console.error(e);
        process.exit(1);
    }

    //#region 压缩字体
    const chars = await getAllChars(clientPackArr).catch(reason => {
        logProgress(4, ProgressStatus.Fail);
        console.error(reason);
        process.exit(1);
    });
    const { fonts } = mainData;

    await Promise.all(
        fonts.map(v => {
            const fontmin = new Fontmin();
            const src = resolve(tempDir, 'client/project/fonts', `${v}.ttf`);
            const dest = resolve(tempDir, 'fonts');
            const plugin = Fontmin.glyph({
                text: [...chars].join('')
            });
            fontmin.src(src).dest(dest).use(plugin);
            return fontmin.runAsync();
        })
    ).catch(reason => {
        logProgress(4, ProgressStatus.Fail);
        console.error(reason);
        process.exit(1);
    });

    logProgress(5, ProgressStatus.Working);

    //#region 资源分块
    const iconsFile = await readFile(
        resolve(process.cwd(), 'public/project/icons.js'),
        'utf-8'
    );
    const iconsObject: RequiredIconsData = JSON.parse(
        iconsFile.split('\n').slice(1).join('\n')
    );
    const resources = await splitResource(
        dataObject,
        iconsObject,
        resolve(tempDir, 'client'),
        resolve(tempDir, 'fonts'),
        RESOUCE_SIZE
    ).catch(reason => {
        logProgress(5, ProgressStatus.Fail);
        console.error(reason);
        process.exit(1);
    });

    await Promise.all(
        resources.map(v => {
            return writeFile(
                resolve(tempDir, 'resource', v.fileName),
                v.buffer
            );
        })
    ).catch(reason => {
        logProgress(5, ProgressStatus.Fail);
        console.error(reason);
        process.exit(1);
    });

    logProgress(6, ProgressStatus.Working);

    //#region 最后处理

    const toCopy = [
        'libs',
        '_server',
        'extensions',
        'index.html',
        'editor.html',
        'styles.css',
        'logo.png',
        'project/floors',
        'project/data.js',
        'project/enemys.js',
        'project/events.js',
        'project/functions.js',
        'project/icons.js',
        'project/items.js',
        'project/maps.js',
        'project/plugins.js'
    ];

    clientPackArr.forEach(v => {
        v.output.forEach(v => {
            toCopy.push(v.fileName);
        });
    });

    try {
        await Promise.all(
            toCopy.map(v =>
                copy(resolve(tempDir, 'client', v), resolve(distDir, v))
            )
        );
        await copy(
            resolve(tempDir, 'resource'),
            resolve(distDir, 'project/resource')
        );
        await copy(
            resolve(tempDir, 'common/main.js'),
            resolve(distDir, 'main.js')
        );
        await copy(
            resolve(tempDir, 'data/data.iife.js'),
            resolve(distDir, 'data.process.js')
        );

        await Promise.all(
            dataObject.main.bgms.map(v =>
                copy(
                    resolve(tempDir, 'client/project/bgms', v),
                    resolve(distDir, 'project/bgms', v)
                )
            )
        );

        const scripts = archiver('zip');
        scripts.directory('packages/', resolve(process.cwd(), 'packages'));
        scripts.directory(
            'packages-user/',
            resolve(process.cwd(), 'packages-user')
        );
        scripts.directory('src/', resolve(process.cwd(), 'src'));

        const output = createWriteStream(resolve(distDir, 'source-code.zip'));
        scripts.pipe(output);

        output.on('error', err => {
            throw err;
        });

        await new Promise<void>(res => {
            output.on('finish', () => res());
            scripts.finalize();
        });

        const json = generateResourceJSON(resources);
        await writeFile(resolve(distDir, 'loadList.json'), json, 'utf-8');

        await copy(
            resolve(process.cwd(), 'LICENSE'),
            resolve(distDir, 'LICENSE')
        );

        await copy(
            resolve(process.cwd(), 'script/template/启动服务.exe'),
            resolve(distDir, '启动服务.exe')
        );
    } catch (e) {
        logProgress(6, ProgressStatus.Fail);
        console.error(e);
        process.exit(1);
    }

    logProgress(7, ProgressStatus.Working);

    //#region 压缩游戏

    try {
        await zip.compressDir(
            resolve(distDir),
            resolve(process.cwd(), 'dist.zip')
        );

        await emptyDir(tempDir);
        await rmdir(tempDir);
    } catch (e) {
        logProgress(7, ProgressStatus.Fail);
        console.error(e);
        process.exit(1);
    }

    //#region 输出构建信息

    const sourceStats = await stat(resolve(distDir, 'source-code.zip'));
    const sourceSize = sourceStats.size;
    const zipStats = await stat(resolve(process.cwd(), 'dist.zip'));
    const zipSize = zipStats.size;
    const resourceSize = resources.reduce(
        (prev, curr) => prev + curr.byteLength,
        0
    );

    console.clear();
    console.log(`✅ 构建已完成！`);
    if (zipSize > 100 * 2 ** 20) {
        console.log(
            `⚠️  压缩包大于 100M，可能导致发塔困难，请考虑降低塔的大小，`
        );
    }
    console.log(`压缩包大小：${formatSize(zipSize)}`);
    console.log(`源码大小：${formatSize(sourceSize)}`);
    console.log(`资源大小：${formatSize(resourceSize)}`);
    resources.forEach(v => {
        console.log(
            `--> ${v.fileName} ${formatSize(v.byteLength)} | ${v.content.length} 个资源`
        );
    });
}

// Execute
(() => {
    buildGame();
})();
