import JSZip from 'jszip';
import {
    RequiredData,
    RequiredIconsData,
    ResourceType,
    ResourceUsage
} from './types';
import { Stats } from 'fs';
import { readdir, readFile, stat } from 'fs/promises';
import { resolve } from 'path';
import { fileHash } from './utils';

export interface ResourceInfo {
    name: string;
    type: ResourceType;
    usage: ResourceUsage;
    stats: Stats;
}

export interface SplittedResource {
    readonly byteLength: number;
    readonly resource: JSZip;
    readonly buffer: Uint8Array;
    readonly fileName: string;
    readonly content: Readonly<ResourceInfo>[];
}

interface ResourceContent extends ResourceInfo {
    content: string | Buffer | Uint8Array;
    exceed: boolean;
}

interface ResourcePath {
    name: string;
    path: string;
    usage: ResourceUsage;
}

function getTypeByUsage(usage: ResourceUsage): ResourceType {
    switch (usage) {
        case 'animate':
            return 'text';
        case 'autotile':
        case 'image':
        case 'tileset':
            return 'image';
        case 'sound':
            return 'byte';
        case 'font':
            return 'buffer';
        case 'material':
            return 'material';
    }
}

function readFileOfType(path: string, type: ResourceType) {
    if (type === 'text') {
        return readFile(path, 'utf-8');
    } else {
        return readFile(path);
    }
}

async function compressFiles(files: ResourceContent[]) {
    const zip = new JSZip();
    files.forEach(v => {
        const dir = `${v.type}/${v.name}`;
        zip.file(dir, v.content);
    });
    const buffer = await zip.generateAsync({
        type: 'uint8array',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        }
    });

    const hash = fileHash(buffer);
    const name = `resource.${hash}.h5data`;

    const resource: SplittedResource = {
        byteLength: buffer.byteLength,
        buffer: buffer,
        resource: zip,
        fileName: name,
        content: files
    };

    return resource;
}

export async function splitResource(
    data: RequiredData,
    icons: RequiredIconsData,
    base: string,
    fontsDir: string,
    limit: number
) {
    const result: SplittedResource[] = [];

    // 获取所有需要分块的资源
    const { animates, fonts, images, sounds, tilesets } = data.main;
    const autotiles = Object.keys(icons.autotile);
    const materials = await readdir(resolve(base, 'project/materials'));

    const paths: ResourcePath[] = [
        ...animates.map<ResourcePath>(v => ({
            name: `${v}.animate`,
            path: resolve(base, 'project/animates', `${v}.animate`),
            usage: 'animate'
        })),
        ...fonts.map<ResourcePath>(v => ({
            name: `${v}.ttf`,
            path: resolve(fontsDir, `${v}.ttf`),
            usage: 'font'
        })),
        ...images.map<ResourcePath>(v => ({
            name: v,
            path: resolve(base, 'project/images', v),
            usage: 'image'
        })),
        ...sounds.map<ResourcePath>(v => ({
            name: v,
            path: resolve(base, 'project/sounds', v),
            usage: 'sound'
        })),
        ...tilesets.map<ResourcePath>(v => ({
            name: v,
            path: resolve(base, 'project/tilesets', v),
            usage: 'tileset'
        })),
        ...autotiles.map<ResourcePath>(v => ({
            name: `${v}.png`,
            path: resolve(base, 'project/autotiles', `${v}.png`),
            usage: 'autotile'
        })),
        ...materials.map<ResourcePath>(v => ({
            name: v,
            path: resolve(base, 'project/materials', v),
            usage: 'material'
        }))
    ];

    const files = await Promise.all(
        paths.map(async ({ path, usage, name }) => {
            const stats = await stat(path);
            if (!stats.isFile()) {
                return Promise.reject(
                    new ReferenceError(
                        `Expected resource is a file, but get directory.`
                    )
                );
            }
            const type = getTypeByUsage(usage);
            const content = await readFileOfType(path, type);
            const info: ResourceContent = {
                type,
                name,
                usage,
                stats,
                content,
                exceed: stats.size > limit
            };
            return info;
        })
    );

    // 从小到大排序，这样的话可以尽量减小资源分块文件数量
    files.sort((a, b) => a.stats.size - b.stats.size);

    let index = 0;
    while (index < files.length) {
        let total = 0;
        const start = index;
        let i = index;
        for (; i < files.length; i++) {
            const file = files[i];
            if (file.exceed) {
                if (i === index) i = index + 1;
                break;
            } else {
                total += file.stats.size;
            }
            if (total > limit) {
                break;
            }
        }
        index = i;
        const toZip = files.slice(start, index);
        result.push(await compressFiles(toZip));
    }

    return result;
}
