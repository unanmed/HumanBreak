import fs from 'fs-extra';
import { resolve } from 'path';

(async function () {
    const dir = './src';
    let total = 0;

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
                    total += lines;
                }
            } else {
                await check(resolve(dir, one));
            }
        }
    };
    await check(dir);

    console.log(total);
})();
