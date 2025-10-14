/* eslint-disable no-console */
import { copy, emptyDir, ensureDir } from 'fs-extra';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';

const base = resolve(process.cwd());
const template = resolve(base, 'template');

const serve = `在 2.B 样板中，不再使用先前的启动服务，而使用一个单独的软件。
你可以加造塔群 959329661 后，在群文件 - 启动服务 中获取，文件夹中会有一个专门的安装教程。`;

async function packTemplate() {
    await ensureDir(template);
    await emptyDir(template);

    // 复制必要文件
    const toCopy = [
        '.vscode',
        'packages',
        'packages-user',
        'public',
        'script',
        'src',
        '.gitignore',
        '.madgerc',
        '.prettierignore',
        '.prettierrc',
        'eslint.config.js',
        'index.html',
        'LICENSE',
        'package.json',
        'pnpm-lock.yaml',
        'pnpm-workspace.yaml',
        'README.md',
        'tsconfig.json',
        'tsconfig.node.json',
        'vite.config.ts'
    ];

    await Promise.all(
        toCopy.map(v =>
            copy(resolve(base, v), resolve(template, v), {
                filter: src => !src.includes('node_modules')
            })
        )
    );

    await writeFile(resolve(template, '启动服务呢？.txt'), serve, 'utf-8');

    console.log(`样板打包完成`);
}

(() => {
    packTemplate();
})();
