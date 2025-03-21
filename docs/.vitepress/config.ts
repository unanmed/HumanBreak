import { defineConfig } from 'vitepress';
import { MermaidMarkdown, MermaidPlugin } from 'vitepress-plugin-mermaid';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: 'HTML5 魔塔样板 V2.B',
    description: 'HTML5 魔塔样板 V2.B 帮助文档',
    base: '/_docs/',
    markdown: {
        math: true,
        config(md) {
            md.use(MermaidMarkdown);
        }
    },
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        outline: [2, 3],
        nav: [
            { text: '主页', link: '/' },
            { text: '指南', link: '/guide/diff' },
            { text: 'API', link: '/api/' },
            { text: '错误代码', link: '/logger/' }
        ],
        sidebar: {
            '/guide/': [
                {
                    text: '深度指南',
                    items: [
                        { text: '差异说明', link: '/guide/diff' },
                        { text: '系统说明', link: '/guide/system' },
                        { text: '代码编写', link: '/guide/coding' },
                        {
                            text: 'UI 系统',
                            collapsed: false,
                            items: [
                                { text: 'UI 编写', link: '/guide/ui' },
                                { text: 'UI 优化', link: '/guide/ui-perf' },
                                { text: 'UI 系统', link: '/guide/ui-system' },
                                { text: 'UI 元素', link: '/guide/ui-elements' },
                                { text: 'UI 常见问题', link: '/guide/ui-faq' }
                            ]
                        },
                        { text: '音频系统', link: '/guide/audio' }
                    ]
                }
            ],
            '/logger/': [
                {
                    text: '错误代码一览',
                    items: [
                        {
                            text: '错误代码',
                            collapsed: false,
                            items: [
                                { text: '1-50', link: '/logger/error/error1' }
                            ]
                        },
                        {
                            text: '警告代码',
                            collapsed: false,
                            items: [
                                { text: '1-50', link: '/logger/warn/warn1' },
                                { text: '51-100', link: '/logger/warn/warn2' }
                            ]
                        }
                    ]
                }
            ]
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/unanmed/HumanBreak' }
        ],
        search: {
            provider: 'local',
            options: {
                locales: {
                    zh: {
                        translations: {
                            button: {
                                buttonText: '搜索文档',
                                buttonAriaLabel: '搜索文档'
                            },
                            modal: {
                                noResultsText: '无法找到相关结果',
                                resetButtonTitle: '清除查询条件',
                                footer: {
                                    selectText: '选择',
                                    navigateText: '切换'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    locales: {
        root: {
            lang: 'zh',
            label: '中文'
        }
    },
    vite: {
        plugins: [MermaidPlugin()],
        optimizeDeps: {
            include: ['mermaid']
        },
        ssr: {
            noExternal: ['mermaid']
        }
    }
});
