/* eslint-disable no-console */
import { copy, emptyDir, ensureDir } from 'fs-extra';
import { resolve } from 'path';

const base = resolve(process.cwd());
const template = resolve(base, 'template');

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

    console.log(`样板打包完成`);
}

(() => {
    packTemplate();
})();
