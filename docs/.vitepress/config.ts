import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: 'HTML5魔塔样板',
    description: 'HTML5魔塔样板V2.A的说明文档',
    base: '/_docs/',
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
            '/api/': [
                {
                    text: 'API列表',
                    items: [
                        { text: '概览', link: '/api/' },
                        {
                            text: '系统 API',
                            collapsed: true,
                            items: [
                                {
                                    text: 'Mota.require',
                                    link: '/api/system#require'
                                },
                                {
                                    text: 'Mota.requireAll',
                                    link: '/api/system#requireall'
                                },
                                {
                                    text: 'Mota.rewrite',
                                    link: '/api/system#rewrite'
                                },
                                {
                                    text: 'Mota.r',
                                    link: '/api/system#r'
                                },
                                {
                                    text: 'Mota.rf',
                                    link: '/api/system#rf'
                                },
                                {
                                    text: 'Mota.Plugin',
                                    link: '/api/system#plugin'
                                },
                                {
                                    text: 'Mota.Package',
                                    link: '/api/system#package'
                                }
                            ]
                        },
                        {
                            text: '类',
                            collapsed: true,
                            items: [
                                {
                                    text: 'EventEmitter',
                                    link: '/api/class/event-emitter'
                                },
                                {
                                    text: 'IndexedEventEmitter',
                                    link: '/api/class/indexed-event-emitter'
                                },
                                {
                                    text: 'Disposable',
                                    link: '/api/class/disposable'
                                },
                                {
                                    text: 'GameStorage',
                                    link: '/api/class/game-storage'
                                },
                                {
                                    text: 'MotaSetting',
                                    link: '/api/class/mota-setting'
                                },
                                {
                                    text: 'SettingDisplayer',
                                    link: '/api/class/setting-displayer'
                                },
                                {
                                    text: 'Focus',
                                    link: '/api/class/focus'
                                },
                                {
                                    text: 'GameUi',
                                    link: '/api/class/game-ui'
                                },
                                {
                                    text: 'UiController',
                                    link: '/api/class/ui-controller'
                                },
                                {
                                    text: 'Hotkey',
                                    link: '/api/class/hotkey'
                                },
                                {
                                    text: 'Keyboard',
                                    link: '/api/class/keyboard'
                                },
                                {
                                    text: 'CustomToolbar',
                                    link: '/api/class/custom-toolbar'
                                },
                                {
                                    text: 'AudioPlayer',
                                    link: '/api/class/audio-player'
                                },
                                {
                                    text: 'SoundEffect',
                                    link: '/api/class/sound-effect'
                                },
                                {
                                    text: 'SoundController',
                                    link: '/api/class/sound-controller'
                                },
                                {
                                    text: 'BgmController',
                                    link: '/api/class/bgm-controller'
                                },
                                {
                                    text: 'ResourceController',
                                    link: '/api/class/resource-controller'
                                },
                                {
                                    text: 'MComponent',
                                    link: '/api/class/m-component'
                                },
                                {
                                    text: 'Range',
                                    link: '/api/class/range'
                                },
                                {
                                    text: 'EnemyCollection',
                                    link: '/api/class/enemy-collection'
                                },
                                {
                                    text: 'DamageEnemy',
                                    link: '/api/class/damage-enemy'
                                }
                            ]
                        },
                        {
                            text: '函数',
                            collapsed: true,
                            items: [
                                {
                                    text: 'getHeroStatusOn',
                                    link: '/api/function#getherostatuson'
                                },
                                {
                                    text: 'getHeroStatusOf',
                                    link: '/api/function#getherostatusof'
                                },
                                {
                                    text: 'getEnemy',
                                    link: '/api/function#getenemy'
                                },
                                {
                                    text: 'm',
                                    link: '/api/function#m'
                                },
                                {
                                    text: 'unwrapBinary',
                                    link: '/api/function#unwrapbinary'
                                },
                                {
                                    text: 'checkAssist',
                                    link: '/api/function#checkassist'
                                },
                                {
                                    text: 'isAssist',
                                    link: '/api/function#isassist'
                                },
                                {
                                    text: 'generateKeyboardEvent',
                                    link: '/api/function#generatekeyboardevent'
                                },
                                {
                                    text: 'addAnimate',
                                    link: '/api/function#addanimate'
                                },
                                {
                                    text: 'removeAnimate',
                                    link: '/api/function#removeanimate'
                                }
                            ]
                        },
                        {
                            text: '变量',
                            collapsed: true,
                            items: [
                                {
                                    text: 'loading',
                                    link: '/api/var#loading'
                                },
                                {
                                    text: 'hook',
                                    link: '/api/var#hook'
                                },
                                {
                                    text: 'gameListener',
                                    link: '/api/var#gamelistener'
                                },
                                {
                                    text: 'mainSetting',
                                    link: '/api/var#mainsetting'
                                },
                                {
                                    text: 'gameKey',
                                    link: '/api/var#gamekey'
                                },
                                {
                                    text: 'mainUi',
                                    link: '/api/var#mainui'
                                },
                                {
                                    text: 'fixedUi',
                                    link: '/api/var#fixedui'
                                },
                                {
                                    text: 'KeyCode',
                                    link: '/api/var#keycode'
                                },
                                {
                                    text: 'ScanCode',
                                    link: '/api/var#scancode'
                                },
                                {
                                    text: 'bgm',
                                    link: '/api/var#bgm'
                                },
                                {
                                    text: 'sound',
                                    link: '/api/var#sound'
                                },
                                {
                                    text: 'settingStorage',
                                    link: '/api/var#settingstorage'
                                },
                                {
                                    text: 'status',
                                    link: '/api/var#status'
                                },
                                {
                                    text: 'enemySpecials',
                                    link: '/api/var#enemyspecials'
                                }
                            ]
                        },
                        {
                            text: '模块',
                            collapsed: true,
                            items: [
                                {
                                    text: 'CustomComponents',
                                    link: '/api/module/custom-components'
                                },
                                {
                                    text: 'Use',
                                    link: '/api/module/use'
                                },
                                {
                                    text: 'Mark',
                                    link: '/api/module/mark'
                                },
                                {
                                    text: 'KeyCodes',
                                    link: '/api/module/key-codes'
                                },
                                {
                                    text: 'UITools',
                                    link: '/api/module/ui-tools'
                                },
                                {
                                    text: 'Damage',
                                    link: '/api/module/damage'
                                },
                                {
                                    text: 'UI',
                                    link: '/api/module/ui'
                                },
                                {
                                    text: 'UIComponents',
                                    link: '/api/module/ui-components'
                                },
                                {
                                    text: 'MCGenerator',
                                    link: '/api/module/mc-generator'
                                },
                                {
                                    text: 'RenderUtils',
                                    link: '/api/module/render-utils'
                                },
                                {
                                    text: 'MiscComponents',
                                    link: '/api/module/misc-components'
                                }
                            ]
                        }
                    ]
                }
            ]
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
