import { build, loadConfigFromFile, mergeConfig, UserConfig } from 'vite';
import path from 'path';
import fs from 'fs-extra';
import dts from 'vite-plugin-dts';

const packages = path.resolve(process.cwd(), './packages');

// 获取所有包目录
const packageDirs = ['render'];

// 构建每一个包
async function buildPackages() {
    for (const packageName of packageDirs) {
        const packageDir = path.join(packages, packageName);
        const output = path.join(packageDir, 'dist');
        await fs.emptyDir(output);
        const configFile = path.resolve('./vite.config.ts');
        const config = await loadConfigFromFile(
            { command: 'build', mode: 'production' },
            configFile
        );
        const resolved = mergeConfig(config?.config ?? {}, {
            plugins: [
                dts({
                    entryRoot: path.join(packageDir, 'src/index.ts'),
                    rollupTypes: true,
                    strictOutput: false,
                    copyDtsFiles: false,
                    exclude: ['packages-user/**/*']
                })
            ],
            build: {
                lib: {
                    entry: path.join(packageDir, 'src/index.ts'),
                    name: packageName,
                    formats: ['es', 'cjs'],
                    fileName: format => `${packageName}.${format}.js`
                },
                outDir: output,
                sourcemap: true,
                emptyOutDir: true
            },
            publicDir: false
        } satisfies UserConfig);

        await build(resolved);
        console.log(`✅ Package ${packageName} built successfully.`);
    }
    const dirs = await fs.readdir(packages);
    for (const name of dirs) {
        const dir = path.join(process.cwd(), name);
        await fs.emptyDir(dir);
        await fs.rmdir(dir);
    }
}

buildPackages().catch(e => {
    console.error(e);
    process.exit(1);
});
