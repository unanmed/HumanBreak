import { build } from 'vite';
import dts from 'vite-plugin-dts';

if (process.argv[2] === 'exe') buildDeclaration();

export async function buildDeclaration() {
    const b = await build({
        build: {
            lib: {
                entry: './src/main.ts',
                formats: ['es'],
                fileName: 'index.js'
            },
            outDir: './_temp/types'
        },
        plugins: [
            dts({
                rollupTypes: true,
                declarationOnly: true
            })
        ]
    });
}
