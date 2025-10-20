/* eslint-disable no-console */
import {
    createServer,
    loadConfigFromFile,
    mergeConfig,
    UserConfig
} from 'vite';
import { Server } from 'http';
import { ensureDir, move, pathExists, remove } from 'fs-extra';
import { readFile, readdir, writeFile } from 'fs/promises';
import { resolve, basename, join } from 'path';
import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import EventEmitter from 'events';
import { WebSocket, WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import express, { Request, Response } from 'express';

const [, , vitePortStr = '5173', serverPortStr = '3000'] = process.argv;
const vitePort = parseInt(vitePortStr);
const serverPort = parseInt(serverPortStr);

const checkBase = resolve(process.cwd());
const base = resolve(process.cwd(), 'public');

const enum APIStatus {
    Success,
    PermissionDeny,
    WriteError,
    FileNotExist,
    ReadError
}

interface ResolveResult {
    safe: boolean;
    resolved: string;
}

interface RollupInfo {
    dir: string;
    file: string;
    bundled: RefValue<boolean>;
    watcher: rollup.RollupWatcher;
}
const rollupMap = new Map<string, RollupInfo>();
let bundleIndex = 0;
let ws: WebSocket;
let wt: chokidar.FSWatcher;

class RefValue<T> extends EventEmitter {
    private _value: T;
    public get value(): T {
        return this._value;
    }
    public set value(v: T) {
        this._value = v;
        this.emit('valueChange', v);
    }

    constructor(value: T) {
        super();
        this._value = value;
    }

    waitValueTo(value: T) {
        return new Promise(res => {
            if (this._value === value) {
                res(value);
                return;
            }
            const fn = (v: T) => {
                if (v === value) {
                    this.off('valueChange', fn);
                    res(v);
                }
            };
            this.on('valueChange', fn);
        });
    }
}

function resolvePath(path: string): ResolveResult {
    const targetPath = resolve(base, path);

    const safe = targetPath.startsWith(checkBase);
    return {
        safe,
        resolved: targetPath
    };
}

function parseBodyParam(body: string) {
    const arr = body.split('&');
    const obj: Record<string, string> = {};
    arr.forEach(v => {
        const [name, value] = v.split('=');
        obj[name] = value;
    });
    return obj;
}

function withSafeCheck(
    exec: (req: Request, res: Response, path: ResolveResult) => void
) {
    return async (req: Request, res: Response) => {
        const query = parseBodyParam(req.body);
        const path = query.name ?? '';
        if (typeof path !== 'string') {
            res.status(500).end('Parameter Error: File path is required.');
            return;
        }
        const dir = resolvePath(path);
        if (!dir.safe) {
            res.status(500).end(
                'Permission Error: Cannot access file outside current working directory.'
            );
            return;
        } else {
            exec(req, res, dir);
        }
    };
}

interface AllFilesStatus {
    status: APIStatus;
    content: string;
}

function getAllFiles(suffix: string, dir: string, join: string) {
    return async (req: Request, res: Response) => {
        const query = req.query ? req.query : parseBodyParam(req.body);
        const id = query.id;
        if (typeof id !== 'string') {
            res.status(404).end('Parameter Error: file names is required.');
            return;
        }

        const list = id.split(',');
        const tasks = list.map<Promise<AllFilesStatus>>(async v => {
            const path = resolvePath(`${dir}${v}${suffix}`);
            if (!path.safe) {
                return Promise.resolve<AllFilesStatus>({
                    status: APIStatus.PermissionDeny,
                    content: ''
                });
            }

            const exist = await pathExists(path.resolved);
            if (!exist) {
                return Promise.resolve<AllFilesStatus>({
                    status: APIStatus.FileNotExist,
                    content: ''
                });
            }

            return readFile(path.resolved, 'utf-8').then(
                value => {
                    return {
                        status: APIStatus.Success,
                        content: value
                    };
                },
                reason => {
                    console.error(reason);
                    return { status: APIStatus.ReadError, content: '' };
                }
            );
        });

        const contents = await Promise.all(tasks);
        if (contents.every(v => v.status === APIStatus.Success)) {
            const content = contents.map(v => v.content).join(join);
            if (suffix === '.js') {
                res.writeHead(200, { 'Content-type': 'text/javascript' });
            }
            res.end(content);
        } else {
            const strArray = contents.map((v, i) => {
                if (v.status === APIStatus.PermissionDeny) {
                    return `Index: ${i}; Permission Error: Cannot access file outside current working directory`;
                } else if (v.status === APIStatus.Success) {
                    return `Index: ${i}: Internal Error: Read file error.`;
                } else {
                    return 'Success';
                }
            });
            const str = strArray.filter(v => v !== 'Success').join('\n');
            res.status(500).end(str);
        }
    };
}

async function getEsmFile(
    req: Request,
    res: Response,
    dir: string
): Promise<void> {
    const path = resolvePath(dir);
    if (!path.safe) {
        res.status(500).end(
            'Permission Error: Cannot access file outside current working directory'
        );
        return;
    }

    const watcher = rollupMap.get(path.resolved);

    if (!watcher) {
        const file = (bundleIndex++).toString();
        await ensureDir('_bundle');
        // 配置rollup监听器
        const w = rollup.watch({
            input: path.resolved,
            output: {
                file: `_bundle/${file}.js`,
                sourcemap: true,
                format: 'es'
            },
            cache: true,
            watch: {
                exclude: '**/node_modules/**'
            },
            plugins: [
                typescript({
                    sourceMap: true,
                    noCheck: true,
                    paths: {
                        '@motajs/*': ['packages/*/src'],
                        '@user/*': ['packages-user/*/src']
                    }
                }),
                nodeResolve({
                    browser: true,
                    preferBuiltins: false
                }),
                commonjs(),
                json(),
                replace({
                    'import.meta.env.DEV': 'false'
                })
            ],
            onwarn() {}
        });

        const info: RollupInfo = {
            watcher: w,
            file: `_bundle/${file}.js`,
            dir,
            bundled: new RefValue(false)
        };
        w.on('event', e => {
            if (e.code === 'ERROR') {
                res.status(500).end('Internal Error: Esm build error.');
                console.log(e.error);
            }

            if (e.code === 'BUNDLE_END') {
                info.bundled.value = true;
                console.log(`${path.resolved} bundle end`);
            }

            if (e.code === 'BUNDLE_START') {
                info.bundled.value = false;
            }
        });
        w.on('change', id => {
            console.log(`${id} changed. Refresh Page.`);
            if (ws) {
                ws.send(JSON.stringify({ type: 'reload' }));
            }
        });
        rollupMap.set(path.resolved, info);

        // 配置完毕，直接重新获取即可（
        return getEsmFile(req, res, dir);
    } else {
        try {
            await watcher.bundled.waitValueTo(true);
            const content = await readFile(watcher.file, 'utf-8');
            res.writeHead(200, { 'Content-type': 'text/javascript' });
            res.end(content);
        } catch (e) {
            console.error(e);
        }
    }
}

const apiListFile = withSafeCheck(async (_, res, path) => {
    const exist = await pathExists(path.resolved);
    if (!exist) {
        res.status(404).end('Permission Error: Path does not exist.');
        return;
    }
    try {
        const data = await readdir(path.resolved);
        res.end(JSON.stringify(data));
    } catch (e) {
        console.error(e);
        res.status(500).end('Internal Error: Read dir error.');
    }
});

const apiMakeDir = withSafeCheck(async (_, res, path) => {
    try {
        await ensureDir(path.resolved);
        res.end();
    } catch (e) {
        console.error(e);
        res.status(500).end('Internal Error: Make dir error.');
    }
});

const apiReadFile = withSafeCheck(async (req, res, path) => {
    const query = parseBodyParam(req.body);
    const type = query.type ?? 'utf8';
    if (typeof type !== 'string') {
        res.status(500).end('Internal Error: Query parsed failed.');
        return;
    }
    const exist = await pathExists(path.resolved);
    if (!exist) {
        res.status(404).end('Permission Error: Path does not exist.');
        return;
    }

    try {
        const file = await readFile(path.resolved, {
            encoding: type as BufferEncoding
        });
        res.end(file);
    } catch (e) {
        console.error(e);
        res.status(500).end('Internal Error: Read file error.');
    }
});

const apiWriteFile = withSafeCheck(async (req, res, path) => {
    const query = parseBodyParam(req.body);
    const type = query.type ?? 'utf8';
    if (typeof type !== 'string') {
        res.status(500).end('Internal Error: Query parsed failed.');
        return;
    }
    const value = query.value;
    if (typeof value !== 'string') {
        res.status(500).end('Parameter Error: File content is required.');
        return;
    }
    try {
        await writeFile(path.resolved, value, {
            encoding: type as BufferEncoding
        });
        res.end();

        if (/project(\/|\\)events\.js/.test(path.resolved)) {
            doDeclaration('events', value);
        }
        if (/project(\/|\\)items\.js/.test(path.resolved)) {
            doDeclaration('items', value);
        }
        if (/project(\/|\\)maps\.js/.test(path.resolved)) {
            doDeclaration('maps', value);
        }
        if (/project(\/|\\)data\.js/.test(path.resolved)) {
            doDeclaration('data', value);
        }
    } catch (e) {
        console.error(e);
        res.status(500).end(
            'Internal Error: Fail to write file or fail to do declaration.'
        );
    }
});

const apiDeleteFile = withSafeCheck(async (_, res, path) => {
    const exist = await pathExists(path.resolved);
    if (!exist) {
        res.status(404).end('Permission Error: Path does not exist.');
        return;
    }
    try {
        await remove(path.resolved);
        res.end();
    } catch (e) {
        console.error(e);
        res.status(500).end('Internal Error: Remove file error.');
    }
});

const apiMoveFile = async (req: Request, res: Response) => {
    const query = parseBodyParam(req.body);
    const src = query.src;
    const dest = query.dest;

    if (typeof src !== 'string' || typeof dest !== 'string') {
        res.status(500).end(
            'Parameter Error: Source path or destination path is required.'
        );
        return;
    }

    const srcPath = resolvePath(src);
    const destPath = resolvePath(dest);

    if (!srcPath.safe || !destPath.safe) {
        res.status(500).end(
            'Permission Error: Cannot access file outside current working directory.'
        );
    }

    try {
        await move(srcPath.resolved, destPath.resolved);
        res.end();
    } catch (e) {
        console.error(e);
        res.status(500).end('Internal Error: Move file error.');
    }
};

const apiWriteMultiFiles = async (req: Request, res: Response) => {
    const query = parseBodyParam(req.body);
    const name = query.name;
    const value = query.value;

    if (typeof name !== 'string' || typeof value !== 'string') {
        res.status(500).end(
            'Parameter Error: File names and content is required.'
        );
        return;
    }

    const pathList = name.split(';');
    const valueList = value.split(';');

    if (pathList.length !== valueList.length) {
        res.status(500).end(
            'Parameter Error: File name and content count must match.'
        );
        return;
    }

    const tasks = pathList.map<Promise<APIStatus>>((v, i) => {
        const path = resolvePath(v);
        if (!path.safe) {
            return Promise.resolve<APIStatus>(APIStatus.PermissionDeny);
        }
        return new Promise<APIStatus>(resolve => {
            writeFile(v, valueList[i]).then(
                () => {
                    resolve(APIStatus.Success);
                },
                reason => {
                    console.error(reason);
                    resolve(APIStatus.WriteError);
                }
            );
        });
    });

    const status = await Promise.all(tasks);

    if (status.every(v => v === APIStatus.Success)) {
        res.end();
    } else {
        const strArray = status.map((v, i) => {
            if (v === APIStatus.PermissionDeny) {
                return `Index: ${i}; Permission Error: Cannot access file outside current working directory`;
            } else if (v === APIStatus.Success) {
                return `Index: ${i}: Internal Error: Write file error.`;
            } else {
                return 'Success';
            }
        });
        const str = strArray.filter(v => v !== 'Success').join('\n');
        res.status(500).end(str);
    }
};

const apiGetAllFloors = getAllFiles('.js', 'project/floors/', '\n');
const apiGetAllAnimates = getAllFiles(
    '.animate',
    'project/animates/',
    '@@@~~~###~~~@@@'
);

const apiGetEsmFiles = async (req: Request, res: Response) => {
    const query = req.query ? req.query : parseBodyParam(req.body);
    const name = query.name;
    if (typeof name !== 'string') {
        res.status(500).end('Parameter Error: File name is required.');
        return;
    }
    const path = resolvePath(join('..', name));
    if (!path.safe) {
        res.status(500).end(
            'Permission Error: Cannot access file outside current working directory'
        );
        return;
    }

    return getEsmFile(req, res, path.resolved);
};

const apiGetPort = async (_req: Request, res: Response) => {
    const port = {
        vite: vitePort,
        server: serverPort
    };
    res.end(JSON.stringify(port));
};

/**
 * 声明某种类型
 * @param {string} type 类型
 * @param {string} data 信息
 */
async function doDeclaration(type: string, data: string) {
    try {
        const buf = Buffer.from(data, 'base64');
        data = buf.toString('utf-8');
        if (type === 'events') {
            // 事件
            const eventData = JSON.parse(data.split('\n').slice(1).join(''));

            let eventDec = 'type EventDeclaration = \n';
            for (const id in eventData.commonEvent) {
                eventDec += `    | '${id}'\n`;
            }
            await writeFile('src/types/source/events.d.ts', eventDec, 'utf-8');
        } else if (type === 'items') {
            // 道具
            const itemData = JSON.parse(data.split('\n').slice(1).join(''));

            let itemDec = 'interface ItemDeclaration {\n';
            for (const id in itemData) {
                itemDec += `    ${id}: '${itemData[id].cls}';\n`;
            }
            itemDec += '}';
            await writeFile('src/types/source/items.d.ts', itemDec, 'utf-8');
        } else if (type === 'maps') {
            // 映射
            const d = JSON.parse(data.split('\n').slice(1).join(''));

            let id2num = 'interface IdToNumber {\n';
            let num2id = 'interface NumberToId {\n';
            let id2cls = 'interface IdToCls {\n';
            for (const num in d) {
                const { id, cls } = d[num];
                id2num += `    ${id}: ${num};\n`;
                num2id += `    ${num}: '${id}';\n`;
                id2cls += `    ${id}: '${cls}';\n`;
            }
            id2cls += '}';
            id2num += '}';
            num2id += '}';
            await writeFile('src/types/source/cls.d.ts', id2cls, 'utf-8');
            await writeFile(
                'src/types/source/maps.d.ts',
                `${id2num}\n${num2id}`,
                'utf-8'
            );
        } else if (type === 'data') {
            // 全塔属性的注册信息
            const d = JSON.parse(data.split('\n').slice(1).join('')).main;

            let floorId = 'type FloorIds =\n';
            let imgs = 'type ImageIds =\n';
            let anis = 'type AnimationIds =\n';
            let sounds = 'type SoundIds =\n';
            let names = 'interface NameMap {\n';
            let bgms = 'type BgmIds =\n';
            let fonts = 'type FontIds =\n';

            floorId += d.floorIds.map((v: any) => `    | '${v}'\n`).join('');
            imgs += d.images.map((v: any) => `    | '${v}'\n`).join('');
            anis += d.animates.map((v: any) => `    | '${v}'\n`).join('');
            sounds += d.sounds.map((v: any) => `    | '${v}'\n`).join('');
            bgms += d.bgms.map((v: any) => `    | '${v}'\n`).join('');
            fonts += d.fonts.map((v: any) => `    | '${v}'\n`).join('');
            for (const name in d.nameMap) {
                names += `    '${name}': '${d.nameMap[name]}';\n`;
            }
            names += '}';

            await writeFile(
                'src/types/source/data.d.ts',
                `
${floorId}
${d.images.length > 0 ? imgs : 'type ImageIds = never\n'}
${d.animates.length > 0 ? anis : 'type AnimationIds = never\n'}
${d.sounds.length > 0 ? sounds : 'type SoundIds = never\n'}
${d.bgms.length > 0 ? bgms : 'type BgmIds = never\n'}
${d.fonts.length > 0 ? fonts : 'type FontIds = never\n'}
${names}
`,
                'utf-8'
            );
        }
    } catch (e) {
        console.log(e);
    }
}

function watchProject() {
    if (wt) return;
    const watcher = chokidar.watch('public/', {
        persistent: true,
        ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/thirdparty/**',
            '**/_docs/**',
            '**/_save/**',
            /\.min\./,
            /(^|[/\\])\../,
            /(^|[/\\])[^a-zA-Z:._0-9/\\]/,
            /_.*/
        ]
    });
    wt = watcher;
    watcher.removeAllListeners();
    watcher.on('change', async path => {
        if (!ws) return;
        // 楼层热重载
        if (/project(\/|\\)floors(\/|\\).*\.js$/.test(path)) {
            const floor = basename(path).slice(0, -3);
            ws.send(JSON.stringify({ type: 'floorHotReload', floor }));
            console.log(`Floor hot reload: ${floor}.`);
            return;
        }

        // 脚本编辑热重载
        if (/project(\/|\\)functions\.js$/.test(path)) {
            ws.send(JSON.stringify({ type: 'functionsHotReload' }));
            console.log(`Functions hot reload.`);
            return;
        }

        // 数据热重载
        if (/project(\/|\\).*\.js/.test(path)) {
            const data = basename(path).slice(0, -3);
            ws.send(JSON.stringify({ type: 'dataHotReload', data }));
            console.log(`Data hot reload: ${data}.`);
            return;
        }

        // css热重载
        if (/.*\.css$/.test(path)) {
            ws.send(JSON.stringify({ type: 'cssHotReload', path }));
            console.log(`Css hot reload: ${path}.`);
            return;
        }

        // 剩余内容全部reload
        ws.send(JSON.stringify({ type: 'reload' }));
    });
}

function setupSocket(socket: WebSocket) {
    ws = socket;
    socket.send(JSON.stringify({ type: 'connected' }));
    watchProject();
}

async function startWsServer(http: Server) {
    if (ws) return;

    const server = new WebSocketServer({
        server: http
    });

    server.on('connection', socket => {
        setupSocket(socket);
    });
}

async function ensureConfig() {
    const { resolved, safe } = resolvePath('_server/config.json');
    if (!safe) {
        throw new Error('Internal Error: Fail to access editor config file.');
    }
    const exist = await pathExists(resolved);
    if (!exist) {
        return writeFile(resolved, '{}', { encoding: 'utf-8' });
    }
}

(async function () {
    // 1. 加载 vite.config.ts
    const fsHost = `http://127.0.0.1:${serverPort}`;
    const config = await loadConfigFromFile({
        command: 'serve',
        mode: 'development'
    });
    if (!config) {
        console.error(`Cannot load config file.`);
        return;
    }
    const merged = mergeConfig(config.config, {
        server: {
            proxy: {
                '/readFile': fsHost,
                '/writeFile': fsHost,
                '/writeMultiFiles': fsHost,
                '/listFile': fsHost,
                '/makeDir': fsHost,
                '/moveFile': fsHost,
                '/deleteFile': fsHost,
                '/getPort': fsHost,
                '^/all/.*': fsHost,
                '^/forceTem/.*': {
                    target: fsHost,
                    changeOrigin: true,
                    rewrite(path) {
                        return path.replace(/^\/forceTem/, '');
                    }
                },
                '/danmaku': 'https://h5mota.com/backend/tower/barrage.php'
            }
        }
    } satisfies UserConfig);

    // 2. 启动vite服务
    const vite = await createServer({
        ...merged,
        configFile: false
    });
    await vite.listen(vitePort);
    console.log(`游戏地址：http://localhost:${vitePort}/`);

    // 3. 启动样板http服务
    await ensureConfig();

    const app = express();
    app.use(express.text());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(base));

    app.post('/listFile', apiListFile);
    app.post('/makeDir', apiMakeDir);
    app.post('/readFile', apiReadFile);
    app.post('/writeFile', apiWriteFile);
    app.post('/deleteFile', apiDeleteFile);
    app.post('/moveFile', apiMoveFile);
    app.post('/writeMultiFiles', apiWriteMultiFiles);
    app.get('/all/__all_floors__.js', apiGetAllFloors);
    app.get('/all/__all_animates__', apiGetAllAnimates);
    app.get('/esm', apiGetEsmFiles);
    app.get('/getPort', apiGetPort);

    const server = app.listen(serverPort);

    server.on('listening', () => {
        console.log(`编辑器地址：http://127.0.0.1:${serverPort}/editor.html`);
        console.log(
            `文档地址：http://127.0.0.1:${serverPort}/_docs/index.html`
        );
    });

    // 4. 启动样板ws热重载服务
    startWsServer(server);

    process.on('SIGTERM', () => {
        vite.close();
        server.close();
        process.exit(0);
    });
})();
