/** 工具类 主要用来进行一些辅助函数的计算 */
declare class utils {
    /**
     * 将一段文字中的${}（表达式）进行替换。
     * @example core.replaceText('衬衫的价格是${status:hp}镑${item:yellowKey}便士。'); // 把主角的生命值和持有的黄钥匙数量代入这句话
     * @param text 模板字符串，可以使用${}计算js表达式，支持“状态、物品、变量、独立开关、全局存储、图块id、图块类型、敌人数据、装备id”等量参与运算
     * @returns 替换完毕后的字符串
     */
    replaceText(text: string, prefix?: string): string;

    /**
     * 对一个表达式中的特殊规则进行替换，如status:xxx等。
     * @example core.replaceValue('衬衫的价格是${status:hp}镑${item:yellowKey}便士。'); // 把这两个冒号表达式替换为core.getStatus('hp')和core.itemCount('yellowKey')这样的函数调用
     * @param value 模板字符串，注意独立开关不会被替换
     * @returns 替换完毕后的字符串
     */
    replaceValue(value: string): string;

    /**
     * 计算一个表达式的值，支持status:xxx等的计算。
     * @example core.calValue('status:hp + status:def'); // 计算主角的生命值加防御力
     * @param value 待求值的表达式
     * @param prefix 独立开关前缀，一般可省略
     * @returns 求出的值
     */
    calValue(value: string, prefix?: string): any;

    /**
     * 将b（可以是另一个数组）插入数组a的开头，此函数用于弥补a.unshift(b)中b只能是单项的不足。
     * @example core.unshift(todo, {type: 'unfollow'}); // 在事件指令数组todo的开头插入“取消所有跟随者”指令
     * @param a 原数组
     * @param b 待插入的新首项或前缀数组
     * @returns 插入完毕后的新数组，它是改变原数组a本身得到的
     */
    unshift(a: any[], b: any): any[];

    /**
     * 将b（可以是另一个数组）插入数组a的末尾，此函数用于弥补a.push(b)中b只能是单项的不足。
     * @example core.push(todo, {type: 'unfollow'}); // 在事件指令数组todo的末尾插入“取消所有跟随者”指令
     * @param a 原数组
     * @param b 待插入的新末项或后缀数组
     * @returns 插入完毕后的新数组，它是改变原数组a本身得到的
     */
    push(a: any[], b: any): any[];

    /**
     * 设置一个全局存储，适用于global:xxx，录像播放时将忽略此函数。
     * @example core.setBlobal('一周目已通关', true); // 设置全局存储“一周目已通关”为true，方便二周目游戏中的新要素。
     * @param key 全局变量名称，支持中文
     * @param value 全局变量的新值，不填或null表示清除此全局存储
     */
    setGlobal(key: string, value?: any): void;

    /**
     * 读取一个全局存储，适用于global:xxx，支持录像。
     * @example if (core.getGlobal('一周目已通关', false) === true) core.getItem('dagger'); // 二周目游戏进行到此处时会获得一把屠龙匕首
     * @param key 全局变量名称，支持中文
     * @param defaultValue 可选，当此全局变量不存在或值为null、undefined时，用此值代替
     * @returns 全局变量的值
     */
    getGlobal(key: string, defaultValue?: any): any;

    /**
     * 深拷贝一个对象(函数将原样返回)
     * @example core.clone(core.status.hero, (name, value) => (name == 'items' || typeof value == 'number'), false); // 深拷贝主角的属性和道具
     * @param data 待拷贝对象
     * @param filter 过滤器，可选，表示data为数组或对象时拷贝哪些项或属性，true表示拷贝
     * @param recursion 过滤器是否递归，可选。true表示过滤器也被递归
     * @returns 拷贝的结果，注意函数将原样返回
     */
    clone<T>(
        data?: T,
        filter?: (name: string, value: any) => boolean,
        recursion?: boolean
    ): T;

    /** 深拷贝一个1D或2D的数组 */
    cloneArray(
        data?: Array<number> | Array<Array<number>>
    ): Array<number> | Array<Array<number>>;

    /**
     * 等比例切分一张图片
     * @example core.splitImage(core.material.images.images['npc48.png'], 32, 48); // 把npc48.png切分成若干32×48px的小人
     * @param image 图片名（支持映射前的中文名）或图片对象（参见上面的例子），获取不到时返回[]
     * @param width 子图的宽度，单位为像素。原图总宽度必须是其倍数，不填视为32
     * @param height 子图的高度，单位为像素。原图总高度必须是其倍数，不填视为正方形
     * @returns 子图组成的数组，在原图中呈先行后列，从左到右、从上到下排列。
     */
    splitImage(
        image?: string | HTMLImageElement,
        width?: number,
        height?: number
    ): HTMLImageElement[];

    /**
     * 大数字格式化，单位为10000的倍数（w,e,z,j,g），末尾四舍五入
     * @example core.formatBigNumber(123456789, false); // "12346w"
     * @param x 原数字
     * @param onMap 可选，true表示用于地图显伤，结果总字符数最多为5，否则最多为6
     * @returns 格式化结果
     */
    formatBigNumber(
        x: number | string,
        onMap?: boolean,
        onCritical?: boolean
    ): string;

    /** 变速移动 */
    applyEasing(mode?: string): (number) => number;

    /**
     * 颜色数组转十六进制
     * @example core.arrayToRGB([102, 204, 255]); // "#66ccff"，加载画面的宣传色
     * @param color 一行三列的数组，各元素必须为不大于255的自然数
     * @returns 该颜色的十六进制表示，使用小写字母
     */
    arrayToRGB(color: [number, number, number]): string;

    /**
     * 颜色数组转字符串
     * @example core.arrayToRGBA([102, 204, 255]); // "rgba(102,204,255,1)"
     * @param color 一行三列或一行四列的数组，前三个元素必须为不大于255的自然数。第四个元素（如果有）必须为0或不大于1的数字，第四个元素不填视为1
     * @returns 该颜色的字符串表示
     */
    arrayToRGBA(color: [number, number, number, number?] | string): string;

    /**
     * 录像一压，其结果会被再次base64压缩
     * @example core.encodeRoute(core.status.route); // 一压当前录像
     * @param route 原始录像，自定义内容（不予压缩，原样写入）必须由0-9A-Za-z和下划线、冒号组成，所以中文和数组需要用JSON.stringify预处理再base64压缩才能交由一压
     * @returns 一压的结果
     */
    encodeRoute(route: string[]): string;

    /**
     * 录像解压的最后一步，即一压的逆过程
     * @example core.decodeRoute(core.encodeRoute(core.status.route)); // 一压当前录像再解压-_-|
     * @param route 录像解压倒数第二步的结果，即一压的结果
     * @returns 原始录像
     */
    decodeRoute(route: string): string[];

    /**
     * 判断一个值是否不为null，undefined和NaN
     * @example core.isset(0/0); // false，因为0/0等于NaN
     * @param v 待测值，可选
     * @returns false表示待测值为null、undefined、NaN或未填写，true表示为其他值。即!(v == null || v != v)
     */
    isset(v?: any): boolean;

    /**
     * 判定一个数组是否为另一个数组的前缀，用于录像接续播放。请注意函数名没有大写字母
     * @example core.subarray(['ad', '米库', '小精灵', '小破草', '小艾'], ['ad', '米库', '小精灵']); // ['小破草', '小艾']
     * @param a 可能的母数组，不填或比b短将返回null
     * @param b 可能的前缀，不填或比a长将返回null
     * @returns 如果b不是a的前缀将返回null，否则将返回a去掉此前缀后的剩余数组
     */
    subarray(a?: any[], b?: any[]): any[] | null;

    /**
     * 判定array是不是一个数组，以及element是否在该数组中。
     * @param array 可能的数组，不为数组或不填将导致返回值为false
     * @param element 待查找的元素
     * @returns 如果array为数组且具有element这项，就返回true，否则返回false
     */
    inArray(array?: any, element?: any): boolean;

    /**
     * 将x限定在[a,b]区间内，注意a和b可交换
     * @example core.clamp(1200, 1, 1000); // 1000
     * @param x 原始值，!x为true时x一律视为0
     * @param a 下限值，大于b将导致与b交换
     * @param b 上限值，小于a将导致与a交换
     */
    clamp(x: number, a: number, b: number): number;

    /**
     * 填写非自绘状态栏
     * @example core.setStatusBarInnerHTML('hp', core.status.hero.hp, 'color: #66CCFF'); // 更新状态栏中的主角生命，使用加载画面的宣传色
     * @param name 状态栏项的名称，如'hp', 'atk', 'def'等。必须是core.statusBar中的一个合法项
     * @param value 要填写的内容，大数字会被格式化为至多6个字符，无中文的内容会被自动设为斜体
     * @param css 额外的css样式，可选。如更改颜色等
     */
    setStatusBarInnerHTML(name: string, value: any, css?: string): void;

    /**
     * 求字符串的国标码字节数，也可用于等宽字体下文本的宽度测算。请注意样板的默认字体Verdana不是等宽字体
     * @example core.strlen('无敌ad'); // 6
     * @param str 待测字符串
     * @returns 字符串的国标码字节数，每个汉字为2，每个ASCII字符为1
     */
    strlen(str: string): number;

    /**
     * 通配符匹配，用于搜索图块等批量处理。
     * @example core.playSound(core.matchWildcard('*Key', itemId) ? 'item.mp3' : 'door.mp3'); // 判断捡到的是钥匙还是别的道具，从而播放不同的音效
     * @param pattern 模式串，每个星号表示任意多个（0个起）字符
     * @param string 待测串
     * @returns true表示匹配成功，false表示匹配失败
     */
    matchWildcard(pattern: string, string: string): boolean;

    /**
     * base64加密
     * @example core.encodeBase64('If you found this note in a small wooden box with a heart on it'); // "SWYgeW91IGZvdW5kIHRoaXMgbm90ZSBpbiBhIHNtYWxsIHdvb2RlbiBib3ggd2l0aCBhIGhlYXJ0IG9uIGl0"
     * @param str 明文
     * @returns 密文
     */
    encodeBase64(str: string): string;

    /**
     * base64解密
     * @example core.decodeBase64('SWYgeW91IGZvdW5kIHRoaXMgbm90ZSBpbiBhIHNtYWxsIHdvb2RlbiBib3ggd2l0aCBhIGhlYXJ0IG9uIGl0'); // "If you found this note in a small wooden box with a heart on it"
     * @param str 密文
     * @returns 明文
     */
    decodeBase64(str: string): string;

    /**
     * 不支持SL的随机数
     * @exmaple 1 + core.rand(6); // 随机生成一个小于7的正整数，模拟骰子的效果
     * @param num 填正数表示生成小于num的随机自然数，否则生成小于1的随机正数
     * @returns 随机数，即使读档也不会改变结果
     */
    rand(num?: number): number;

    /**
     * 支持SL的随机数，并计入录像
     * @exmaple 1 + core.rand2(6); // 随机生成一个小于7的正整数，模拟骰子的效果
     * @param num 正整数，0或不填会被视为2147483648
     * @returns 属于 [0, num) 的随机数
     */
    rand2(num?: number): number;

    /**
     * 弹窗请求下载一个文本文件
     * @example core.download('route.txt', core.status.route); // 弹窗请求下载录像
     * @param filename 文件名
     * @param content 文件内容
     */
    download(filename: string, content: string | String[]): void;

    /**
     * 显示确认框，类似core.drawConfirmBox()
     * @example core.myconfirm('重启游戏？', core.restart); // 弹窗询问玩家是否重启游戏
     * @param hint 弹窗的内容
     * @param yesCallback 确定后的回调函数
     * @param noCallback 取消后的回调函数，可选
     */
    myconfirm(
        hint: string,
        yesCallback: () => void,
        noCallback?: () => void
    ): void;

    /**
     * 判定深层相等, 会逐层比较每个元素
     * @example core.same(['1', 2], ['1', 2]); // true
     */
    same(a?: any, b?: any): boolean;

    /**
     * 尝试请求读取一个本地文件内容 [异步]
     * @param success 成功后的回调
     * @param error 失败后的回调
     * @param readType 不设置则以文本读取，否则以DataUrl形式读取
     */
    readFile(success, error, readType): void;

    /**
     * 文件读取完毕后的内容处理 [异步]
     * @param content
     */
    readFileContent(content): void;

    /**
     * 尝试复制一段文本到剪切板。
     */
    copy(data: string): void;

    /**
     * 发送一个HTTP请求 [异步]
     * @param type 请求类型
     * @param url 目标地址
     * @param formData 如果是POST请求则为表单数据
     * @param success 成功后的回调
     * @param error 失败后的回调
     */
    http(
        type: 'GET' | 'POST',
        url: string,
        formData: FormData,
        success: () => void,
        error: () => void
    ): void;

    /** 获得浏览器唯一的guid */
    getGuid(): string;

    /** 解压缩一个数据 */
    decompress(value: any): any;

    /** 设置本地存储 */
    setLocalStorage(key: string, value?: any): void;

    /** 获得本地存储 */
    getLocalStorage(key: string, defaultValue?: any): any;

    /** 移除本地存储 */
    removeLocalStorage(key: string): void;

    /** 往数据库写入一段数据 */
    setLocalForage(
        key: string,
        value?: any,
        successCallback?: () => void,
        errorCallback?: () => void
    ): void;

    /** 从数据库读出一段数据 */
    getLocalForage(
        key: string,
        defaultValue?: any,
        successCallback?: (data: any) => void,
        errorCallback?: () => void
    ): void;

    /** 移除数据库的数据 */
    removeLocalForage(
        key: string,
        successCallback?: () => void,
        errorCallback?: () => void
    ): void;

    /** 格式化日期为字符串 */
    formatDate(date: Date): string;

    /** 格式化日期为最简字符串 */
    formatDate2(date: Date): string;

    /** 格式化时间 */
    formatTime(time: number): string;

    /** 两位数显示 */
    setTwoDigits(x: number): string;

    /** 格式化文件大小 */
    formatSize(size: number): string;

    /** 访问浏览器cookie */
    getCookie(name: string): string;

    /**
     * 计算应当转向某个方向
     * @param turn 转向的方向
     * @param direction 当前方向
     */
    turnDirection(
        turn: 'up' | 'down' | 'left' | 'right' | ':left' | ':right' | ':back',
        direction?: string
    ): string;

    /** 是否满足正则表达式 */
    matchRegex(pattern: string, string: string): string;

    /** 让用户输入一段文字 */
    myprompt(
        hint: string,
        value: string,
        callback?: (data?: string) => any
    ): void;

    /** 动画显示某对象 */
    showWithAnimate(obj?: any, speed?: number, callback?: () => any): void;

    /** 动画使某对象消失 */
    hideWithAnimate(obj?: any, speed?: number, callback?: () => any): void;

    /** 解压一段内容 */
    unzip(
        blobOrUrl?: any,
        success?: (data: any) => void,
        error?: (error: string) => void,
        convertToText?: boolean,
        onprogress?: (loaded: number, total: number) => void
    ): void;
}

interface TextContentConfig {
    left?: number;
    top?: number;
    maxWidth?: number;
    color?: rgbarray | string;
    align?: 'left' | 'center' | 'right';
    fontSize: number;
    lineHeight?: number;
    time?: number;
    font?: string;
    letterSpacing?: number;
    bold?: boolean;
    italic?: boolean;
}

type direction = 'up' | 'down' | 'left' | 'right';
type move = 'forward' | direction;
type loc = { direction: direction; x: number; y: number };
type rgbarray = [number, number, number, number];
type BlockCls =
    | 'terrain'
    | 'animate'
    | 'enemy'
    | 'item'
    | 'enemy48'
    | 'npcs'
    | 'npc48'
    | 'autotile'
    | 'tilesets';

type Events = MotaAction[] | string;

type Block = {
    x: number;
    y: number;
    id: number;
    event: {
        cls: string;
        id: string;
        [key: string]: any;
    };
};

type frameObj = {
    angle: number;
    index: number;
    mirror: number;
    opacity: number;
    x: number;
    y: number;
    zoom: number;
};

type CtxRefer =
    | string
    | CanvasRenderingContext2D
    | HTMLCanvasElement
    | HTMLImageElement;

type Animate = {
    frame: number;
    frames: frameObj[][];
    images: HTMLImageElement[];
    ratio: number;
    se: string;
};

type Floor = {
    title: string;
    ratio: number;
};

type ResolvedMap = {
    floorId: string;
    afterBattle: { [x: string]: Events };
    afterOpenDoor: { [x: string]: Events };
    afterGetItem: { [x: string]: Events };
    autoEvent: Event;
    beforeBattle: { [x: string]: Events };
    canFlyFrom: boolean;
    canFltTo: boolean;
    canUseQuickShop: boolean;
    cannotMove: Object;
    cannotMoveIn: Object;
    cannotViewMap: boolean;
    changeFloor: {
        [x: string]: {
            floorId: ':before' | ':after' | ':now' | string;
            loc?: [number, number];
            stair?:
                | 'upFloor'
                | 'downFloor'
                | ':symmetry'
                | ':symmetry_x'
                | ':symmetry_y'
                | 'flyPoint';
            direction?:
                | 'left'
                | 'right'
                | 'up'
                | 'down'
                | ':left'
                | ':right'
                | ':back'
                | ':hero'
                | ':backhero';
            time?: number;
            ignoreChangeFloor?: boolean;
        };
    };
    defaultGround: string;
    bgm: string | Array<string>;
    bgmap: number[][];
    /** 事件层 */
    map: number[][];
    fgmap: number[][];
    width: number;
    height: number;
    images: Array<{
        canvas: 'bg' | 'auto' | 'fg';
        name: string;
        x: number;
        y: number;
        reverse?: ':x' | ':y' | ':o';
        disable?: boolean;
        sx?: number;
        sy?: number;
        w?: number;
        h?: number;
        frame?: number;
    }>;
    name: string;
    ratio: number;
    title: string;
    weather: [string, number];
    blocks: Array<Block>;
};

type Enemy = {
    id: string;
    name: string;
    displayIdInBook: string;
    special: number[];
    hp: number;
    atk: number;
    def: number;
    money: number;
    exp: number;
    point: number;
    [key: string]: any;
};

type DetailedEnemy = {
    name: string;
    specialText: string[];
    specialColor: (string | rgbarray)[];
    damage: number;
    critical: number;
    criticalDamage: number;
    defDamage: number;
    toShowSpecial?: string[];
    toShowColor?: any[];
    damageColor?: string;
};

type Item = {
    cls: string;
    [key: string]: any;
};

type Save = {};

type MotaAction =
    | {
          type: string;
          [key: string]: any;
      }
    | string;

type SystemFlags = {
    enableXxx: boolean;
    flyNearStair: boolean;
    steelDoorWithoutKey: boolean;
    betweenAttackMax: boolean;
    ignoreChangeFloor: boolean;
    disableShopOnDamage: boolean;
    blurFg: boolean;
};

type event = { type: string; [key: string]: any };

type step = 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward';
