import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';
import { DefaultTheme } from 'vitepress';

const apiDir = path.resolve('./docs/api');
const sidebarConfigPath = path.resolve('./docs/.vitepress/apiSidebar.ts');

const weight: Record<string, number> = {
    主页: 10,
    函数: 5
};

function generateSidebar(): void {
    const sidebar: DefaultTheme.SidebarItem[] = [
        { text: '目录', link: '/api/' }
    ];

    // 遍历 api 目录，查找 package 目录
    const packages = fs
        .readdirSync(apiDir)
        .filter(pkg => fs.statSync(path.join(apiDir, pkg)).isDirectory());

    packages.forEach(pkg => {
        const pkgPath = path.join(apiDir, pkg);
        const files = fs
            .readdirSync(pkgPath)
            .filter(file => file.endsWith('.md'));

        const items: DefaultTheme.SidebarItem[] = files.map(file => {
            const filePath = `api/${pkg}/${file}`;
            const fileName = path.basename(file, '.md');

            return {
                text:
                    fileName === 'index'
                        ? '主页'
                        : fileName === 'functions'
                        ? '函数'
                        : fileName,
                link: `/${filePath.replace(/\\/g, '/')}` // 兼容 Windows 路径
            };
        });

        items.sort((a, b) => {
            const titleA = a.text ?? '';
            const titleB = b.text ?? '';
            return (weight[titleB] ?? 0) - (weight[titleA] ?? 0);
        });

        sidebar.push({
            text: pkg,
            collapsed: true,
            items
        });
    });

    // 生成 sidebar.ts
    const sidebarContent = `import { DefaultTheme } from 'vitepress';

export default ${JSON.stringify(
        sidebar,
        null,
        4
    )} as DefaultTheme.SidebarItem[];`;
    fs.writeFileSync(sidebarConfigPath, sidebarContent);
    console.log('✅ Sidebar 配置已更新');
}

// 初次运行
generateSidebar();

// 监听文件变动
chokidar
    .watch(apiDir, { ignoreInitial: true })
    .on('add', filePath => {
        console.log(`📄 文件新增: ${filePath}`);
        generateSidebar();
    })
    .on('unlink', filePath => {
        console.log(`❌ 文件删除: ${filePath}`);
        generateSidebar();
    })
    .on('addDir', dirPath => {
        console.log(`📁 目录新增: ${dirPath}`);
        generateSidebar();
    })
    .on('unlinkDir', dirPath => {
        console.log(`📁 目录删除: ${dirPath}`);
        generateSidebar();
    })
    .on('raw', (event, path, details) => {
        if (event === 'rename') {
            console.log(`🔄 文件或文件夹重命名: ${path}`);
            generateSidebar();
        }
    });
