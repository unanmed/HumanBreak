import fs from 'fs-extra';
import { extname, resolve } from 'path';

(async function () {
    const dir = './src';
    let totalLines = 0;
    let totalFiles = 0;
    const list: Record<string, [number, number]> = {};

    const check = async (dir: string) => {
        const d = await fs.readdir(dir);
        for await (const one of d) {
            const stat = await fs.stat(resolve(dir, one));
            if (stat.isFile()) {
                if (
                    ['.ts', '.tsx', '.js', '.jsx', '.vue', '.less'].some(v =>
                        one.endsWith(v)
                    ) &&
                    !one.endsWith('.d.ts')
                ) {
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

    for (const [ext, [file, lines]] of Object.entries(list)) {
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
