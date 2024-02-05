import typescript from '@rollup/plugin-typescript';
import fs from 'fs-extra';
import * as rollup from 'rollup';
import resolve from '@rollup/plugin-node-resolve';

export async function buildDeclaration() {
    const build = await rollup.rollup({
        input: './src/core/index.ts',
        plugins: [
            typescript({
                sourceMap: false,
                declaration: true,
                emitDeclarationOnly: true,
                outDir: './dist/types/',
                noEmit: false,
                jsx: 'preserve'
            }),
            resolve()
        ]
    });
    build.write({
        file: './dist/types/index.d.ts'
    });
}
buildDeclaration();
