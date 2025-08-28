import { defineConfig } from 'vitepress';
import { MermaidMarkdown, MermaidPlugin } from 'vitepress-plugin-mermaid';
import api from './apiSidebar';
import { join } from 'path';

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
    outDir: join(process.cwd(), 'public', '_docs'),
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        outline: [2, 3],
        nav: [
            { text: '主页', link: '/' },
            { text: '指南', link: '/guide/quick-start' },
            { text: 'API', link: '/api/' },
            { text: '错误代码', link: '/logger/' }
        ],
        sidebar: {
            '/guide/': [
                {
                    text: '深度指南',
                    items: [
                        { text: '快速开始', link: '/guide/quick-start' },

                        { text: '差异说明', link: '/guide/diff' },
                        { text: '系统说明', link: '/guide/system' },
                        { text: '代码编写', link: '/guide/coding' },
                        { text: '音频系统', link: '/guide/audio' },
                        {
                            text: 'UI 系统',
                            collapsed: false,
                            items: [
                                { text: '快速浏览', link: '/guide/ui/' },
                                { text: '编写 UI', link: '/guide/ui/ui' },
                                { text: 'UI 元素', link: '/guide/ui/elements' },
                                {
                                    text: '组件使用指南',
                                    link: '/guide/ui/component'
                                },
                                { text: '优化性能', link: '/guide/ui/perf' },
                                { text: 'UI 系统', link: '/guide/ui/system' },
                                { text: '常见问题', link: '/guide/ui/faq' },
                                { text: '未来规划', link: '/guide/ui/future' }
                            ]
                        },
                        {
                            text: '常见需求指南',
                            collapsed: false,
                            items: [
                                {
                                    text: '快速浏览',
                                    link: '/guide/implements/index'
                                },
                                {
                                    text: '怪物特殊属性',
                                    link: '/guide/implements/special'
                                },
                                {
                                    text: '修改状态栏',
                                    link: '/guide/implements/status-bar'
                                },
                                {
                                    text: '新增 UI',
                                    link: '/guide/implements/new-ui'
                                },
                                {
                                    text: '主动技能',
                                    link: '/guide/implements/skill'
                                },
                                {
                                    text: '新增按键',
                                    link: '/guide/implements/hotkey'
                                },
                                {
                                    text: '动画效果',
                                    link: '/guide/implements/animate'
                                },
                                {
                                    text: '选择框与确认框',
                                    link: '/guide/implements/choice'
                                }
                            ]
                        }
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
                    items: api
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
        // @ts-expect-error 类型错误
        plugins: [MermaidPlugin()],
        optimizeDeps: {
            include: ['mermaid']
        },
        ssr: {
            noExternal: ['mermaid']
        }
    }
});
