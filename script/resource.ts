import fs from 'fs-extra';
import { uniqueSymbol } from './utils.js';
import { resolve } from 'path';
import motaConfig from '../mota.config.js';
import compressing from 'compressing';

const SYMBOL = uniqueSymbol();
const MAX_SIZE = 100 * (1 << 20) - 20 * (1 << 10);
const sourceIndex: Record<string, string> = {};
const toMove: Stats[] = [];
const all = [
    'bgms',
    'sounds',
    'autotiles',
    'images',
    'materials',
    'tilesets',
    'animates',
    'fonts'
];

type Stats = fs.Stats & { name?: string };

export async function splitResorce(type: string) {
    await fs.ensureDir('./dist-resource');
    await fs.emptyDir('./dist-resource');
    await readySplit();

    await zipResource();
    await split(type === 'dist' ? MAX_SIZE : void 0);

    await endSplit(type);
}

async function readySplit() {
    await fs.ensureDir('./_temp');
    await fs.emptyDir('./_temp');
    await fs.ensureDir('./_temp/origin');
    await copyAll();
}

async function endSplit(type: string) {
    await rewriteMain(type);
    await fs.emptyDir('./_temp');
    await fs.rmdir('./_temp');
}

async function zipResource() {
    const zip = motaConfig.zip;
    if (!zip) return;
    for await (const [name, files] of Object.entries(zip)) {
        const stream = new compressing.zip.Stream();
        const dirs: string[] = [];

        for await (const file of files) {
            if (/^.+\/\*$/.test(file)) {
                const dir = file.split('/')[0];
                dirs.push(dir);
                await fs.copy(`./_temp/origin/${dir}`, `./_temp/${dir}`);
            } else {
                const [dir, name] = file.split('/');
                if (dirs.includes(dir)) dirs.push(dir);
                await fs.ensureDir(`./_temp/${dir}`);
                await fs.copyFile(
                    `./_temp/origin/${dir}/${name}`,
                    `./_temp/${dir}/${name}`
                );
            }
        }

        dirs.forEach(v => stream.addEntry(`./_temp/${v}`));
        const dest = fs.createWriteStream(`./_temp/${name}`);
        await new Promise<void>(res =>
            stream.pipe(dest).on('finish', () => {
                res();
            })
        );
        const stat = await fs.stat(`./_temp/${name}`);
        toMove.push({ ...stat, name: `./_temp/${name}` });
    }
}

async function getRemainReource() {
    const zip = motaConfig.zip;
    if (!zip) return;
    const values = Object.values(zip);
    for await (const one of all) {
        if (values.some(v => v.includes(`${one}/*`))) continue;
        const list = await fs.readdir(`./_temp/origin/${one}`);
        for await (const name of list) {
            if (!values.some(vv => vv.includes(`${one}/${name}`))) {
                const stat = await fs.stat(`./_temp/origin/${one}/${name}`);
                toMove.push({
                    ...stat,
                    name: `./_temp/origin/${one}/${name}`
                });
            }
        }
    }
    toMove.sort((a, b) => {
        if (a.name?.endsWith('.zip') && b.name?.endsWith('.zip')) {
            return b.size - a.size;
        }
        if (a.name?.endsWith('.zip')) return -1;
        if (b.name?.endsWith('.zip')) return 1;
        return b.size - a.size;
    });
}

async function split(max?: number) {
    await getRemainReource();

    const doSplit = async (index: string | number) => {
        const base =
            typeof index === 'string' ? index : `./dist-resource/${index}`;

        await fs.ensureDir(base);
        await generatePublishStructure(
            base,
            typeof index === 'string' ? 0 : index
        );

        let size = (await fs.stat(base)).size;
        // 计算出要移动多少资源
        const res = (() => {
            if (!max) return toMove.splice(0, toMove.length);
            let remain = max - size;
            for (let i = 0; i < toMove.length; i++) {
                const ele = toMove[i];
                remain -= ele.size;
                if (remain <= 0) {
                    return toMove.splice(0, i);
                }
            }
            return toMove.splice(0, toMove.length);
        })();

        if (base.endsWith('dist')) {
            await fs.ensureDir(resolve(base, 'resource'));
        }

        // 执行移动
        await Promise.all(
            res.map(async v => {
                if (!v.name) return;
                // 压缩包
                if (v.name.endsWith('.zip')) {
                    const [, , name] = v.name.split('/');
                    const split = name.split('.');
                    const target = `${split
                        .slice(0, -1)
                        .join('.')}-${SYMBOL}.${split.at(-1)}`;
                    if (base.endsWith('dist')) {
                        await fs.ensureDir(resolve(base, 'resource/zip'));
                        return fs.copyFile(
                            v.name,
                            resolve(base, 'resource', 'zip', target)
                        );
                    } else {
                        await fs.ensureDir(resolve(base, 'zip'));
                        return fs.copyFile(
                            v.name,
                            resolve(base, 'zip', target)
                        );
                    }
                }

                // 非压缩包
                if (!v.name.endsWith('.zip')) {
                    const [, , , type, name] = v.name.split('/');
                    const split = name.split('.');
                    const target = `${split
                        .slice(0, -1)
                        .join('.')}-${SYMBOL}.${split.at(-1)}`;
                    if (base.endsWith('dist')) {
                        await fs.ensureDir(resolve(base, 'resource', type));
                    } else {
                        await fs.ensureDir(resolve(base, type));
                    }
                    if (base.endsWith('dist')) {
                        return fs.copyFile(
                            v.name,
                            resolve(base, 'resource', type, target)
                        );
                    } else {
                        return fs.copyFile(v.name, resolve(base, type, target));
                    }
                }
            })
        );

        // 标记资源索引
        res.forEach(v => {
            if (!v.name) return;
            // 压缩包
            if (v.name.endsWith('.zip')) {
                const [, , name] = v.name.split('/');
                sourceIndex[`zip.${name}`] = index.toString();
            }
            // 非压缩包
            if (!v.name.endsWith('.zip')) {
                const [, , , type, name] = v.name.split('/');
                sourceIndex[`${type}.${name}`] = index.toString();
            }
        });

        if (toMove.length > 0) {
            await doSplit(typeof index === 'string' ? 0 : index + 1);
        }
    };
    await doSplit('dist');
}

async function copyAll() {
    await Promise.all(
        all.map(v => {
            return fs.move(`./dist/project/${v}`, `./_temp/origin/${v}`);
        })
    );
}

async function rewriteMain(type: string) {
    const main = await fs.readFile('./dist/main.js', 'utf-8');
    const res = main
        .replace(
            /this\.RESOURCE_TYPE\s*\=\s*.*;/,
            `this.RESOURCE_TYPE = '${type}';`
        )
        .replace(
            /this\.RESOURCE_URL\s*\=\s*'.*'/,
            `this.RESOURCE_URL = '/games/${motaConfig.resourceName}'`
        )
        .replace(
            /this\.RESOURCE_SYMBOL\s*\=\s*'.*'/,
            `this.RESOURCE_SYMBOL = '${SYMBOL}'`
        )
        .replace(
            /this\.RESOURCE_INDEX\s*\=\s*\{.*\}/,
            `this.RESOURCE_INDEX = ${JSON.stringify(sourceIndex, void 0, 8)}`
        );
    await fs.writeFile('./dist/main.js', res, 'utf-8');
}

/**
 * 生成可发布目录
 */
async function generatePublishStructure(dir: string, index: number) {
    await fs.ensureDir(resolve(dir, 'libs'));
    await fs.ensureDir(resolve(dir, 'libs/thirdparty'));
    await fs.ensureDir(resolve(dir, 'project'));
    await Promise.all(
        all.map(v => {
            fs.ensureDir(resolve(dir, 'project', v));
            fs.emptyDir(resolve(dir, 'project', v));
        })
    );

    if (!dir.endsWith('dist')) {
        await fs.writeFile(
            resolve(dir, 'project/icons.js'),
            `var icons_4665ee12_3a1f_44a4_bea3_0fccba634dc1 = 
{"autotile": {}}
`,
            'utf-8'
        );
        await fs.writeFile(
            resolve(dir, 'project/floors/none.js'),
            '"none"',
            'utf-8'
        );
        await fs.writeFile(resolve(dir, 'libs/none.js'), '"none"', 'utf-8');

        await fs.copyFile('./script/template/main.js', resolve(dir, 'main.js'));
        const data = await fs.readFile('./script/template/data.js', 'utf-8');
        await fs.writeFile(
            resolve(dir, 'project/data.js'),
            data.replace('@name', `${motaConfig.resourceName}${index}`)
        );

        await fs.copyFile(
            './script/template/lz-string.min.js',
            resolve(dir, 'libs/thirdparty/lz-string.min.js')
        );
    }

    await Promise.all(
        ['animates', 'images', 'materials', 'sounds', 'tilesets'].map(v => {
            fs.copyFile(
                './script/template/.h5data',
                resolve(dir, `project/${v}/${v}.h5data`)
            );
        })
    );
}
