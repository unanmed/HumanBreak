import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: 'HTML5魔塔样板',
    description: 'HTML5魔塔样板V2.A的说明文档',
    base: '/docs/',
    themeConfig: {
        outline: [2, 3],
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: '主页', link: '/' },
            { text: '指南', link: '/guide/diff' },
            { text: 'API', link: '/api/' }
        ],

        sidebar: {
            '/guide/': [
                {
                    text: '指南',
                    items: [
                        { text: '差异说明', link: '/guide/diff' },
                        { text: '系统说明', link: '/guide/system' },
                        { text: '战斗系统', link: '/guide/battle' },
                        { text: 'UI编写', link: '/guide/ui' },
                        { text: 'UI系统', link: '/guide/ui-control' },
                        { text: '事件触发系统', link: '/guide/event-emitter' },
                        {
                            text: '音频系统',
                            link: '/guide/audio',
                            items: [
                                {
                                    text: 'BGM系统',
                                    link: '/guide/audio#bgm-系统'
                                },
                                {
                                    text: '音效系统',
                                    link: '/guide/audio#音效系统'
                                }
                            ]
                        },
                        { text: '设置系统', link: '/guide/setting' },
                        { text: '存储系统', link: '/guide/storage' },
                        { text: '按键系统', link: '/guide/hotkey' }
                    ]
                }
            ],
            '/api/': [{ text: 'API列表', items: [] }]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
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
    }
});
