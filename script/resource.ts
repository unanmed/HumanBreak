import fs, { Stats } from 'fs-extra';
import JSZip from 'jszip';
import { formatSize, uniqueSymbol } from './utils.js';

// 资源拆分模块，可以加快在线加载速度

type ResourceType =
    | 'text'
    | 'buffer'
    | 'image'
    | 'material'
    | 'audio'
    | 'json'
    | 'zip';
interface CompressedLoadListItem {
    type: ResourceType;
    name: string;
    usage: string;
}
type CompressedLoadList = Record<string, CompressedLoadListItem[]>;

interface MainData {
    main: {
        images: string[];
        tilesets: string[];
        animates: string[];
        sounds: string[];
        fonts: string[];
    };
}

/** 单包大小，2M */
const SPLIT_SIZE = 2 ** 20 * 2;

export async function splitResource() {
    const splitResult: CompressedLoadList = {};
    let now: CompressedLoadListItem[] = [];
    let totalSize: number = 0;
    let nowZip: JSZip = new JSZip();

    await fs.ensureDir('./dist/resource/');
    await fs.emptyDir('./dist/resource');

    const pushItem = async (
        type: ResourceType,
        name: string,
        usage: string,
        file: Stats,
        content: any
    ) => {
        totalSize += file.size;

        if (totalSize > SPLIT_SIZE) {
            if (file.size > SPLIT_SIZE) {
                const symbol = uniqueSymbol() + `.h5data`;
                console.warn(
                    `file ${type}/${name}(${formatSize(
                        file.size
                    )}) is larger than split limit (${formatSize(
                        SPLIT_SIZE
                    )}), single zip will be generated.`
                );
                splitResult['resource/' + symbol] = [{ type, name, usage }];
                const zip = new JSZip();
                addZippedFile(zip, type, name, content);
                await writeZip(zip, `./dist/resource/${symbol}`, file.size);
                totalSize -= file.size;
                return;
            } else {
                const symbol = uniqueSymbol() + `.h5data`;
                splitResult['resource/' + symbol] = now;
                await writeZip(
                    nowZip,
                    `./dist/resource/${symbol}`,
                    totalSize - file.size
                );
                nowZip = new JSZip();
                totalSize = 0;
                now = [];
                await pushItem(type, name, usage, file, content);
            }
        } else {
            now.push({ type, name, usage });
            addZippedFile(nowZip, type, name, content);
        }
    };

    const writeZip = (zip: JSZip, name: string, size: number) => {
        return new Promise<void>(res => {
            zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
                .pipe(fs.createWriteStream(name))
                .once('finish', function () {
                    console.log(
                        `Generated ${name}. Unzipped size: ${formatSize(size)}`
                    );
                    res();
                });
        });
    };

    const addZippedFile = (
        zip: JSZip,
        type: ResourceType,
        name: string,
        content: any
    ) => {
        zip.file(`${type}/${name}`, content);
    };

    const file = await fs.readFile('./dist/project/data.js', 'utf-8');
    const data = JSON.parse(file.split('\n').slice(1).join('')) as MainData;

    // images
    for (const image of data.main.images) {
        const path = `./dist/project/images/${image}`;
        const stat = await fs.stat(path);
        await pushItem('image', image, 'image', stat, await fs.readFile(path));
    }

    // tileset
    for (const tileset of data.main.tilesets) {
        const path = `./dist/project/tilesets/${tileset}`;
        const stat = await fs.stat(path);
        await pushItem(
            'image',
            tileset,
            'tileset',
            stat,
            await fs.readFile(path)
        );
    }

    // animates
    for (const ani of data.main.animates) {
        const path = `./dist/project/animates/${ani}.animate`;
        const stat = await fs.stat(path);
        await pushItem(
            'text',
            ani + '.animate',
            'animate',
            stat,
            await fs.readFile(path, 'utf-8')
        );
    }

    // sounds
    for (const sound of data.main.sounds) {
        const path = `./dist/project/sounds/${sound}`;
        const stat = await fs.stat(path);
        await pushItem('audio', sound, 'sound', stat, await fs.readFile(path));
    }

    // fonts
    for (const font of data.main.fonts) {
        const path = `./dist/project/fonts/${font}.ttf`;
        const stat = await fs.stat(path);
        await pushItem(
            'buffer',
            font + '.ttf',
            'font',
            stat,
            await fs.readFile(path)
        );
    }

    // autotiles
    const autotiles = await fs.readdir('./dist/project/autotiles');
    for (const a of autotiles) {
        const path = `./dist/project/autotiles/${a}`;
        const stat = await fs.stat(path);
        await pushItem('image', a, 'autotile', stat, await fs.readFile(path));
    }

    // materials
    const materials = await fs.readdir('./dist/project/materials');
    for (const m of materials) {
        const path = `./dist/project/materials/${m}`;
        const stat = await fs.stat(path);
        await pushItem(
            'material',
            m,
            'material',
            stat,
            await fs.readFile(path)
        );
    }

    const symbol = uniqueSymbol() + `.h5data`;
    splitResult['resource/' + symbol] = now;
    await writeZip(nowZip, `./dist/resource/${symbol}`, totalSize);

    // 添加资源映射
    await fs.writeFile(
        './dist/loadList.json',
        JSON.stringify(splitResult),
        'utf-8'
    );

    // 删除原资源
    await fs.emptyDir('./dist/project/images');
    await fs.emptyDir('./dist/project/tilesets');
    await fs.emptyDir('./dist/project/animates');
    await fs.emptyDir('./dist/project/fonts');
    await fs.emptyDir('./dist/project/materials');
    await fs.emptyDir('./dist/project/sounds');
    await fs.emptyDir('./dist/project/autotiles');
    // 然后加入填充内容
    await fs.copy(
        './script/template/.h5data',
        './dist/project/images/images.h5data'
    );
    await fs.copy(
        './script/template/.h5data',
        './dist/project/tilesets/tilesets.h5data'
    );
    await fs.copy(
        './script/template/.h5data',
        './dist/project/animates/animates.h5data'
    );
    await fs.copy(
        './script/template/.h5data',
        './dist/project/fonts/fonts.h5data'
    );
    await fs.copy(
        './script/template/.h5data',
        './dist/project/materials/materials.h5data'
    );
    await fs.copy(
        './script/template/.h5data',
        './dist/project/sounds/sounds.h5data'
    );
    await fs.copy(
        './script/template/.h5data',
        './dist/project/autotiles/autotiles.h5data'
    );
}
