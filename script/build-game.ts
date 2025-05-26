import { build, loadConfigFromFile, mergeConfig, UserConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';
import fs from 'fs-extra';

const outputDir = path.resolve('./dist/game');

// 清空 dist/game 目录
fs.emptyDirSync(outputDir);

// 构建游戏
async function buildGame() {
    const configFile = path.resolve('./vite.config.ts');
    const config = await loadConfigFromFile(
        { command: 'build', mode: 'production' },
        configFile
    );
    const resolved = mergeConfig(config?.config ?? {}, {
        plugins: [
            legacy({
                targets: [
                    'Chrome >= 56',
                    'Firefox >= 51',
                    'Edge >= 79',
                    'Safari >= 15',
                    'Opera >= 43'
                ],
                polyfills: true,
                modernPolyfills: true
            })
        ],
        build: {
            outDir: outputDir,
            sourcemap: true,
            rollupOptions: {
                input: path.resolve('./src/main.ts'),
                output: {
                    format: 'es',
                    entryFileNames: '[name].[hash].js',
                    chunkFileNames: 'chunks/[name].[hash].js',
                    assetFileNames: 'assets/[name].[hash][extname]',
                    manualChunks: {
                        antdv: ['ant-design-vue', '@ant-design/icons-vue'],
                        common: [
                            'lodash-es',
                            'axios',
                            'lz-string',
                            'chart.js',
                            'mutate-animate',
                            '@vueuse/core'
                        ]
                    }
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
