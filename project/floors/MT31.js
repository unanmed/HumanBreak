main.floors.MT31 = {
    floorId: 'MT31',
    title: '智慧小径',
    name: '智慧小径',
    width: 15,
    height: 15,
    canFlyTo: true,
    canFlyFrom: true,
    canUseQuickShop: true,
    cannotViewMap: false,
    images: [],
    ratio: 2,
    defaultGround: 'grass',
    bgm: 'road.mp3',
    firstArrive: [
        '\t[低级智人]\b[up,hero]杰克，你为什么在这？',
        '\t[杰克,thief]\b[up,4,7]哟，咱好久不见了，我只是来这里寻找点东西。',
        '\t[低级智人]\b[up,hero]这里怪物这么强，你怎么能打败他？',
        '\t[杰克,thief]\b[up,4,7]我有我的特殊办法。',
        '\t[低级智人]\b[up,hero]那些...绿色宝石吗？',
        '\t[杰克,thief]\b[up,4,7]绿色宝石？我没见过那东西。',
        '\t[低级智人]\b[up,hero]那是什么办法呢？',
        '\t[杰克,thief]\b[up,4,7]这个你就不用操心了。',
        '\t[杰克,thief]\b[up,4,7]对了，有人让我给你说一句话。',
        '\t[杰克,thief]\b[up,4,7]时间会诉说真相，而历史不会。',
        '\t[杰克,thief]\b[up,4,7]即使历史是真实的。',
        '\t[低级智人]\b[up,hero]什么意思？',
        '\t[杰克,thief]\b[up,4,7]我也不清楚，不过我先走了，你慢慢理解。',
        {
            type: 'jump',
            from: [4, 7],
            dxy: [15, 0],
            time: 500
        },
        '\t[低级智人]\b[up,hero]...',
        '\t[低级智人]\b[up,hero]时间会诉说真相，而历史不会...',
        '\t[低级智人]\b[up,hero]能相信的只有时间，而历史能被篡改吗...',
        '\t[低级智人]\b[up,hero]历史是真实的，又为何不会诉说真相呢...',
        '\t[低级智人]\b[up,hero]完全不能理解。'
    ],
    eachArrive: [],
    parallelDo: '',
    events: {
        '14,7': [
            {
                type: 'if',
                condition: '(!flag:inWinter)',
                true: [
                    {
                        type: 'setCurtain',
                        color: [0, 0, 0, 1],
                        time: 1500,
                        keep: true
                    },
                    {
                        type: 'setText',
                        text: [0, 0, 0, 1],
                        background: 'winskin3.png'
                    },
                    '人类简史——进化篇',
                    {
                        type: 'playSound',
                        name: 'paper.mp3'
                    },
                    '经过了漫长的行走，他感到真相越来越接近。',
                    {
                        type: 'playSound',
                        name: 'paper.mp3'
                    },
                    '前方，是会将凛冽渗入骨髓的冰封雪原。',
                    {
                        type: 'playSound',
                        name: 'paper.mp3'
                    },
                    '这里，他将寻找到所谓的真相。',
                    {
                        type: 'changeFloor',
                        floorId: 'MT32',
                        loc: [0, 7]
                    },
                    {
                        type: 'setCurtain',
                        time: 1000
                    },
                    {
                        type: 'setText',
                        text: [255, 255, 255, 1],
                        background: 'winskin2.png'
                    },
                    '\t[低级智人]\b[up,hero]呼，好冷。',
                    '\t[低级智人]\b[up,hero]嗯？',
                    {
                        type: 'moveHero',
                        time: 250,
                        steps: ['right:1']
                    },
                    '\t[低级智人]\b[up,hero]这是杰克给我留下的衣服吗？',
                    '\t[低级智人]\b[up,hero]先穿上吧，这里太冷了。',
                    {
                        type: 'setValue',
                        name: 'flag:inWinter',
                        value: 'true'
                    }
                ],
                false: [
                    {
                        type: 'changeFloor',
                        floorId: 'MT32',
                        loc: [0, 7]
                    }
                ]
            }
        ],
        '2,6': [
            '注意右方的清怪检测是检测\r[gold]勇气之路\r[]的怪物，本区域的怪物不检测，可以暂时留怪'
        ],
        '13,7': [
            '这里是漏怪检测，会检测\r[gold]勇气之路\r[]区域是否有遗漏怪物',
            {
                type: 'function',
                function:
                    'function(){\nconst enemy = core.getRemainEnemyString(core.floorIds.slice(17, 22));\nif (enemy.length === 0) {\n\tcore.insertAction([\'当前无剩余怪物！\', { "type": "hide", "remove": true }, ]);\n} else {\n\tcore.insertAction(enemy);\n}\n}'
            }
        ]
    },
    changeFloor: {
        '0,7': {
            floorId: 'MT29',
            loc: [14, 8]
        }
    },
    beforeBattle: {},
    afterBattle: {
        '10,7': [
            '\t[智慧守护者,E577]\b[up,10,7]智慧！终于有人可以得到这些智慧了！',
            '\t[智慧守护者,E577]\b[up,10,7]终于要迎来结束战争的那一天了！',
            '\t[智慧守护者,E577]\b[up,10,7]我的任务终于完成了！！',
            '\t[低级智人]\b[up,hero]什么结束战争，什么完成任务？',
            {
                type: 'setBlock',
                number: 'I476',
                time: 1000
            },
            '\t[低级智人]\b[up,hero]哎，没问到啊...',
            '\t[低级智人]\b[up,hero]战争，又是什么意思呢？',
            '\t[低级智人]\b[up,hero]之前智慧之神也提过战争，但是我还没问我们就打起来了。',
            '\t[低级智人]\b[up,hero]之后应该就知道了。',
            {
                type: 'function',
                function: 'function(){\ncore.getNextItem()\n}'
            },
            {
                type: 'sleep',
                time: 1000
            },
            '\t[低级智人]\b[up,hero]！！！',
            '\t[低级智人]\b[up,hero]这种感觉！',
            '\t[低级智人]\b[up,hero]感觉前所未有的东西涌入了大脑。',
            '\t[低级智人]\b[up,hero]这就是智慧吗。',
            '\t[低级智人]\b[up,hero]原来如此。',
            '\t[低级智人]\b[up,hero]原来，智慧是这个意思。',
            '\t[低级智人]\b[up,hero]我明白了，我全都明白了。',
            '\t[低级智人]\b[up,hero]智慧，真的可以掌握万物。',
            {
                type: 'setValue',
                name: 'flag:door_MT31_7_6',
                operator: '+=',
                value: '1'
            }
        ]
    },
    afterGetItem: {},
    afterOpenDoor: {},
    autoEvent: {
        '7,5': {
            0: {
                condition: 'flag:door_MT31_7_6==1',
                currentFloor: true,
                priority: 0,
                delayExecute: false,
                multiExecute: false,
                data: [
                    {
                        type: 'openDoor'
                    },
                    {
                        type: 'setValue',
                        name: 'flag:door_MT31_7_6',
                        operator: '=',
                        value: 'null'
                    }
                ]
            },
            1: null
        },
        '7,9': {
            0: {
                condition: 'flag:door_MT31_7_6==1',
                currentFloor: true,
                priority: 0,
                delayExecute: false,
                multiExecute: false,
                data: [
                    {
                        type: 'openDoor'
                    },
                    {
                        type: 'setValue',
                        name: 'flag:door_MT31_7_6',
                        operator: '=',
                        value: 'null'
                    }
                ]
            },
            1: null
        }
    },
    cannotMove: {},
    cannotMoveIn: {},
    map: [
        [
            143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143,
            143, 143
        ],
        [
            143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143,
            143, 143
        ],
        [
            143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143,
            143, 143
        ],
        [
            143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143,
            143, 143
        ],
        [143, 143, 0, 0, 0, 0, 143, 491, 491, 468, 468, 466, 466, 143, 143],
        [143, 143, 0, 491, 491, 0, 143, 85, 143, 143, 143, 143, 143, 143, 143],
        [143, 143, 129, 0, 0, 0, 143, 0, 0, 0, 0, 0, 0, 143, 143],
        [92, 0, 0, 23, 123, 0, 497, 0, 0, 0, 577, 0, 0, 516, 94],
        [143, 143, 0, 0, 0, 0, 143, 0, 0, 0, 0, 0, 0, 143, 143],
        [143, 143, 0, 491, 491, 0, 143, 85, 143, 143, 143, 143, 143, 143, 143],
        [143, 143, 0, 0, 0, 0, 143, 491, 491, 468, 468, 467, 467, 143, 143],
        [
            143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143,
            143, 143
        ],
        [
            143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143,
            143, 143
        ],
        [
            143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143,
            143, 143
        ],
        [
            143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143, 143,
            143, 143
        ]
    ],
    bgmap: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [
            144, 144, 144, 144, 144, 144, 144, 144, 144, 144, 144, 144, 144,
            144, 144
        ],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    fgmap: [],
    bg2map: [],
    fg2map: []
};
