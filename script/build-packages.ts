import { build, loadConfigFromFile, mergeConfig, UserConfig } from 'vite';
import path from 'path';
import fs from 'fs-extra';

const packagesDir = path.resolve('./packages');
const outputDir = path.resolve('./dist/packages');

// 清空 dist 目录
fs.emptyDirSync(outputDir);

// 获取所有包目录
const packageDirs = fs.readdirSync(packagesDir).filter(name => {
    const packagePath = path.join(packagesDir, name);
    return fs.statSync(packagePath).isDirectory();
});

// 构建每一个包
async function buildPackages() {
    for (const packageName of packageDirs) {
        const packageDir = path.join(packagesDir, packageName);
        const configFile = path.resolve('./vite.config.ts');
        const config = await loadConfigFromFile(
            { command: 'build', mode: 'production' },
            configFile
        );
        const resolved = mergeConfig(config?.config ?? {}, {
            build: {
                lib: {
                    entry: path.join(packageDir, 'src/index.ts'),
                    name: packageName,
                    formats: ['es'],
                    fileName: format => `${packageName}.${format}.js`
                },
                outDir: path.join(outputDir, packageName),
                sourcemap: true,
                emptyOutDir: true,
                rollupOptions: {
                    external: [/node_modules/, /^@motajs\/.*/]
                }
            },
            publicDir: false
        } satisfies UserConfig);

        await build(resolved);
        console.log(`✅ Package ${packageName} built successfully.`);
    }
}

buildPackages().catch(e => {
    console.error(e);
    process.exit(1);
});
