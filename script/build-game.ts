import { build, loadConfigFromFile, mergeConfig, UserConfig } from 'vite';
import path from 'path';
import fs from 'fs-extra';

const outputDir = path.resolve(__dirname, '../dist/game');

// 清空 dist/game 目录
fs.emptyDirSync(outputDir);

// 构建游戏
async function buildGame() {
    const configFile = path.resolve(__dirname, '../vite.config.ts');
    const config = await loadConfigFromFile(
        { command: 'build', mode: 'production' },
        configFile
    );
    const resolved = mergeConfig(config?.config ?? {}, {
        build: {
            outDir: outputDir,
            sourcemap: true,
            rollupOptions: {
                input: path.resolve(__dirname, '../src/main.ts'),
                output: {
                    format: 'es',
                    entryFileNames: '[name].[hash].js',
                    chunkFileNames: 'chunks/[name].[hash].js',
                    assetFileNames: 'assets/[name].[hash][extname]'
                }
            }
        }
    } satisfies UserConfig);

    await build(resolved);
    console.log('✅ Game built successfully.');
}

buildGame().catch(e => {
    console.error(e);
    process.exit(1);
});
