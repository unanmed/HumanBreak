main.floors.MT22 = {
    floorId: 'MT22',
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
    firstArrive: [],
    eachArrive: [],
    parallelDo: '',
    events: {
        '0,8': [
            {
                type: 'if',
                condition: 'flag:inWinter',
                true: ['\t[低级智人]\b[up,hero]没必要再回去了'],
                false: [
                    {
                        type: 'changeFloor',
                        floorId: 'MT21',
                        loc: [14, 8]
                    }
                ]
            }
        ],
        '3,9': [
            '第二章的加点已开启，可以在技能树的前置技能下方选择',
            '注意学习是一个非常重要的技能，需要尽快点开',
            '如果你玩过上个版本，直接跳到了本章，记得查看背包里面的各种道具，尤其是百科全书，同时注意左边是你来的方向，那里还有些怪物',
            '从现在开始，跳跃技能不再消耗生命值，别忘了你还有跳跃技能'
        ],
        '7,9': [
            '百科全书中已解锁第二章需要特别说明的怪物属性，你可以在百科全书中查看'
        ]
    },
    changeFloor: {
        '14,4': {
            floorId: 'MT23',
            loc: [0, 4]
        },
        '9,0': {
            floorId: 'MT24',
            loc: [9, 14]
        }
    },
    beforeBattle: {},
    afterBattle: {},
    afterGetItem: {},
    afterOpenDoor: {},
    autoEvent: {},
    cannotMove: {},
    cannotMoveIn: {},
    map: [
        [
            142, 142, 142, 142, 142, 142, 142, 142, 142, 91, 143, 143, 143, 143,
            143
        ],
        [
            142, 142, 142, 142, 142, 142, 142, 142, 142, 0, 143, 143, 143, 143,
            143
        ],
        [142, 142, 482, 482, 492, 0, 0, 0, 0, 0, 143, 491, 484, 143, 143],
        [142, 142, 142, 142, 142, 0, 0, 0, 0, 0, 143, 143, 494, 143, 143],
        [142, 142, 482, 482, 492, 0, 0, 484, 0, 441, 0, 0, 0, 0, 94],
        [142, 142, 142, 142, 142, 0, 0, 0, 0, 143, 143, 143, 143, 143, 143],
        [142, 142, 482, 482, 492, 0, 0, 484, 0, 494, 484, 491, 484, 143, 143],
        [142, 142, 142, 142, 142, 0, 0, 0, 0, 143, 143, 143, 143, 143, 143],
        [92, 0, 0, 0, 441, 0, 0, 484, 0, 0, 0, 0, 0, 143, 143],
        [143, 143, 0, 129, 0, 0, 0, 129, 0, 0, 0, 0, 0, 143, 143],
        [
            143, 143, 492, 143, 492, 143, 492, 143, 492, 143, 492, 143, 492,
            143, 143
        ],
        [
            143, 143, 482, 143, 482, 143, 482, 143, 482, 143, 482, 143, 482,
            143, 143
        ],
        [
            143, 143, 482, 143, 482, 143, 482, 143, 482, 143, 482, 143, 482,
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
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 144, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 144, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 144, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 144, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 144, 144, 144, 144, 144, 144, 144, 144],
        [0, 0, 0, 0, 0, 0, 0, 144, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 144, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 144, 0, 0, 0, 0, 0, 0, 0],
        [144, 144, 144, 144, 144, 144, 144, 144, 0, 0, 0, 0, 0, 0, 0],
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
