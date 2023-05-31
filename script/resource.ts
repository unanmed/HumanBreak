import fs from 'fs-extra';
import { uniqueSymbol } from './utils.js';
import { extname, resolve } from 'path';

type ResorceType =
    | 'bgm'
    | 'sound'
    | 'autotiles'
    | 'images'
    | 'materials'
    | 'tilesets'
    | 'animates'
    | 'fonts';

let resorceIndex = 0;
const compress: ResorceType[] = [
    'sound',
    'animates',
    'autotiles',
    'images',
    'materials',
    'tilesets'
];

const SYMBOL = uniqueSymbol();
const MAX_SIZE = 100 * (1 << 20);

let totalSize = 0;

export async function splitResorce(compress: boolean = false) {
    const folder = await fs.stat('./dist');
    totalSize = folder.size;
    if (totalSize < MAX_SIZE) return;

    await fs.ensureDir('./dist-resource');
    await doSplit(compress);
}

async function sortDir(dir: string, ext?: string[]) {
    const path = await fs.readdir(dir);
    const stats: fs.Stats[] = [];

    for await (const one of path) {
        if (ext && !ext.includes(extname(one))) continue;
        const stat = await fs.stat(resolve(dir, one));
        if (!stat.isFile()) continue;
        stats.push(stat);
    }

    return stats.sort((a, b) => b.size - a.size);
}

async function doSplit(compress: boolean) {}
