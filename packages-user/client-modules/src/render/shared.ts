import { ElementLocator } from '@motajs/render-core';
import { Font } from '@motajs/render-style';

// 本文件为 UI 配置文件，你可以修改下面的每个常量来控制 UI 的显示参数，每个常量都有注释说明

//#region 地图

/** 每个格子的默认宽度，现阶段用处不大 */
export const CELL_WIDTH = 32;
/** 每个格子的默认高度，现阶段用处不大 */
export const CELL_HEIGHT = 32;
/** 每个格子的宽高 */
export const CELL_SIZE = 32;
/** 地图格子宽度，此处仅影响画面，可能不影响游戏内的部分逻辑，游戏内逻辑地图大小请在 core.js 中修改 */
export const MAP_BLOCK_WIDTH = 15;
/** 地图格子高度，此处仅影响画面，可能不影响游戏内的部分逻辑，游戏内逻辑地图大小请在 core.js 中修改 */
export const MAP_BLOCK_HEIGHT = 15;
/** 地图像素宽度 */
export const MAP_WIDTH = CELL_SIZE * MAP_BLOCK_WIDTH;
/** 地图像素高度 */
export const MAP_HEIGHT = CELL_SIZE * MAP_BLOCK_HEIGHT;
/** 地图宽度的一半 */
export const HALF_MAP_WIDTH = MAP_WIDTH / 2;
/** 地图高度的一半 */
export const HALF_MAP_HEIGHT = MAP_HEIGHT / 2;
/**
 * 动态内容预留，不明白含义的话不要动。地图上所有正在移动的图块称为动态内容，这些内容的数量无法预测，因此需要预留数组大小，
 * 如果不够再临时扩充。如果你的塔中有大量的移动操作，可以适当提高此值，避免频繁的内存扩充行为，可以一定程度上提高性能表现。
 */
export const DYNAMIC_RESERVE = 16;
/**
 * 移动图块容忍度，不明白含义的话不要动。如果移动图块的数量长期小于当前预留数量，那么将会降低预留数量，提升性能表现。
 * 调整此值可以调整频率，值越大，越不容易因为数量小于预留数量而减小预留。
 */
export const MOVING_TOLERANCE = 60;
/** 开关门动画的动画时长 */
export const DOOR_ANIMATE_INTERVAL = 50;

//#region 状态栏

/** 状态栏像素宽度 */
export const STATUS_BAR_WIDTH = 180;
/** 状态栏像素高度 */
export const STATUS_BAR_HEIGHT = 32 * MAP_BLOCK_HEIGHT;
/** 右侧状态栏的横坐标 */
export const RIGHT_STATUS_POS = STATUS_BAR_WIDTH + MAP_WIDTH;
/** 是否启用右侧状态栏 */
export const ENABLE_RIGHT_STATUS_BAR = true;
/** 状态栏数量，启用右侧状态栏为两个，不启用为一个 */
export const STATUS_BAR_COUNT = ENABLE_RIGHT_STATUS_BAR ? 2 : 1;
/** 状态栏宽度的一半 */
export const HALF_STATUS_WIDTH = STATUS_BAR_WIDTH / 2;

//#region 游戏画面

/** 游戏画面像素宽度，宽=地图宽度+状态栏宽度*状态栏数量 */
export const MAIN_WIDTH = MAP_WIDTH + STATUS_BAR_WIDTH * STATUS_BAR_COUNT;
/** 游戏画面像素高度 */
export const MAIN_HEIGHT = MAP_HEIGHT;
/** 游戏画面宽度的一半 */
export const HALF_WIDTH = MAIN_WIDTH / 2;
/** 游戏画面高度的一半 */
export const HALF_HEIGHT = MAIN_HEIGHT / 2;
/** 全屏显示的 loc */
export const FULL_LOC: ElementLocator = [0, 0, MAIN_WIDTH, MAIN_HEIGHT];
/** 居中显示的 loc */
export const CENTER_LOC: ElementLocator = [
    HALF_WIDTH,
    HALF_HEIGHT,
    void 0,
    void 0,
    0.5,
    0.5
];

//#region 通用配置

/** 弹框的宽度，使用在内置 UI 与组件中，包括确认框、选择框、等待框等 */
export const POP_BOX_WIDTH = MAP_WIDTH / 2;
/** 默认字体 */
export const DEFAULT_FONT = new Font('normal', 18);

//#region 存档界面

/** 存档缩略图尺寸 */
export const SAVE_ITEM_SIZE = MAP_BLOCK_WIDTH * 10;
/** 单个存档上方显示第几号存档的高度 */
export const SAVE_ITEM_TOP = 24;
/** 单个存档下方显示这个存档信息的高度 */
export const SAVE_ITEM_DOWN = 24;
/** 单个存档高度，包括存档下方的信息 */
export const SAVE_ITEM_HEIGHT = SAVE_ITEM_SIZE + SAVE_ITEM_TOP + SAVE_ITEM_DOWN;
/** 存档间距 */
export const SAVE_INTERVAL = 30;
/** 存档下巴高度，即下方显示页码和返回按钮的高度 */
export const SAVE_DOWN_PAD = 30;
/** 存档页码数，调高并不会影响性能，但是如果玩家存档太多的话会导致存档体积很大 */
export const SAVE_PAGES = 1000;

//#region 标题界面

/** 标题文字宽度 */
export const TITLE_WIDTH = 640;
/** 标题文字高度 */
export const TITLE_HEIGHT = 100;
/** 标题文字宽度的一半 */
export const HALF_TITLE_WIDTH = TITLE_WIDTH / 2;
/** 标题文字高度的一半 */
export const HALF_TITLE_HEIGHT = TITLE_HEIGHT / 2;
/** 标题文字中心横坐标 */
export const TITLE_X = HALF_WIDTH;
/** 标题文字中心纵坐标 */
export const TITLE_Y = 120;

/** 标题界面按钮宽度，如果文字被裁剪可以考虑扩大此值 */
export const BUTTONS_WIDTH = 200;
/** 标题界面按钮高度，如果文字被裁剪可以考虑扩大此值 */
export const BUTTONS_HEIGHT = 160;
/** 标题界面按钮左上角横坐标 */
export const BUTTONS_X = 50;
/** 标题界面按钮左上角纵坐标 */
export const BUTTONS_Y = MAIN_HEIGHT - BUTTONS_HEIGHT;
