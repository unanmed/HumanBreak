import fs from 'fs-extra';
import { extname, resolve } from 'path';

(async function () {
    const dir = process.argv[2] || './src';
    let totalLines = 0;
    let totalFiles = 0;
    const list: Record<string, [number, number]> = {};
    const ignoreDir = [
        'node_modules',
        'floors',
        'thirdparty',
        'dist',
        '_bundle'
    ];
    const ignoreFile = ['.d.ts', '.min.'];
    const exts = [
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        '.vue',
        '.less',
        '.css',
        '.html'
    ];

    const check = async (dir: string) => {
        if (ignoreDir.some(v => dir.includes(v))) return;
        const d = await fs.readdir(dir);
        for await (const one of d) {
            if (ignoreFile.some(v => one.includes(v))) continue;
            const stat = await fs.stat(resolve(dir, one));
            if (stat.isFile()) {
                if (exts.some(v => one.endsWith(v))) {
                    const file = await fs.readFile(resolve(dir, one), 'utf-8');
                    const lines = file.split('\n').length;
                    const ext = extname(one);
                    list[ext] ??= [0, 0];
                    list[ext][0]++;
                    list[ext][1] += lines;
                    totalLines += lines;
                    totalFiles++;
                }
            } else {
                await check(resolve(dir, one));
            }
        }
    };
    await check(dir);

    const sorted = Object.entries(list).sort((a, b) => {
        return a[1][1] - b[1][1];
    });
    for (const [ext, [file, lines]] of sorted) {
        console.log(
            `${ext.slice(1).padEnd(7, ' ')}files: ${file
                .toString()
                .padEnd(6, ' ')}lines: ${lines}`
        );
    }
    console.log(
        `\x1b[33mtotal  files: ${totalFiles
            .toString()
            .padEnd(6, ' ')}lines: ${totalLines}\x1b[0m`
    );
})();
