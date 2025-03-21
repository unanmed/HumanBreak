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
            ],
            '/api/': [
                {
                    text: 'API 列表',
                    items: [
                        { text: '目录', link: '/api/' },
                        {
                            text: '@motajs/client',
                            collapsed: true,
                            items: [
                                { text: '目录', link: '/api/motajs-client/' }
                            ]
                        },
                        {
                            text: '@motajs/client-base',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/motajs-client-base/'
                                },
                                {
                                    text: 'KeyCode',
                                    link: '/api/motajs-client-base/KeyCode'
                                }
                            ]
                        },
                        {
                            text: '@motajs/common',
                            collapsed: true,
                            items: [
                                { text: '目录', link: '/api/motajs-common/' },
                                {
                                    text: '函数',
                                    link: '/api/motajs-common/functions'
                                },
                                {
                                    text: 'Logger',
                                    link: '/api/motajs-common/Logger'
                                }
                            ]
                        },
                        {
                            text: '@motajs/legacy-client',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/motajs-legacy-client/'
                                }
                            ]
                        },
                        {
                            text: '@motajs/legacy-common',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/motajs-legacy-common/'
                                }
                            ]
                        },
                        {
                            text: '@motajs/legacy-system',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/motajs-legacy-system/'
                                }
                            ]
                        },
                        {
                            text: '@motajs/legacy-ui',
                            collapsed: true,
                            items: [
                                { text: '目录', link: '/api/motajs-legacy-ui/' }
                            ]
                        },
                        {
                            text: '@motajs/render',
                            collapsed: true,
                            items: [
                                { text: '目录', link: '/api/motajs-render/' }
                            ]
                        },
                        {
                            text: '@motajs/render-core',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/motajs-render-core/'
                                }
                            ]
                        },
                        {
                            text: '@motajs/render-elements',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/motajs-render-elements/'
                                }
                            ]
                        },
                        {
                            text: '@motajs/render-style',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/motajs-render-style/'
                                }
                            ]
                        },
                        {
                            text: '@motajs/render-vue',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/motajs-render-vue/'
                                }
                            ]
                        },
                        {
                            text: '@motajs/system',
                            collapsed: true,
                            items: [
                                { text: '目录', link: '/api/motajs-system/' }
                            ]
                        },
                        {
                            text: '@motajs/system-action',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/motajs-system-action/'
                                }
                            ]
                        },
                        {
                            text: '@motajs/system-ui',
                            collapsed: true,
                            items: [
                                { text: '目录', link: '/api/motajs-system-ui/' }
                            ]
                        },
                        {
                            text: '@motajs/types',
                            collapsed: true,
                            items: [
                                { text: '目录', link: '/api/motajs-types/' }
                            ]
                        },
                        {
                            text: '@user/client-modules',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/user-client-modules/'
                                }
                            ]
                        },
                        {
                            text: '@user/data-base',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/user-data-base/'
                                }
                            ]
                        },
                        {
                            text: '@user/data-fallback',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/user-data-fallback/'
                                }
                            ]
                        },
                        {
                            text: '@user/data-state',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/user-data-state/'
                                }
                            ]
                        },
                        {
                            text: '@user/data-utils',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/user-data-utils/'
                                }
                            ]
                        },
                        {
                            text: '@user/entry-client',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/user-entry-client/'
                                }
                            ]
                        },
                        {
                            text: '@user/entry-data',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/user-entry-data/'
                                }
                            ]
                        },
                        {
                            text: '@user/legacy-plugin-client',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/user-legacy-plugin-client/'
                                }
                            ]
                        },
                        {
                            text: '@user/legacy-plugin-data',
                            collapsed: true,
                            items: [
                                {
                                    text: '目录',
                                    link: '/api/user-legacy-plugin-data/'
                                }
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
