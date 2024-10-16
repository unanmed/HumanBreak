import fs from 'fs-extra';
import { uniqueSymbol } from './utils.js';
import { basename, extname, resolve } from 'path';
import { dirname } from 'path';
import motaConfig from '../mota.config.js';

type ResorceType =
    | 'bgms'
    | 'sounds'
    | 'autotiles'
    | 'images'
    | 'materials'
    | 'tilesets'
    | 'animates'
    | 'fonts';

const SYMBOL = uniqueSymbol();
const MAX_SIZE = 100 * (1 << 20) - 20 * (1 << 10);
const baseDir = './dist';

let totalSize = 0;

type Stats = fs.Stats & { name?: string };

export async function splitResorce(compress: boolean = false) {
    const folder = await fs.stat('./dist');
    totalSize = folder.size;
    if (totalSize < MAX_SIZE) return;

    await fs.ensureDir('./dist-resource');
    await doSplit(compress);
}

async function sortDir(dir: string, ext?: string[]) {
    const path = await fs.readdir(dir);
    const stats: Stats[] = [];

    for await (const one of path) {
        if (ext && !ext.includes(extname(one))) continue;
        if (one === 'bg.jpg') continue;
        const stat = await fs.stat(resolve(dir, one));
        if (!stat.isFile()) continue;
        const status: Stats = {
            ...stat,
            name: one
        };
        stats.push(status);
    }

    return stats.sort((a, b) => b.size - a.size);
}

async function calResourceSize() {
    return (
        await Promise.all(
            [
                'animates',
                'autotiles',
                'bgms',
                'fonts',
                'images',
                'materials',
                'sounds',
                'tilesets'
            ].map(v => fs.stat(resolve('./dist/project/', v)))
        )
    ).reduce((pre, cur) => pre + cur.size, 0);
}

async function doSplit(compress: boolean) {
    let size = await calResourceSize();
    await fs.emptyDir('./dist-resource');
    const priority: ResorceType[] = [
        'materials',
        'tilesets',
        'autotiles',
        'animates',
        'images',
        'sounds',
        'fonts',
        'bgms'
    ];
    const dirInfo: Record<ResorceType, Stats[]> = Object.fromEntries(
        await Promise.all(
            priority.map(async v => [
                v,
                await sortDir(resolve(baseDir, 'project', v))
            ])
        )
    );

    let currSize = 0;
    const length = Object.fromEntries(
        priority.map(v => [v, dirInfo[v].length])
    );
    const soruceIndex: Record<string, number> = {};
    const split = async (index: number): Promise<void> => {
        size -= currSize;
        currSize = 0;

        const cut: string[] = [];

        const mapped: ResorceType[] = [];
        while (1) {
            const toCut = priority.find(
                v => dirInfo[v].length > 0 && !mapped.includes(v)
            );
            if (!toCut) break;

            mapped.push(toCut);
            const l = dirInfo[toCut].length;
            const data: string[] = [];

            let pass = 0;
            while (1) {
                const stats = dirInfo[toCut];
                const stat = stats[pass];
                if (!stat) {
                    break;
                }
                if (currSize + stat.size >= MAX_SIZE) {
                    pass++;
                    continue;
                }
                data.push(`${toCut}/${stat.name}`);
                stats.splice(pass, 1);
                currSize += stat.size;
            }

            if (l === length[toCut] && dirInfo[toCut].length === 0) {
                soruceIndex[`${toCut}.*`] = index;
            } else {
                data.map(v => (soruceIndex[v] = index));
            }
            cut.push(...data);
        }

        const dir = `./dist-resource/${index}`;
        await fs.ensureDir(dir);
        await Promise.all(priority.map(v => fs.ensureDir(resolve(dir, v))));

        await Promise.all(
            cut.map(v =>
                fs.move(
                    resolve('./dist/project', v),
                    resolve(
                        dir,
                        dirname(v),
                        `${basename(v).split('.')[0]}-${SYMBOL}${extname(v)}`
                    )
                )
            )
        );

        // 生成可发布结构
        await generatePublishStructure(dir, index);

        if (Object.values(dirInfo).every(v => v.length === 0)) return;
        else return split(index + 1);
    };

    await split(0);

    await rewriteMain(soruceIndex);
}

async function rewriteMain(sourceIndex: Record<string, number>) {
    const main = await fs.readFile('./dist/main.js', 'utf-8');
    const res = main
        .replace(/this\.USE_RESOURCE\s*\=\s*false/, 'this.USE_RESOURCE = true')
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

async function generatePublishStructure(dir: string, index: number) {
    await fs.mkdir(resolve(dir, 'libs'));
    await fs.mkdir(resolve(dir, 'libs/thirdparty'));
    await fs.mkdir(resolve(dir, 'project'));
    await Promise.all(
        [
            'autotiles',
            'images',
            'materials',
            'animates',
            'fonts',
            'floors',
            'tilesets',
            'sounds',
            'bgms'
        ].map(v => fs.mkdir(resolve(dir, 'project', v)))
    );

    await fs.writeFile(
        resolve(dir, 'project/icons.js'),
        `var icons_4665ee12_3a1f_44a4_bea3_0fccba634dc1 = 
{
    "autotile": {

    }
}`,
        'utf-8'
    );
    await fs.writeFile(
        resolve(dir, 'project/floors/none.js'),
        '"none"',
        'utf-8'
    );
    await fs.writeFile(resolve(dir, 'libs/none.js'), '"none"', 'utf-8');

    await fs.copyFile(
        './script/template/main.js',
        resolve(dir, 'project/main.js')
    );
    const data = await fs.readFile('./script/template/data.js', 'utf-8');
    await fs.writeFile(
        resolve(dir, 'project/data.js'),
        data.replace('@name', `${motaConfig.resourceName}${index}`)
    );

    await fs.copyFile(
        './script/template/lz-string.min.js',
        resolve(dir, 'libs/thirdparty/lz-string.min.js')
    );

    await Promise.all(
        ['animates', 'images', 'materials', 'sounds', 'tilesets'].map(v => {
            fs.copyFile(
                './script/template/.h5data',
                resolve(dir, `project/${v}/${v}.h5data`)
            );
        })
    );
}
