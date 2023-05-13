import { createServer } from 'vite';
import {
    IncomingMessage,
    Server,
    ServerResponse,
    createServer as http
} from 'http';
import { isNil, some } from 'lodash-es';
import config from '../mota.config.js';
import fs from 'fs-extra';
import { resolve, basename } from 'path';
import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import EventEmitter from 'events';
import { WebSocket, WebSocketServer } from 'ws';
import chokidar from 'chokidar';

const base = './public';

type Request = IncomingMessage;
type Response = ServerResponse<IncomingMessage> & {
    req: IncomingMessage;
};

interface RollupInfo {
    dir: string;
    file: string;
    bundled: RefValue<boolean>;
    watcher: rollup.RollupWatcher;
}
const rollupMap = new Map<string, RollupInfo>();
let bundleIndex = 0;
let ws: WebSocket;

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

function resolvePath(path: string) {
    return resolve(base, path);
}

/**
 * 请求文件
 */
async function getFile(req: Request, res: Response, path: string) {
    try {
        const data = await fs.readFile(resolvePath(path));
        if (path.endsWith('.js'))
            res.writeHead(200, { 'Content-type': 'text/javascript' });
        if (path.endsWith('.css'))
            res.writeHead(200, { 'Content-type': 'text/css' });
        if (path.endsWith('.html'))
            res.writeHead(200, { 'Content-type': 'text/html' });
        return res.end(data), true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

/**
 * 高层塔优化及动画加载
 * @param suffix 后缀名
 * @param dir 文件夹路径
 * @param join 分隔符
 */
async function getAll(
    req: Request,
    res: Response,
    ids: string[],
    suffix: string,
    dir: string,
    join: string
) {
    let data: Record<string, Buffer> = {};
    const tasks = ids.map(v => {
        return new Promise(res => {
            const d = resolvePath(`${dir}${v}${suffix}`);
            try {
                fs.readFile(d).then(vv => {
                    data[v] = vv;
                    res(`${v} pack success.`);
                });
            } catch (e) {
                console.log(e);
            }
        });
    });
    await Promise.all(tasks);
    const result = ids.map(v => data[v]);
    return res.end(result.join(join)), true;
}

async function getEsmFile(
    req: Request,
    res: Response,
    dir: string
): Promise<void> {
    const path = resolvePath(dir.replace('.esm', ''));

    const watcher = rollupMap.get(path);

    const file = (bundleIndex++).toString();

    if (!watcher) {
        await fs.ensureDir('_bundle');
        // 配置rollup监听器
        const w = rollup.watch({
            input: path,
            output: {
                file: `_bundle/${file}.js`,
                sourcemap: true,
                format: 'es'
            },
            cache: true,
            watch: {
                exclude: '**/node_modules/**',
                buildDelay: 200
            },
            plugins: [typescript({ sourceMap: true }), nodeResolve()],
            onwarn() {}
        });

        const info: RollupInfo = {
            watcher: w,
            file: `_bundle/${file}.js`,
            dir,
            bundled: new RefValue(false)
        };
        w.on('event', e => {
            if (e.code === 'BUNDLE_END') {
                info.bundled.value = true;
                console.log(`${path} bundle end`);
            }

            if (e.code === 'BUNDLE_START') {
                info.bundled.value = false;
            }
        });
        w.on('change', id => {
            console.log(`${id} changed. Refresh Page.`);
            ws.send(JSON.stringify({ type: 'reload' }));
        });
        rollupMap.set(path, info);

        // 配置完毕，直接重新获取即可（
        return getEsmFile(req, res, dir);
    } else {
        try {
            await watcher.bundled.waitValueTo(true);
            const content = await fs.readFile(watcher.file, 'utf-8');
            res.writeHead(200, { 'Content-type': 'text/javascript' });
            res.end(content);
        } catch (e) {
            console.log(e);
        }
    }
}

/**
 * 获取POST数据
 */
async function getPostData(req: Request) {
    let data = '';
    await new Promise(res => {
        req.on('data', chunk => {
            data += chunk.toString();
        });
        req.on('end', res);
    });
    return data;
}

async function readDir(req: Request, res: Response) {
    const data = await getPostData(req);
    const dir = resolvePath(data.toString().slice(5));
    try {
        const info = await fs.readdir(dir);
        res.end(JSON.stringify(info));
    } catch (e) {
        console.log(e);
        res.end(`Error: Read dir ${dir} fail. Does the dir exists?`);
    }
}

async function mkdir(req: Request, res: Response) {
    const data = await getPostData(req);
    const dir = resolvePath(data.toString().slice(5));
    try {
        await fs.ensureDir(dir);
    } catch (e) {
        console.log(e);
    }
    res.end();
}

async function readFile(req: Request, res: Response) {
    const data = (await getPostData(req)).toString();
    const dir = resolvePath(data.split('&name=')[1]);
    try {
        const type = /^type=(utf8|base64)/.exec(data)?.[0].slice(5) ?? 'utf8';
        const info = await fs.readFile(dir, { encoding: type });
        res.end(info);
    } catch (e) {
        console.log(e);
    }
}

async function writeFile(req: Request, res: Response) {
    const data = (await getPostData(req)).toString();
    const name = data.split('&name=')[1].split('&value=')[0];
    const dir = resolvePath(name);
    try {
        const type = /^type=(utf8|base64)/.exec(data)?.[0].slice(5) ?? 'utf8';
        const value = /&value=.+/.exec(data)?.[0].slice(7) ?? '';
        await fs.writeFile(dir, value, { encoding: type });
        if (name.endsWith('project/events.js')) doDeclaration('events', value);
        if (name.endsWith('project/items.js')) doDeclaration('items', value);
        if (name.endsWith('project/maps.js')) doDeclaration('maps', value);
        if (name.endsWith('project/data.js')) doDeclaration('data', value);
    } catch (e) {
        console.log(e);
        res.end(
            `error: Write file ${dir} fail. Does the parent folder exists?`
        );
    }
    res.end();
}

async function rm(req: Request, res: Response) {
    const data = (await getPostData(req)).toString();
    const dir = resolvePath(data.slice(5));
    try {
        await fs.remove(dir);
    } catch (e) {
        console.log(e);
        res.end(`error: Remove file ${dir} fail. Does this file exists?`);
    }
    res.end();
}

async function moveFile(req: Request, res: Response) {
    const data = (await getPostData(req)).toString();
    const info = data.split('&dest=');
    const src = resolvePath(info[0].slice(4));
    const dest = resolvePath(info[1]);
    try {
        await fs.move(src, dest);
    } catch (e) {
        console.log(e);
    }
    res.end();
}

async function writeMultiFiles(req: Request, res: Response) {
    const data = (await getPostData(req)).toString();
    const names =
        /name=.+&value=/.exec(data)?.[0].slice(5, -7).split(';') ?? [];
    const value = /&value=.+/.exec(data)?.[0].slice(7).split(';') ?? [];

    const tasks = names.map((v, i) => {
        try {
            return new Promise(res => {
                fs.writeFile(
                    resolvePath(v),
                    value[i],
                    'base64' // 多文件是base64写入的
                ).then(v => {
                    res(`write ${v} success.`);
                });
            });
        } catch (e) {
            console.log(e);
            res.end(`error: Write multi files fail.`);
        }
    });
    await Promise.all(tasks).catch(e => console.log(e));
    res.end();
}

/**
 * 声明某种类型
 * @param {string} type 类型
 * @param {string} data 信息
 */
async function doDeclaration(type: string, data: string) {
    const buf = Buffer.from(data, 'base64');
    data = buf.toString('utf-8');
    if (type === 'events') {
        // 事件
        const eventData = JSON.parse(data.split('\n').slice(1).join(''));

        let eventDec = 'type EventDeclaration = \n';
        for (const id in eventData.commonEvent) {
            eventDec += `    | '${id}'\n`;
        }
        await fs.writeFile('../src/source/events.d.ts', eventDec, 'utf-8');
    } else if (type === 'items') {
        // 道具
        const itemData = JSON.parse(data.split('\n').slice(1).join(''));

        let itemDec = 'interface ItemDeclaration {\n';
        for (const id in itemData) {
            itemDec += `    ${id}: '${itemData[id].cls}';\n`;
        }
        itemDec += '}';
        await fs.writeFile('../src/source/items.d.ts', itemDec, 'utf-8');
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
        await fs.writeFile('../src/source/cls.d.ts', id2cls, 'utf-8');
        await fs.writeFile(
            '../src/source/maps.d.ts',
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

        await fs.writeFile(
            '../src/source/data.d.ts',
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
}

async function startHttpServer(port: number = 3000) {
    const server = http();

    const tryNext = () => {
        server.listen(port++, '127.0.0.1');
    };
    server.on('error', () => {
        tryNext();
    });
    server.on('listening', () => {
        console.log(`编辑器地址：http://127.0.0.1:${port - 1}/editor.html`);
        setupHttp(server);
    });
    tryNext();

    return server;
}

function setupHttp(server: Server) {
    server.on('request', async (req, res) => {
        const p = req.url
            ?.replace(`/games/${config.name}`, '')
            .replace('/all/', '/') // 样板中特殊处理的all文件
            .replace('/forceTem/', '/') // 强制用样板的http服务获取文件
            .replace('/src/', '../src/'); // src在上一级目录
        if (isNil(p)) return;

        if (req.method === 'GET') {
            const dir = resolvePath(
                p === '/' ? 'index.html' : p.slice(1)
            ).split('?v=')[0];

            if (/.*\.esm\..*/.test(p)) {
                // xxx.esm.xxx，说明是需要打包的es模块化文件，需要rollup打包后传输
                return getEsmFile(req, res, p);
            }

            if (p.startsWith('/__all_floors__.js')) {
                const all = p.split('&id=')[1].split(',');
                res.writeHead(200, { 'Content-type': 'text/javascript' });
                return getAll(req, res, all, '.js', 'project/floors/', '\n');
            }

            if (p.startsWith('/__all_animates__')) {
                const all = p.split('&id=')[1].split(',');
                const split = '@@@~~~###~~~@@@';
                const dir = 'project/animates/';
                return getAll(req, res, all, '.animate', dir, split);
            }

            if (await getFile(req, res, dir)) return;
        }

        if (req.method === 'POST') {
            if (p === '/listFile') return readDir(req, res);
            if (p === '/makeDir') return mkdir(req, res);
            if (p === '/readFile') return readFile(req, res);
            if (p === '/writeFile') return writeFile(req, res);
            if (p === '/deleteFile') return rm(req, res);
            if (p === '/moveFile') return moveFile(req, res);
            if (p === '/writeMultiFiles') return writeMultiFiles(req, res);
        }

        res.statusCode = 404;
        res.end();
    });
}

function watchProject() {
    const watcher = chokidar.watch('public/', {
        persistent: true,
        ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/thirdparty/**',
            '**/_docs/**',
            '**/_save/**',
            /\.min\./,
            /(^|[\/\\])\../,
            /(^|[\/\\])[^a-zA-Z:\._0-9\/\\]/
        ]
    });
    watcher.on('change', async path => {
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
            const data = basename(path);
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

async function startWsServer(port: number = 8080) {
    const tryNext = () => {
        return new Promise<WebSocketServer>(res => {
            const server = new WebSocketServer({
                port: port++
            });

            server.on('error', async () => {
                res(await tryNext());
            });

            server.on('connection', socket => {
                setupSocket(socket);
                res(server);
            });
        });
    };
}

(async function () {
    // 1. 启动vite服务
    const vite = await createServer();
    await vite.listen(5173);
    console.log(`游戏地址：http://localhost:5173/games/${config.name}/`);

    // 2. 启动样板http服务
    await startHttpServer();

    // 3. 启动样板ws热重载服务
    await startWsServer();
})();
