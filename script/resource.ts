import fs from 'fs-extra';
import { uniqueSymbol } from './utils.js';
import { extname, resolve } from 'path';

type ResorceType =
    | 'bgms'
    | 'sounds'
    | 'autotiles'
    | 'images'
    | 'materials'
    | 'tilesets'
    | 'animates'
    | 'fonts';

const compress: ResorceType[] = [
    'sounds',
    'animates',
    'autotiles',
    'images',
    'materials',
    'tilesets'
];

const SYMBOL = uniqueSymbol();
const MAX_SIZE = 100 * (1 << 20);
const baseDir = './dist';

let totalSize = 0;

type Stats = fs.Stats & { name?: string };

export async function splitResorce(compress: boolean = false) {
    const folder = await fs.stat('./dist');
    totalSize = folder.size;
    // if (totalSize < MAX_SIZE) return;

    await fs.ensureDir('./dist-resource');
    await doSplit(compress);
}

async function sortDir(dir: string, ext?: string[]) {
    const path = await fs.readdir(dir);
    const stats: Stats[] = [];

    for await (const one of path) {
        if (ext && !ext.includes(extname(one))) continue;
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
    const split = async (index: number): Promise<void> => {
        size -= currSize;
        currSize = 0;

        const cut: string[] = [];

        (() => {
            const mapped: ResorceType[] = [];
            while (1) {
                const toCut = priority.find(
                    v => dirInfo[v].length > 0 && !mapped.includes(v)
                );
                if (!toCut) return;

                mapped.push(toCut);

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
                    cut.push(`${toCut}/${stat.name}`);
                    stats.splice(pass, 1);
                    currSize += stat.size;
                }
            }
        })();

        const dir = `./dist-resource/${index}`;
        await fs.ensureDir(dir);
        await Promise.all(priority.map(v => fs.ensureDir(resolve(dir, v))));

        await Promise.all(
            cut.map(v =>
                fs.move(
                    resolve('./dist/project', v),
                    resolve(dir, `${v}-${SYMBOL}`)
                )
            )
        );

        if (Object.values(dirInfo).every(v => v.length === 0)) return;
        else return split(index + 1);
    };

    await split(0);
}
